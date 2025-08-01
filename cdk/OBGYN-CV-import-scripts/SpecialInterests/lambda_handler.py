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

SECTION_TITLES = {
    "910": "9a. Areas of Special Interest and Accomplishments",
    "1001": "10a. Areas of Special Interest and Accomplishments",
    "1021": "11a. Areas of Special Interest and Accomplishments",
    "1101": "12a. Areas of Special Interest and Accomplishments",
}

def cleanData(df):
    """
    Cleans the input DataFrame by performing various transformations:
    Returns a dict of {section_title: cleaned_df}
    """
    cleaned = {}
    # Ensure relevant columns are string type before using .str methods
    for col in ["FormType", "Type", "TypeOther", "PhysicianID", "Details", "Notes"]:
        if col in df.columns:
            df[col] = df[col].astype(str)

    for formtype, section_title in SECTION_TITLES.items():
        subdf = df[df["FormType"].astype(str).str.strip() == formtype].copy()
        if subdf.empty:
            continue
        subdf["user_id"] = subdf["PhysicianID"].str.strip()
        subdf["details"] = subdf["Details"].fillna('').str.strip()
        subdf["type"] = subdf["Type"].fillna('').str.strip()
        subdf["type_other"] = subdf["TypeOther"].fillna('').str.strip()
        subdf["highlight_notes"] = subdf["Notes"].fillna('').str.strip()
        subdf["highlight"] = False

        # If TypeOther is not empty, set type to "Other ({type_other})"
        mask_other = subdf["type_other"].str.strip() != ""
        subdf.loc[mask_other, "type"] = "Other (" + subdf.loc[mask_other, "type_other"] + ")"

        # Convert Unix timestamps to date strings; if missing or invalid, result is empty string
        subdf["start_date"] = pd.to_datetime(subdf["TDate"], unit='s', errors='coerce').dt.strftime('%d %B, %Y')
        if "TDateEnd" in subdf.columns:
            subdf["end_date"] = pd.to_datetime(subdf["TDateEnd"], unit='s', errors='coerce').dt.strftime('%d %B, %Y')
            subdf["end_date"] = subdf["end_date"].fillna('').str.strip()
        else:
            subdf["end_date"] = ""
        subdf["start_date"] = subdf["start_date"].fillna('').str.strip()

        def combine_dates(row):
            if row["start_date"] and str(row["end_date"]).strip():
                return f"{row['start_date']} - {row['end_date']}"
            elif row["start_date"]:
                return row["start_date"]
            elif row["end_date"]:
                return row["end_date"]
            else:
                return ""
        subdf["dates"] = subdf.apply(combine_dates, axis=1)

        subdf = subdf[["user_id", "details", "highlight_notes", "highlight", "dates", "type"]]
        subdf = subdf.replace({np.nan: ''}).reset_index(drop=True)
        print(f"Processed rows for {section_title}: ", len(subdf))
        cleaned[section_title] = subdf
        print(cleaned[section_title].head())

    return cleaned


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

        # Clean the DataFrame (returns dict of section_title: df)
        cleaned_dfs = cleanData(df)
        print("Data cleaned successfully.")

        # Connect to database
        connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
        cursor = connection.cursor()
        print("Connected to database")

        rows_processed = 0
        rows_added_to_db = 0
        errors = []

        # Store for each section
        for section_title, subdf in cleaned_dfs.items():
            if not subdf.empty:
                rows_processed, rows_added_to_db = storeData(
                    subdf, connection, cursor, errors, rows_processed, rows_added_to_db, section_title
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

