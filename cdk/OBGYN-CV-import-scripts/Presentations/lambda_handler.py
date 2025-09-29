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

SECTION_TITLE_INVITED = "9d. Invited Presentations"
SECTION_TITLE_OTHER = "9g. Other Presentations"

# Combine start and end dates into a single 'dates' column
# Only show ranges when both dates exist, avoid empty dashes
def combine_dates(row):
    start = row["start_date"].strip()
    end = row["end_date"].strip()
        
    if start and end:
        return f"{start} - {end}"
    elif start:
        return start
    elif end:
        return end
    else:
        return ""
        
def cleanData(df):
    """
    Cleans the input DataFrame by performing various transformations:
    """
    # Ensure relevant columns are string type before using .str methods
    for col in ["Type", "TypeOther", "PhysicianID", "Scale", "Details", "Notes"]:
        if col in df.columns:
            df[col] = df[col].astype(str)

    # Split into invited and other presentations
    invited_df = df[df["Type"].fillna('').str.strip() == "Invited Presentation"].copy()
    other_df = df[df["Type"].fillna('').str.strip() == "Other Presentation:"].copy()

    # --- Invited Presentations ---
    if not invited_df.empty:
        invited_df.loc[:, "user_id"] = invited_df["PhysicianID"].str.strip()
        invited_df.loc[:, "scale"] = invited_df["Scale"].fillna('').str.strip()
        invited_df.loc[:, "details"] = invited_df["Details"].fillna('').str.strip()
        invited_df.loc[:, "highlight_-_notes"] = invited_df["Notes"].fillna('').str.strip()
        
        # Robust date handling for invited_df
        if "TDate" in invited_df.columns:
            # Handle zero and negative timestamps - set as blank for invalid values
            invited_df["TDate_clean"] = pd.to_numeric(invited_df["TDate"], errors='coerce')
            invited_df["start_date"] = invited_df["TDate_clean"].apply(lambda x:
                '' if pd.isna(x) or x <= 0 else
                pd.to_datetime(x, unit='s', errors='coerce').strftime('%B %Y') if not pd.isna(pd.to_datetime(x, unit='s', errors='coerce')) else ''
            )
            invited_df["start_date"] = invited_df["start_date"].fillna('').str.strip()
        else:
            invited_df["start_date"] = ''

        if "TDateEnd" in invited_df.columns:
            # Handle zero and negative timestamps - set as blank for invalid values (including zero)
            invited_df["TDateEnd_clean"] = pd.to_numeric(invited_df["TDateEnd"], errors='coerce')
            invited_df["end_date"] = invited_df["TDateEnd_clean"].apply(lambda x:
                '' if pd.isna(x) or x <= 0 else  # Zero and negative are blank
                pd.to_datetime(x, unit='s', errors='coerce').strftime('%B %Y') if not pd.isna(pd.to_datetime(x, unit='s', errors='coerce')) else ''
            )
            invited_df["end_date"] = invited_df["end_date"].fillna('').str.strip()
        else:
            invited_df["end_date"] = ''
            
        invited_df["dates"] = invited_df.apply(combine_dates, axis=1)

        invited_df = invited_df[["user_id", "scale", "details", "highlight_-_notes", "dates"]]
        invited_df = invited_df.replace({np.nan: ''}).reset_index(drop=True)
    print("Processed invited presentations: ", len(invited_df))

    # --- Other Presentations ---
    if not other_df.empty:
        other_df.loc[:, "user_id"] = other_df["PhysicianID"].str.strip()
        other_df.loc[:, "scale"] = other_df["Scale"].fillna('').str.strip()
        other_df.loc[:, "details"] = other_df["Details"].fillna('').str.strip()
        other_df.loc[:, "highlight_-_notes"] = other_df["Notes"].fillna('').str.strip()
        # Set type_of_presentation to "Other presentation" for all rows
        other_df.loc[:, "type_of_presentation"] = "Other presentation"
        # Set default values for extra columns (location, organization/institution/event, role)
        other_df.loc[:, "location"] = ""
        other_df.loc[:, "organization_/_institution_/_event"] = ""
        other_df.loc[:, "role"] = ""
        
        # Robust date handling for other_df
        if "TDate" in other_df.columns:
            # Handle zero and negative timestamps - set as blank for invalid values
            other_df["TDate_clean"] = pd.to_numeric(other_df["TDate"], errors='coerce')
            other_df["start_date"] = other_df["TDate_clean"].apply(lambda x:
                '' if pd.isna(x) or x <= 0 else
                pd.to_datetime(x, unit='s', errors='coerce').strftime('%B %Y') if not pd.isna(pd.to_datetime(x, unit='s', errors='coerce')) else ''
            )
            other_df["start_date"] = other_df["start_date"].fillna('').str.strip()
        else:
            other_df["start_date"] = ''

        if "TDateEnd" in other_df.columns:
            # Handle zero and negative timestamps - set as blank for invalid values (including zero)
            other_df["TDateEnd_clean"] = pd.to_numeric(other_df["TDateEnd"], errors='coerce')
            other_df["end_date"] = other_df["TDateEnd_clean"].apply(lambda x:
                '' if pd.isna(x) or x <= 0 else  # Zero and negative are blank
                pd.to_datetime(x, unit='s', errors='coerce').strftime('%B %Y') if not pd.isna(pd.to_datetime(x, unit='s', errors='coerce')) else ''
            )
            other_df["end_date"] = other_df["end_date"].fillna('').str.strip()
        else:
            other_df["end_date"] = ''

        other_df["dates"] = other_df.apply(combine_dates, axis=1)
    
        # Only keep the required columns
        other_df = other_df[["user_id", "scale", "details", "highlight_-_notes", "type_of_presentation", "location", "organization_/_institution_/_event", "role", "dates"]]
        other_df = other_df.replace({np.nan: ''}).reset_index(drop=True)
    print("Processed other presentations: ", len(other_df))

    return invited_df, other_df


def storeData(df, connection, cursor, errors, rows_processed, rows_added_to_db, section_title):
    """
    Store the cleaned DataFrame into the database for a given section title.
    Returns updated rows_processed and rows_added_to_db.
    """
    # Query for the data_section_id where title contains section_title (case insensitive)
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
        else:
            errors.append(f"No data_section_id found for '{section_title}'")
            data_section_id = None
    except Exception as e:
        errors.append(f"Error fetching data_section_id: {str(e)}")
        data_section_id = None

    if not data_section_id:
        errors.append(f"Skipping insert: data_section_id not found for {section_title}.")
        return rows_processed, rows_added_to_db

    for i, row in df.iterrows():
        row_dict = row.to_dict()
        row_dict.pop('user_id', None)
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
        file_bytes = fetchFromS3(bucket=bucket_name, key=file_key)
        print("Data fetched successfully.")

        # Load data into DataFrame
        try:
            df = loadData(file_bytes, file_key)
        except ValueError as e:
            return {
                'statusCode': 400,
                'status': 'FAILED',
                'error': str(e)
            }
        print("Data loaded successfully.")

        # Clean the DataFrame (returns two DataFrames)
        invited_df, other_df = cleanData(df)
        print("Data cleaned successfully.")

        # Connect to database
        connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
        cursor = connection.cursor()
        print("Connected to database")

        rows_processed = 0
        rows_added_to_db = 0
        errors = []

        # Store invited presentations
        if not invited_df.empty:
            rows_processed, rows_added_to_db = storeData(
                invited_df, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_INVITED
            )
        # Store other presentations
        if not other_df.empty:
            rows_processed, rows_added_to_db = storeData(
                other_df, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_OTHER
            )

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

    except Exception as e:
        print(f"Error processing manual upload: {str(e)}")
        return {
            'statusCode': 500,
            'status': 'FAILED',
            'error': str(e)
        }

