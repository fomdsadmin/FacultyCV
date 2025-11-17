import csv
import codecs
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


def insert_row_dynamic(row, conn, cursor, table_name):
    """
    Insert a CSV row (dict) into specified table exactly as-is.
    Uses CSV headers as column names and inserts all values.
    Converts None/null to empty strings before saving.
    Returns 1 when inserted.
    """
    cols = list(row.keys())
    if not cols:
        return 0

    quoted_cols = [f'"{c}"' for c in cols]
    col_list = ",".join(quoted_cols)
    placeholders = ",".join(["%s"] * len(cols))
    query = f"INSERT INTO {table_name} ({col_list}) VALUES ({placeholders})"

    # Convert None/null to empty strings, empty strings remain as empty strings
    values = [row[c] if row[c] not in ["", None, "None", "null"] else '' for c in cols]
    
    cursor.execute(query, tuple(values))
    return 1


def lambda_handler(event, context):
    """
    Processes bulk import file uploaded to S3.
    Supports:
    - bulkUserUpload: inserts into users table
    - bulkAffiliationsUpload: inserts into affiliations table
    - templates: inserts into templates table
    - university_info: inserts into university_info table
    """
    try:
        # Parse S3 event
        s3_event = event["Records"][0]["s3"]
        bucket_name = s3_event["bucket"]["name"]
        file_key = s3_event["object"]["key"]

        print(f"Processing import file: {file_key} from bucket: {bucket_name}")

        # Determine table name based on file key
        if "bulkUserUpload" in file_key:
            table_name = "users"
        elif "bulkUserAffiliations" in file_key:
            table_name = "affiliations"
        elif "templates" in file_key.lower():
            table_name = "templates"
        elif "university_info" in file_key.lower():
            table_name = "university_info"
        elif "user_cv_data" in file_key.lower():
            table_name = "user_cv_data"
        else:
            raise Exception(f"Unknown file key: {file_key}. Expected 'bulkUserUpload', 'bulkAffiliationsUpload', 'templates', or 'university_info'")

        print(f"Target table: {table_name}")

        # Download and process the CSV file
        data = s3_client.get_object(Bucket=bucket_name, Key=file_key)

        # Process CSV file
        table_rows = list(csv.DictReader(codecs.getreader("utf-8-sig")(data["Body"])))
        print(f"Read {len(table_rows)} rows")

        # Connect to database
        connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
        cursor = connection.cursor()
        print("Connected to database")

        # Process each row
        rows_processed = 0
        rows_added_to_db = 0
        rows_added_to_cognito = 0
        errors = []

        if len(table_rows) == 0:
            print("No rows to process")
        else:
            for i, row in enumerate(table_rows):
                 # Normalize values (strip strings)
                row = {k: v.strip() if isinstance(v, str) else v for k, v in row.items()}
                try:
                    rows_added_to_db += insert_row_dynamic(row, connection, cursor, table_name)
                    rows_processed += 1
                except Exception as e:
                    errors.append(f"Row {i+2}: Failed to insert row dynamically: {str(e)}")

        connection.commit()
        cursor.close()
        connection.close()

        # Clean up - delete the processed file
        s3_client.delete_object(Bucket=bucket_name, Key=file_key)

        result = {
            'statusCode': 200,
            'status': 'COMPLETED',
            'table': table_name,
            'total_rows': len(table_rows),
            'rows_processed': rows_processed,
            'rows_added_to_database': rows_added_to_db,
            'rows_added_to_cognito': rows_added_to_cognito,
            'errors': errors[:10] if errors else []  # Limit to first 10 errors
        }

        print(f"Import completed: {result}")
        return result

    except Exception as e:
        print(f"Error processing user import: {str(e)}")
        return {
            'statusCode': 500,
            'status': 'FAILED',
            'error': str(e)
        }
