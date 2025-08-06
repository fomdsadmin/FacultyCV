import pandas as pd
import numpy as np
import io
import boto3
import os
import psycopg2
import json
from datetime import datetime
from databaseConnect import get_connection

s3_client = boto3.client("s3")
sm_client = boto3.client('secretsmanager')
cognito_client = boto3.client('cognito-idp')
DB_PROXY_ENDPOINT = os.environ.get('DB_PROXY_ENDPOINT')
USER_POOL_ID = os.environ.get('USER_POOL_ID')

SECTION_10CE = "10[c-e]. Memberships on Committees, Faculty Mentoring, and Other Service"
SECTION_11CD = "11[c-d]. Memberships on Hospital Committees, and Other Service"

# Type-to-specific subsection mapping
TYPE_SUBSECTION_MAPPING = {
    # SQL database values -> App section values (10[c-e].)
    "University Committee": "c. Memberships on University Committee",
    "University Faculty Mentoring": "d. University Faculty Mentoring", 
    "University Other Service:": "e. Other",
    
    # SQL database values -> App section values (11[c-d])
    "Hospital Committee": "c. Memberships on Hospital Committees",
    "Hospital Other Service:": "d. Other",
    
}

def cleanData(df):
    """
    Cleans the input DataFrame by performing various transformations:
    """
    # Only keep rows where UserID is a string of expected length (e.g., 32)
    df["user_id"] = df["PhysicianID"].astype(str).str.strip()
    df["details"] =  df["Details"].fillna('').str.strip()
    df["highlight_notes"] =  df["Notes"].fillna('').str.strip()
    df["highlight"] = df["Highlight"].str.strip().str.lower().map({'true': True, 'false': False})

    # If Type is "Other:", set type_of_leave to "Other ({type_other})"
    df["type"] =  df["Type"].fillna('').str.strip()
    df["type_other"] =  df["TypeOther"].fillna('').str.strip()
    
    # Map known types
    for obgyn_type, fac360_type in TYPE_SUBSECTION_MAPPING.items():
        mask = df["type"].str.strip().str.lower() == obgyn_type.strip().lower()
        df.loc[mask, "type"] = fac360_type

    # Handle "Other" types with free text (already present)
    mask_univ_other = df["Type"].str.strip() == "University Other Service:"
    df.loc[mask_univ_other & df["type_other"].ne(""), "type"] = (
        "e. Other (" + df.loc[mask_univ_other & df["type_other"].ne(""), "type_other"] + ")"
    )
    mask_hosp_other = df["Type"].str.strip() == "Hospital Other Service:"
    df.loc[mask_hosp_other & df["type_other"].ne(""), "type"] = (
        "d. Other (" + df.loc[mask_hosp_other & df["type_other"].ne(""), "type_other"] + ")"
    )

    # Assign any remaining unknown types to a default "e. Other (Unknown: <original>)"
    known_types = list(TYPE_SUBSECTION_MAPPING.values())
    mask_unknown = ~df["type"].isin(known_types) & ~mask_univ_other & ~mask_hosp_other
    df.loc[mask_unknown, "type"] = "e. Other (Unknown: " + df.loc[mask_unknown, "Type"].astype(str).str.strip() + ")"

    # Convert Unix timestamps to date strings; if missing or invalid, result is empty string
    if "TDate" in df.columns:
        # Handle zero and negative timestamps - set as blank for invalid values
        df["TDate_clean"] = pd.to_numeric(df["TDate"], errors='coerce')
        df["start_date"] = df["TDate_clean"].apply(lambda x:
            '' if pd.isna(x) or x <= 0 else
            pd.to_datetime(x, unit='s', errors='coerce').strftime('%B, %Y') if not pd.isna(pd.to_datetime(x, unit='s', errors='coerce')) else ''
        )
        df["start_date"] = df["start_date"].fillna('').str.strip()
    else:
        df["start_date"] = ''
    
    if "TDateEnd" in df.columns:
        # Handle zero and negative timestamps - set as blank for invalid values (including zero)
        df["TDateEnd_clean"] = pd.to_numeric(df["TDateEnd"], errors='coerce')
        df["end_date"] = df["TDateEnd_clean"].apply(lambda x:
            '' if pd.isna(x) or x <= 0 else  # Zero and negative are blank
            pd.to_datetime(x, unit='s', errors='coerce').strftime('%B, %Y') if not pd.isna(pd.to_datetime(x, unit='s', errors='coerce')) else ''
        )
        df["end_date"] = df["end_date"].fillna('').str.strip()
    else:
        df["end_date"] = ''
    # Combine start and end dates into a single 'dates' column:
    def combine_dates(row):
        if row["start_date"] and row["end_date"]:
            return f"{row['start_date']} - {row['end_date']}"
        elif row["start_date"]:
            return row["start_date"]
        elif row["end_date"]:
            return row["end_date"]
        else:
            return ""
    df["dates"] = df.apply(combine_dates, axis=1)


    # Keep only the cleaned columns
    df = df[["user_id", "details", "type", "highlight_notes", "highlight", "dates"]]
    # Replace NaN with empty string for all columns
    df = df.replace({np.nan: ''})
    return df


def storeData(df, connection, cursor, errors, rows_processed, rows_added_to_db):
    """
    Store the cleaned DataFrame into the database based on type.
    Returns updated rows_processed and rows_added_to_db.
    """
    # Cache for section IDs to avoid repeated lookups
    section_id_cache = {}

    for i, row in df.iterrows():
        # Determine which main section based on the type letter
        type_letter = row['type'].split('.')[0].strip().lower()

        if row['type'].startswith('c. Memberships on University Committee') or \
            row['type'].startswith('d. University Faculty Mentoring') or \
            row['type'].startswith('e. Other'):
            section_title = SECTION_10CE
        elif row['type'].startswith('c. Memberships on Hospital Committees') or \
            row['type'].startswith('d. Other'):
            section_title = SECTION_11CD
        else:
            # Default: put all other/unknown types in SECTION_10CE as "e. Other"
            section_title = SECTION_10CE
            errors.append(f"Unknown type for row {i}: {row['type']} (defaulted to SECTION_10CE)")

        # Get the section ID (using cache if available)
        data_section_id = None
        if section_title in section_id_cache:
            data_section_id = section_id_cache[section_title]
        else:
            try:
                cursor.execute(
                    """
                    SELECT data_section_id FROM data_sections
                    WHERE title = %s
                    LIMIT 1
                    """,
                    (section_title,)
                )
                result = cursor.fetchone()
                if result:
                    data_section_id = result[0]
                    section_id_cache[section_title] = data_section_id
                else:
                    errors.append(f"No data_section_id found for '{section_title}'")
            except Exception as e:
                errors.append(f"Error fetching data_section_id: {str(e)}")

        if not data_section_id:
            errors.append(f"Skipping insert for row {i}: data_section_id not found")
            rows_processed += 1
            continue

        # Prepare row data for insertion
        row_dict = row.to_dict()
        row_dict.pop('user_id', None)  # Remove user_id from data_details
        data_details_JSON = json.dumps(row_dict)

        try:
            cursor.execute(
                """
                INSERT INTO user_cv_data (user_id, data_section_id, data_details, editable)
                VALUES (%s, %s, %s, %s)
                """,
                (row['user_id'], data_section_id, data_details_JSON, True)
            )
            rows_added_to_db += 1
            print(f"Added row {i+1}/{len(df)} to {section_title} as {row['type']}")
        except Exception as e:
            errors.append(f"Error inserting row {i}: {str(e)}")
        finally:
            rows_processed += 1

    connection.commit()
    return rows_processed, rows_added_to_db


"""
Fetch the raw csv data from s3
:param bucket: str, the name of the target bucket
:param key_raw: str, the key (path) to the raw csv file
:return StringIO file-like object
"""
def fetchFromS3(bucket, key):
    s3 = boto3.resource('s3')
    s3_bucket_raw = s3.Object(bucket, key)
    response = s3_bucket_raw.get()
    file_bytes = response["Body"].read()
    return file_bytes

def loadData(file_bytes, file_key):
    """
    Loads a DataFrame from file bytes based on file extension (.csv or .xlsx).
    Handles CSV, JSON lines, and JSON array files.
    """
    if file_key.lower().endswith('.xlsx'):
        return pd.read_excel(io.BytesIO(file_bytes))
    elif file_key.lower().endswith('.csv'):
        # Try reading as regular CSV first
        try:
            return pd.read_csv(io.StringIO(file_bytes.decode('utf-8')), skiprows=0, header=0)
        except Exception as csv_exc:
            print(f"Failed to read as CSV: {csv_exc}")
            # Try reading as JSON lines (NDJSON)
            try:
                return pd.read_json(io.StringIO(file_bytes.decode('utf-8')), lines=True)
            except Exception as jsonl_exc:
                print(f"Failed to read as JSON lines: {jsonl_exc}")
                # Try reading as JSON array
                try:
                    return pd.read_json(io.StringIO(file_bytes.decode('utf-8')))
                except Exception as json_exc:
                    print(f"Failed to read as JSON array: {json_exc}")
                    raise ValueError(
                        f"Could not parse file as CSV, JSON lines, or JSON array. "
                        f"CSV error: {csv_exc}, JSON lines error: {jsonl_exc}, JSON array error: {json_exc}"
                    )
    else:
        raise ValueError('Unsupported file type. Only CSV and XLSX are supported.')

def lambda_handler(event, context):
    """
    Processes manual upload file (CSV or Excel) uploaded to S3
    Reads file with pandas, transforms, and adds to database (like grants flow)
    """
    try:
        # Parse S3 event
        s3_event = event["Records"][0]["s3"]
        bucket_name = s3_event["bucket"]["name"]
        file_key = s3_event["object"]["key"]

        print(f"Processing manual upload file: {file_key} from bucket: {bucket_name}")

        # Fetch file from S3 (as bytes)
        try:
            file_bytes = fetchFromS3(bucket=bucket_name, key=file_key)
            print("Data fetched successfully.")
            print(f"File size: {len(file_bytes)} bytes")
        except Exception as fetch_error:
            print(f"Error fetching data from S3: {str(fetch_error)}")
            return {
                'statusCode': 400,
                'status': 'FAILED',
                'error': f"S3 fetch error: {str(fetch_error)}"
            }

        # Load and process data
        try:
            # Load data into DataFrame
            df = loadData(file_bytes, file_key)
            print("Data loaded successfully.")
            print(f"DataFrame shape: {df.shape}")
            print(f"DataFrame columns: {df.columns.tolist()}")
            
            # Check for required columns
            required_columns = ["PhysicianID", "UserID", "Details", "Type"]
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                raise ValueError(f"Missing required columns: {missing_columns}")
            
            # Clean the DataFrame
            df = cleanData(df)
            print("Data cleaned successfully.")
            
            # Connect to database
            connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
            cursor = connection.cursor()
            print("Connected to database")

            rows_processed = 0
            rows_added_to_db = 0
            errors = []

            rows_processed, rows_added_to_db = storeData(df, connection, cursor, errors, rows_processed, rows_added_to_db)
            print("Data stored successfully.")
            cursor.close()
            connection.close()

            # Clean up - delete the processed file
            s3_client.delete_object(Bucket=bucket_name, Key=file_key)
            print(f"Processed file {file_key}, and deleted from bucket {bucket_name}")

            result = {
                'statusCode': 200,
                'status': 'COMPLETED',
                'total_rows': len(df),
                'rows_processed': rows_processed,
                'rows_added_to_database': rows_added_to_db,
                'errors': errors[:10] if errors else []
            }

            print(f"Manual upload completed: {result}")
            return result
            
        except Exception as load_error:
            print(f"Error loading or processing data: {str(load_error)}")
            return {
                'statusCode': 400,
                'status': 'FAILED',
                'error': f"Data loading error: {str(load_error)}"
            }

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error processing manual upload: {str(e)}")
        print(f"Traceback: {error_trace}")
        return {
            'statusCode': 500,
            'status': 'FAILED',
            'error': str(e),
            'traceback': error_trace
        }
    