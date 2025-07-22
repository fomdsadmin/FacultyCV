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

"""
Fetch the raw csv data from s3
:param bucket: str, the name of the target bucket
:param key_raw: str, the key (path) to the raw csv file
:return StringIO file-like object
"""
def fetchFromS3(bucket, key):

    # get the raw csv file from S3
    s3 = boto3.resource('s3')
    s3_bucket_raw = s3.Object(bucket, key)
    response = s3_bucket_raw.get()

    # extract the raw data from the response Body
    raw_data_from_s3 = response["Body"]

    return io.StringIO(raw_data_from_s3.read().decode("utf-8"))

def cleanData(df):
    """
    Cleans the input DataFrame by performing various transformations.
    """

    df["first_name"] =  df["Legal Name - First Name"].str.strip()
    df["last_name"] =  df["Legal Name - Last Name"].str.strip()
    # 7-8 digit number, need to ensure empty/NaN/0 value errors
    df["employee_id"] = df["Employee ID"].astype(str).str.strip()

    df["academic_rank"] = df["Academic Rank"].str.strip()
    df["academic_unit"] = df["Academic Unit"].str.strip()
    df["academic_apt_start_date"] = pd.to_datetime(df["Academic Appointment Start Date"], errors='coerce').dt.strftime('%Y-%m-%d')
    df["academic_apt_end_date"] = pd.to_datetime(df["Academic Appointment End Date"], errors='coerce').dt.strftime('%Y-%m-%d')
    df["roster_percent"] = df["Roster % (For Joint Appt)"].astype(float).fillna(0).astype(int)

    # Drop all other columns except the cleaned ones
    df = df[["first_name", "last_name", "employee_id", "academic_rank", "academic_unit",
             "academic_apt_start_date", "academic_apt_end_date", "roster_percent"]]
    return df

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

        raw_data = fetchFromS3(bucket=bucket_name, key=file_key)

        # # Read file into pandas DataFrame
        # if file_key.lower().endswith('.xlsx'):
        #     df = pd.read_excel(io.BytesIO(file_stream))
        # elif file_key.lower().endswith('.csv'):
        #     df = pd.read_csv(io.BytesIO(file_stream), encoding="utf-8-sig")
        # else:
        #     return {
        #         'statusCode': 400,
        #         'status': 'FAILED',
        #         'error': 'Unsupported file type. Only CSV and XLSX are supported.'
        #     }
        # print(f"Loaded {len(df)} rows from file.")

        # read raw data into a pandas DataFrame
        df = pd.read_csv(raw_data, skiprows=0, header=0)
        print("Data loaded successfully.")
        print(df.head())

        # Clean the DataFrame
        df = cleanData(df)
        print("Data cleaned successfully.")
        print(df.head())

        # Connect to database
        connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
        cursor = connection.cursor()
        print("Connected to database")

        rows_processed = 0
        rows_added_to_db = 0
        errors = []

        # for i, row in df.iterrows():
        #     row_dict = row.to_dict()
        #     # Validate row
        #     is_valid, error_message = validate_row(row_dict)
        #     if not is_valid:
        #         errors.append(f"Row {i+2}: {error_message}")
        #         continue
        #     rows_processed += 1

        #     # Add to database
        #     if addUserToDatabase(row_dict, connection, cursor):
        #         rows_added_to_db += 1
        #     else:
        #         errors.append(f"Row {i+2}: Failed to add {row_dict.get('email', '')} to database")

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
