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

SECTION_TITLE = "5d. Continuing Medical Education"

def cleanData(df):
    """
    Cleans the input DataFrame by performing various transformations:
    """
    # Only keep rows where UserID is a string of expected length (e.g., 32)
    df["user_id"] = df["PhysicianID"].astype(str).str.strip()
    df["university/organization"] = df["University_Organization"].fillna('').str.strip()
    df["details"] =  df["Details"].fillna('').str.strip()
    df["highlight_notes"] =  df["Notes"].fillna('').str.strip()
    df["highlight"] = df["Highlight"].str.strip().str.lower().map({'true': True, 'false': False})

    # If Type is "Other:", set type_of_leave to "Other ({type_other})"
    df["type"] =  df["Type"].fillna('').str.strip()
    df["type_other"] =  df["TypeOther"].fillna('').str.strip()
    mask_other = df["Type"].str.strip() == "Other:"
    df.loc[mask_other, "type"] = "Other (" + df.loc[mask_other, "type_other"] + ")"
    
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
    df = df[["user_id", "university/organization", "details", "type", "highlight_notes", "highlight", "dates"]]
    # Replace NaN with empty string for all columns
    df = df.replace({np.nan: ''})
    return df


def storeData(df, connection, cursor, errors, rows_processed, rows_added_to_db):
    """
    Store the cleaned DataFrame into the database.
    Returns updated rows_processed and rows_added_to_db.
    """
    # Query for the data_section_id where title contains SECTION_TITLE (case insensitive)
    try:
        cursor.execute(
            """
            SELECT data_section_id FROM data_sections
            WHERE title = %s
            LIMIT 1
            """,
            (SECTION_TITLE,)
        )
        result = cursor.fetchone()
        if result:
            data_section_id = result[0]
        else:
            errors.append(f"No data_section_id found for '{SECTION_TITLE}'")
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
            print(f"Processed row {i + 1}/{len(df)}")
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
    """
    if file_key.lower().endswith('.xlsx'):
        # For Excel, read as bytes
        return pd.read_excel(io.BytesIO(file_bytes))
    elif file_key.lower().endswith('.csv'):
        # For CSV, decode bytes to text
        return pd.read_csv(io.StringIO(file_bytes.decode('utf-8')), skiprows=0, header=0)
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

