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

SECTION_TITLE_A = "5a. Post-Secondary Education"
SECTION_TITLE_B = "5b. Dissertations"


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
    Returns two DataFrames: a (Post-Secondary Education) and b (Dissertations with non-empty thesis titles)
    """
    # Make copies for processing different sections
    a = df.copy()
    b = df.copy()
    
    # Ensure relevant columns are string type before using .str methods
    for col in ["PhysicianID", "University_Organization", "Details","Supervisor",
                "Type", "TypeOther", "Highlight", "Notes"]:
        if col in a.columns:
            a[col] = a[col].astype(str)
        else:
            print(f"Warning: Column '{col}' not found in DataFrame")
            
    a["user_id"] = a["PhysicianID"].fillna('').str.strip()
    a["university/organization"] = a["University_Organization"].fillna('').str.strip()
    a["supervisor"] = a["Supervisor"].fillna('').str.strip()

    a["details"] = a["Details"].fillna('').str.strip()
    a["highlight"] = a["Highlight"].str.strip().str.lower().map({'true': True, 'false': False})
    a["highlight_-_notes"] = a["Notes"].fillna('').str.strip() 
    
    # Handle Type field - dropdown with specific values
    if "Type" in a.columns:
        a["degree_raw"] = a["Type"].fillna('').str.strip()
        
        # Define valid degree types and ensure they are properly trimmed
        valid_types = ["BA", "BSc", "MA", "MD", "MSc", "PhD", "Other:"]
        
        # Map and validate degree types, keeping same values but ensuring proper trimming
        a["degree"] = a["degree_raw"].apply(lambda x: x if x in valid_types else '')

        # Handle TypeOther logic - if Type is "Other", set degree to "Other ({type_other})"
        if "TypeOther" in a.columns:
            a["type_other"] = a["TypeOther"].fillna('').str.strip()
            mask_other = a["degree"] == "Other:"
            # Only append TypeOther if it's not empty
            a.loc[mask_other, "degree"] = "Other (" + a.loc[mask_other, "type_other"] + ")"
    else:
        a["degree"] = ''


    # Handle Dates field - convert Unix timestamps to date strings
    if "TDate" in a.columns:
        # Handle zero and negative timestamps - set as blank for invalid values
        a["TDate_clean"] = pd.to_numeric(a["TDate"], errors='coerce')
        a["start_date"] = a["TDate_clean"].apply(lambda x: 
            '' if pd.isna(x) or x <= 0 else 
            pd.to_datetime(x, unit='s', errors='coerce').strftime('%B, %Y') if not pd.isna(pd.to_datetime(x, unit='s', errors='coerce')) else ''
        )
        a["start_date"] = a["start_date"].fillna('').str.strip()
    else:
        a["start_date"] = ''
        
    if "TDateEnd" in a.columns:
        # Handle zero and negative timestamps - set as blank for invalid values (including zero)
        a["TDateEnd_clean"] = pd.to_numeric(a["TDateEnd"], errors='coerce')
        a["end_date"] = a["TDateEnd_clean"].apply(lambda x: 
            '' if pd.isna(x) or x <= 0 else  # Zero and negative are blank
            pd.to_datetime(x, unit='s', errors='coerce').strftime('%B, %Y') if not pd.isna(pd.to_datetime(x, unit='s', errors='coerce')) else ''
        )
        a["end_date"] = a["end_date"].fillna('').str.strip()
    else:
        a["end_date"] = ''

    a["dates"] = a.apply(combine_dates, axis=1)

    # Keep only the cleaned columns
    a = a[["user_id", "supervisor", "university/organization", "details", "highlight_-_notes", "degree", "dates"]]

    # Replace NaN with empty string for all columns
    a = a.replace({np.nan: ''})
    
    
    for col in ["PhysicianID", "Thesis Title", "Supervisor", "Notes"]:
        if col in b.columns:
            b[col] = b[col].astype(str)
        else:
            print(f"Warning: Column '{col}' not found in DataFrame")

    b["user_id"] = b["PhysicianID"].fillna('').str.strip()

    b["supervisor"] = b["Supervisor"].fillna('').str.strip()
    b["title_of_dissertation"] = b["Thesis Title"].fillna('').str.strip()

    b["highlight_-_notes"] = b["Notes"].fillna('').str.strip() 

    # Handle Dates field - convert Unix timestamps to date strings
    if "TDate" in b.columns:
        # Handle zero and negative timestamps - set as blank for invalid values
        b["TDate_clean"] = pd.to_numeric(b["TDate"], errors='coerce')
        b["start_date"] = b["TDate_clean"].apply(lambda x: 
            '' if pd.isna(x) or x <= 0 else 
            pd.to_datetime(x, unit='s', errors='coerce').strftime('%B, %Y') if not pd.isna(pd.to_datetime(x, unit='s', errors='coerce')) else ''
        )
        b["start_date"] = b["start_date"].fillna('').str.strip()
    else:
        b["start_date"] = ''
        
    if "TDateEnd" in b.columns:
        # Handle zero and negative timestamps - set as blank for invalid values (including zero)
        b["TDateEnd_clean"] = pd.to_numeric(b["TDateEnd"], errors='coerce')
        b["end_date"] = b["TDateEnd_clean"].apply(lambda x: 
            '' if pd.isna(x) or x <= 0 else  # Zero and negative are blank
            pd.to_datetime(x, unit='s', errors='coerce').strftime('%B, %Y') if not pd.isna(pd.to_datetime(x, unit='s', errors='coerce')) else ''
        )
        b["end_date"] = b["end_date"].fillna('').str.strip()
    else:
        b["end_date"] = ''

    b["dates"] = b.apply(combine_dates, axis=1)
    # Filter dataframe b to only include entries where title_of_dissertation is not empty
    b = b[b["title_of_dissertation"].str.strip() != ""]

    # Keep only the cleaned columns for dataframe b (dissertations)
    b = b[["user_id", "supervisor", "title_of_dissertation", "highlight_-_notes", "dates", "highlight"]]

    # Replace NaN with empty string for all columns
    b = b.replace({np.nan: ''})
    
    return a, b


def storeData(df, connection, cursor, errors, rows_processed, rows_added_to_db, section_title):
    """
    Store the cleaned DataFrame into the database.
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
        errors.append("Skipping insert: data_section_id not found.")
        return rows_processed, rows_added_to_db

    for i, row in df.iterrows():
        row_dict = row.to_dict()
        # Remove user_id from data_details
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
            df = pd.read_csv(io.StringIO(file_bytes.decode('utf-8')), skiprows=0, header=0)
            
            # Check if the first column name starts with '[{' - indicates JSON data in CSV
            if len(df.columns) > 0 and df.columns[0].startswith('[{'):
                print("Detected JSON data in CSV format, attempting to parse as JSON")
                # Read the entire file content as text and try to parse as JSON
                file_content = file_bytes.decode('utf-8').strip()
                
                # Try to parse as JSON array directly
                try:
                    import json
                    json_data = json.loads(file_content)
                    return pd.DataFrame(json_data)
                except json.JSONDecodeError:
                    # If that fails, try reading as JSON lines
                    try:
                        return pd.read_json(io.StringIO(file_content), lines=True)
                    except:
                        # Last resort - reconstruct the JSON from the broken CSV
                        # Combine all columns back into a single JSON string
                        combined_json = ''.join(df.columns.tolist())
                        if len(df) > 0:
                            # Add the data rows
                            for _, row in df.iterrows():
                                row_data = ' '.join([str(val) for val in row.values if pd.notna(val)])
                                combined_json += ' ' + row_data
                        
                        try:
                            json_data = json.loads(combined_json)
                            return pd.DataFrame(json_data)
                        except:
                            raise ValueError("Could not parse malformed JSON in CSV file")
            
            return df
            
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
            print("Data loaded successfully.")
        except ValueError as e:
            print(f"Error loading data: {str(e)}")
            return {
                'statusCode': 400,
                'status': 'FAILED',
                'error': str(e)
            }

        # Clean the DataFrame
        dfA, dfB = cleanData(df)
        print("Data cleaned successfully.")

        # Connect to database
        connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
        cursor = connection.cursor()
        print("Connected to database")

        rows_processed = 0
        rows_added_to_db = 0
        errors = []

        rows_processed, rows_added_to_db = storeData(dfA, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_A)
        rows_processed, rows_added_to_db = storeData(dfB, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_B)
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

