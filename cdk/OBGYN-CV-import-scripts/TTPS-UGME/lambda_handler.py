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

SECTION_TITLE_OTHER = "8b.3. Clinical Teaching"

def cleanData(df):
    """
    Cleans the input DataFrame by performing various transformations:
    """
    # Ensure relevant columns are string type before using .str methods
    for col in ["Site", "Receiving Function", "Topic/Description", "Appt Start Date", "Appt End Date", "Type of Teaching", "Course Name", "Course Number", "Paid Total"]:
        if col in df.columns:
            df[col] = df[col].astype(str)

    # Merge Site, Course Name, Receiving Function, Topic/Description into description
    def merge_description(row):
        fields = [
            row.get("Site", ""),
            row.get("Receiving Function", ""),
            row.get("Topic/Description", "")
        ]
        # Remove empty/null/NaN values and strip whitespace
        cleaned = [str(f).strip() for f in fields if pd.notna(f) and str(f).strip() != ""]
        return ", ".join(cleaned)
    df["description"] = df.apply(merge_description, axis=1)
    df["type_of_teaching"] =  df["Type of Teaching"].fillna('').str.strip()


    # Handle start/end dates and combine as a single string (like Affiliations)
    def format_full_date(val):
        try:
            dt = pd.to_datetime(val, errors='coerce')
            if pd.isna(dt):
                return ''
            return dt.strftime('%d %B, %Y')
        except Exception:
            return ''

    start_dates = df["Appt Start Date"].apply(format_full_date) if "Appt Start Date" in df.columns else pd.Series(['']*len(df))
    end_dates = df["Appt End Date"].apply(format_full_date) if "Appt End Date" in df.columns else pd.Series(['']*len(df))

    def combine_dates(row):
        start = row["start_date"].strip() if "start_date" in row else ''
        end = row["end_date"].strip() if "end_date" in row else ''
        if start and end:
            return f"{start} - {end}"
        elif start:
            return start
        elif end:
            return end
        else:
            return ""

    df["start_date"] = start_dates
    df["end_date"] = end_dates
    df["dates"] = df.apply(combine_dates, axis=1)
    df["course"] = df["Course Number"].fillna('').str.strip()
    df["course_title"] = df["Course Name"].fillna('').str.strip()
    df["total_hours"] = df["Paid Total"].fillna('').str.strip()

    # Keep only the cleaned columns
    df = df[["user_id", "description", "type_of_teaching", "course", "course_title", "dates", "total_hours"]]

    # Replace NaN with empty string for all columns
    df = df.replace({np.nan: ''})

    # Split into two DataFrames by 'Type of Teaching'
    df_courses = df[df["type_of_teaching"].str.lower().str.contains("teaching without patient care")].copy()
    df_clinical = df[df["type_of_teaching"].str.lower().str.contains("teaching with patient care")].copy()

    # For df_courses, set 'category_-_level-of-student' to 'MD Undergraduate Program' (camel case)
    df_courses['category_-_level-of-student'] = 'MD Undergraduate Program'

    # Drop 'type_of_teaching' from output if not needed (optional)
    # df_courses = df_courses.drop(columns=["type_of_teaching"])
    # df_clinical = df_clinical.drop(columns=["type_of_teaching"])

    return df_courses, df_clinical


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


        # Connect to database
        connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
        cursor = connection.cursor()
        print("Connected to database")

        rows_processed = 0
        rows_added_to_db = 0
        errors = []

        # Step 1: Extract unique (Last Name, First Name) combos
        if 'Last Name' in df.columns and 'First Name' in df.columns:
            unique_names = df[['Last Name', 'First Name']].drop_duplicates()
        else:
            print("CSV missing 'Last Name' or 'First Name' columns.")
            return {
                'statusCode': 400,
                'status': 'FAILED',
                'error': "CSV missing 'Last Name' or 'First Name' columns."
            }

        # Step 2: For each unique combo, query users table for user_id
        def get_user_id(cursor, first_name, last_name):
            cursor.execute(
                "SELECT user_id FROM users WHERE first_name = %s AND last_name = %s",
                (first_name.strip(), last_name.strip())
            )
            result = cursor.fetchone()
            return result[0] if result else None

        # Step 3: For matched user_ids, save cleaned data to the section
        total_rows = 0
        for _, name_row in unique_names.iterrows():
            first_name = name_row['First Name']
            last_name = name_row['Last Name']
            user_id = get_user_id(cursor, first_name, last_name)
            if user_id:
                # Filter rows for this user
                user_rows = df[(df['First Name'] == first_name) & (df['Last Name'] == last_name)].copy()
                # Add PhysicianID column for cleanData
                user_rows['user_id'] = user_id
                # Clean and store data for this user
                cleaned_user_rows = cleanData(user_rows)
                rows_processed, rows_added_to_db = storeData(cleaned_user_rows, connection, cursor, errors, rows_processed, rows_added_to_db)
                total_rows += len(cleaned_user_rows)
            else:
                errors.append(f"No user_id found for {first_name} {last_name}")

        print("Data stored successfully.")
        cursor.close()
        connection.close()

        # Clean up - delete the processed file
        s3_client.delete_object(Bucket=bucket_name, Key=file_key)
        print(f"Processed file {file_key}, and deleted from bucket {bucket_name}")

        result = {
            'statusCode': 200,
            'status': 'COMPLETED',
            'total_rows': total_rows,
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

