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

SECTION_TITLE = "8b.1. Courses Taught"
SECTION_TITLE_OTHER = "8b.2. Brief Descriptions for Courses Taught"

def combine_dates(row):
    if row["start_date"] and str(row["end_date"]).strip():
        return f"{row['start_date']} - {row['end_date']}"
    elif row["start_date"]:
        return row["start_date"]
    elif row["end_date"]:
        return row["end_date"]
    else:
        return ""

def cleanData(df):
    """
    Cleans the input DataFrame by performing various transformations:
    Returns two DataFrames: courses_df for main courses section, descriptions_df for brief descriptions section
    """
    # Ensure relevant columns are string type before using .str methods
    for col in ["PhysicianID", "Session", "Course", "Footnote", "ShowFN", "Schedule hours per year", 
                "Class Size","Lectures","Tutorials","Labs","Other", "Details", "Notes"]:
        if col in df.columns:
            df[col] = df[col].astype(str)

    # --- Main Courses Section (8b.1. Courses Taught) ---
    courses_df = df.copy()
    courses_df["user_id"] = courses_df["PhysicianID"].fillna('').str.strip()
    
    # Map special cases of session to match frontend expectations
    session_mapping = {
        "Winter 1 & 2": "Winter Term 1 & 2 (Sept - Apr)",
        "Winter 1": "Winter Term 1 (Sept - Dec)",
        "Term 1": "Winter Term 1 (Sept - Dec)",
        "Fall": "Winter Term 1 (Sept - Dec)",
        "Winter 2": "Winter Term 2 (Jan - Apr)",
        "Term 2": "Winter Term 2 (Jan - Apr)",
        "Summer": "Summer Session (May - Aug)",
    }
    
    def map_session(session_value):
        if pd.isna(session_value) or session_value.strip() == '':
            return ''
        session_clean = session_value.strip()
        if session_clean in session_mapping:
            return session_mapping[session_clean]
        else:
            return f"Other ({session_clean})"
    
    courses_df["session"] = courses_df["Session"].apply(map_session)
    
    courses_df["course"] = courses_df["Course"].fillna('').str.strip()
    courses_df["footnote_-_notes"] = courses_df["Footnote"].fillna('').str.strip()
    if "ShowFN" in courses_df.columns:
        courses_df["footnote"] = courses_df["ShowFN"].fillna('').str.strip().str.upper() == 'TRUE'
    else:
        courses_df["footnote"] = False
    courses_df["scheduled_hours_(per_year)"] = courses_df["Schedule hours per year"].fillna('').str.strip()
    courses_df["scheduled_hours_(per_year)"] = courses_df["scheduled_hours_(per_year)"].replace('0.00', '')
    
    courses_df["class_size_(per_year)"] = courses_df["Class Size"].fillna('').str.strip()
    courses_df["class_size_(per_year)"] = courses_df["class_size_(per_year)"].replace('0.00', '')
    
    courses_df["lecture_hours_(per_year)"] = courses_df["Lectures"].fillna('').str.strip()
    courses_df["lecture_hours_(per_year)"] = courses_df["lecture_hours_(per_year)"].replace('0.00', '')
    
    courses_df["tutorial_hours_(per_year)"] = courses_df["Tutorials"].fillna('').str.strip()
    courses_df["tutorial_hours_(per_year)"] = courses_df["tutorial_hours_(per_year)"].replace('0.00', '')
    
    courses_df["lab_hours_(per_year)"] = courses_df["Labs"].fillna('').str.strip()
    courses_df["lab_hours_(per_year)"] = courses_df["lab_hours_(per_year)"].replace('0.00', '')
    
    courses_df["other_hours_(per_year)"] = courses_df["Other"].fillna('').str.strip()
    courses_df["other_hours_(per_year)"] = courses_df["other_hours_(per_year)"].replace('0.00', '')

    courses_df["highlight_-_notes"] = courses_df["Notes"].fillna('').str.strip()
    if "Highlight" in courses_df.columns:
        courses_df["highlight"] = courses_df["Highlight"].fillna('').astype(str).str.upper().str.strip() == 'TRUE'
    else:
        courses_df["highlight"] = False
        
    courses_df["details"] = courses_df["Details"].fillna('').str.strip()

    # Replace the date handling for courses_df
    if "TDate" in courses_df.columns:
        # Handle zero and negative timestamps - set as blank for invalid values
        courses_df["TDate_clean"] = pd.to_numeric(courses_df["TDate"], errors='coerce')
        courses_df["start_date"] = courses_df["TDate_clean"].apply(lambda x:
            '' if pd.isna(x) or x <= 0 else
            pd.to_datetime(x, unit='s', errors='coerce').strftime('%d %B, %Y') if not pd.isna(pd.to_datetime(x, unit='s', errors='coerce')) else ''
        )
        courses_df["start_date"] = courses_df["start_date"].fillna('').str.strip()
    else:
        courses_df["start_date"] = ''
    
    if "TDateEnd" in courses_df.columns:
        # Handle zero and negative timestamps - set as blank for invalid values (including zero)
        courses_df["TDateEnd_clean"] = pd.to_numeric(courses_df["TDateEnd"], errors='coerce')
        courses_df["end_date"] = courses_df["TDateEnd_clean"].apply(lambda x:
            '' if pd.isna(x) or x <= 0 else  # Zero and negative are blank
            pd.to_datetime(x, unit='s', errors='coerce').strftime('%d %B, %Y') if not pd.isna(pd.to_datetime(x, unit='s', errors='coerce')) else ''
        )
        courses_df["end_date"] = courses_df["end_date"].fillna('').str.strip()
    else:
        courses_df["end_date"] = ''

    # Keep only the cleaned columns for courses
    courses_df = courses_df[["user_id", "details", "session", "course", "footnote_-_notes", "footnote", "scheduled_hours_(per_year)", 
             "class_size_(per_year)", "lecture_hours_(per_year)", "tutorial_hours_(per_year)", "lab_hours_(per_year)", "other_hours_(per_year)", "highlight_-_notes", "highlight", "dates"]]

    # Replace NaN with empty string for all columns
    courses_df = courses_df.replace({np.nan: ''}).reset_index(drop=True)

    # --- Brief Descriptions Section (8b.2. Brief Descriptions for Courses Taught) ---
    descriptions_df = df.copy()
    descriptions_df["user_id"] = descriptions_df["PhysicianID"].fillna('').str.strip()
    descriptions_df["details"] = descriptions_df["Details"].fillna('').str.strip()
    descriptions_df["course"] = descriptions_df["Course"].fillna('').str.strip()
    descriptions_df["highlight_notes"] = descriptions_df["Notes"].fillna('').str.strip()
    
    if "Highlight" in descriptions_df.columns:
        descriptions_df["highlight"] = descriptions_df["Highlight"].fillna('').astype(str).str.upper().str.strip() == 'TRUE'
    else:
        descriptions_df["highlight"] = False

    # Convert dates for descriptions section
    if "TDate" in descriptions_df.columns:
        # Handle zero and negative timestamps - set as blank for invalid values
        descriptions_df["TDate_clean"] = pd.to_numeric(descriptions_df["TDate"], errors='coerce')
        descriptions_df["start_date"] = descriptions_df["TDate_clean"].apply(lambda x:
            '' if pd.isna(x) or x <= 0 else
            pd.to_datetime(x, unit='s', errors='coerce').strftime('%d %B, %Y') if not pd.isna(pd.to_datetime(x, unit='s', errors='coerce')) else ''
        )
        descriptions_df["start_date"] = descriptions_df["start_date"].fillna('').str.strip()
    else:
        descriptions_df["start_date"] = ''
    
    if "TDateEnd" in descriptions_df.columns:
        # Handle zero and negative timestamps - set as blank for invalid values (including zero)
        descriptions_df["TDateEnd_clean"] = pd.to_numeric(descriptions_df["TDateEnd"], errors='coerce')
        descriptions_df["end_date"] = descriptions_df["TDateEnd_clean"].apply(lambda x:
            '' if pd.isna(x) or x <= 0 else  # Zero and negative are blank
            pd.to_datetime(x, unit='s', errors='coerce').strftime('%d %B, %Y') if not pd.isna(pd.to_datetime(x, unit='s', errors='coerce')) else ''
        )
        descriptions_df["end_date"] = descriptions_df["end_date"].fillna('').str.strip()
    else:
        descriptions_df["end_date"] = ''

    # Keep only the cleaned columns for descriptions
    descriptions_df = descriptions_df[["user_id", "details", "course", "highlight_notes", "highlight", "dates"]]
    descriptions_df = descriptions_df.replace({np.nan: ''}).reset_index(drop=True)

    # Filter out entries where both course and details are empty
    descriptions_df = descriptions_df[
        (descriptions_df["course"].str.strip() != "") | 
        (descriptions_df["details"].str.strip() != "")
    ].reset_index(drop=True)

    print("Processed courses: ", len(courses_df))
    print("Processed descriptions: ", len(descriptions_df))

    return courses_df, descriptions_df


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
            print("Data loaded successfully.")
        except ValueError as e:
            print(f"Error loading data: {str(e)}")
            return {
                'statusCode': 400,
                'status': 'FAILED',
                'error': str(e)
            }

        # Clean the DataFrame (returns two DataFrames)
        courses_df, descriptions_df = cleanData(df)
        print("Data cleaned successfully.")

        # Connect to database
        connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
        cursor = connection.cursor()
        print("Connected to database")

        rows_processed = 0
        rows_added_to_db = 0
        errors = []

        # Store courses data
        if not courses_df.empty:
            rows_processed, rows_added_to_db = storeData(
                courses_df, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE
            )
        
        # Store descriptions data
        if not descriptions_df.empty:
            rows_processed, rows_added_to_db = storeData(
                descriptions_df, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_OTHER
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

