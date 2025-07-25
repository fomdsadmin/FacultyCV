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

SECTION_TITLE = "Authorship Statement"

def cleanData(df):
    """
    Cleans the input DataFrame by performing various transformations:
    """
    # Convert Unix timestamps to date strings; if missing or invalid, result is empty string
    df["user_id"] = df["UserID"].str.strip()
    df["start_date"] = pd.to_datetime(df["TDate"], unit='s', errors='coerce').dt.strftime('%d %B, %Y')
    df["end_date"] = pd.to_datetime(df["TDateEnd"], unit='s', errors='coerce').dt.strftime('%d %B, %Y')
    df["start_date"] = df["start_date"].fillna('').str.strip()
    df["end_date"] = df["end_date"].fillna('').str.strip()

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
    df = df[["user_id", "dates"]]

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
            WHERE LOWER(title) LIKE %s
            LIMIT 1
            """,
            ('%' + SECTION_TITLE.lower() + '%',)
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

    for i, row in df.iterrows():
        row_dict = row.to_dict()
        data_details_JSON = json.dumps(row_dict)
        
        try:
            cursor.execute(
                """
                INSERT INTO user_cv_data (user_id, data_section_id, data_details, editable)
                VALUES (%s, %s, %s, %s)
                """,
                (row_dict.get('user_id'), data_section_id, data_details_JSON, True)
            )
            rows_added_to_db += 1
        except Exception as e:
            errors.append(f"Error inserting row {i}: {str(e)}")
        finally:
            rows_processed += 1
            connection.commit()
            print(f"Processed row {i + 1}/{len(df)}")
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

        print(f"Processing data migration file for section: {file_key}, bucket: {bucket_name}")

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
        print(df.to_string())

        # Clean the DataFrame
        df = cleanData(df)
        print("Data cleaned successfully.")
        print(df.to_string())

        # Connect to database
        connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
        cursor = connection.cursor()
        print("Connected to database")

        rows_processed = 0
        rows_added_to_db = 0
        errors = []

        rows_processed, rows_added_to_db = storeData(df, connection, cursor, errors, rows_processed, rows_added_to_db)

        cursor.close()
        connection.close()

        # Clean up - delete the processed file
        s3_client.delete_object(Bucket=bucket_name, Key=file_key)


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
