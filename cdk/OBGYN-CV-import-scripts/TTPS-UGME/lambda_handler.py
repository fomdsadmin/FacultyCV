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

SECTION_TITLE = "8b. Courses Taught"
SECTION_TITLE_OTHER = "8b.3. Clinical Teaching"

def extract_student_name(topic_description):
    """
    Extract student name from parentheses in topic description.
    Examples:
    - 'GyneOnc elective - 2 wks (Tanya Tewari)' -> 'Tanya Tewari'
    - '[G6/2026] Preceptor Week (Callahan Brebner)' -> 'Callahan Brebner'
    - 'Year 4 OSCE' -> ''
    """
    import re
    if not topic_description or pd.isna(topic_description):
        return ''
    
    # Look for content in parentheses
    match = re.search(r'\(([^)]+)\)', str(topic_description))
    if match:
        potential_name = match.group(1).strip()
        # Check if it looks like a name (contains at least one space and alphabetic characters)
        if ' ' in potential_name and re.match(r'^[A-Za-z\s]+$', potential_name):
            return potential_name
    
    return ''

def cleanData(df):
    """
    Cleans the input DataFrame by performing various transformations:
    Returns two DataFrames: one for courses taught and one for clinical teaching
    """
    # Ensure relevant columns are string type before using .str methods
    for col in ["Track ID", "Teaching Date", "Course Name", "Course Number", "Course Year", "Activity", "Receiving Function", "Topic/Description", "Type of Teaching", "Paid Total" ]:
        if col in df.columns:
            df[col] = df[col].astype(str)
            
    df["track_id"] =  df["Track ID"].fillna('').str.strip()
    df['receiving_function'] = df['Receiving Function'].fillna('').str.strip()
    df['activity'] = df['Activity'].fillna('').str.strip()
    df['topic_description'] = df['Topic/Description'].fillna('').str.strip()
    
    # Merge Receiving Function, Activity, Topic/Description into brief_description
    def merge_description(row):
        fields = [
            row.get("Receiving Function", None),
            row.get("Activity", None),
            row.get("Topic/Description", None)
        ]
        # Only include non-empty, non-NaN values and exclude string 'nan'
        cleaned = [
            str(f).strip()
            for f in fields
            if f is not None and pd.notna(f) and str(f).strip() != "" and str(f).strip().lower() != "nan"
        ]
        return ", ".join(cleaned) if cleaned else ""
    df["brief_description"] = df.apply(merge_description, axis=1)
    df["type_of_teaching"] =  df["Type of Teaching"].fillna('').str.strip()
    
    # Handle course fields properly to avoid 'nan' strings
    def clean_field(val):
        if pd.isna(val) or str(val).strip().lower() == 'nan':
            return ''
        return str(val).strip()
    
    df["course"] = df["Course Number"].apply(clean_field) if "Course Number" in df.columns else pd.Series(['']*len(df))
    df["course_title"] = df["Course Name"].apply(clean_field) if "Course Name" in df.columns else pd.Series(['']*len(df))
    df["course_year"] = df["Course Year"].apply(clean_field) if "Course Year" in df.columns else pd.Series(['']*len(df))

    # Handle start/end dates and combine as a single string (like Affiliations)
    def format_full_date(val):
        try:
            dt = pd.to_datetime(val, errors='coerce')
            if pd.isna(dt):
                return ''
            return dt.strftime('%B %Y')
        except Exception:
            return ''

    df["dates"] = df["Teaching Date"].apply(format_full_date) if "Teaching Date" in df.columns else pd.Series(['']*len(df))
    df["total_hours"] = df["Paid Total"].fillna('').str.strip()

    # Keep only the cleaned columns
    df = df[["track_id", "user_id", "brief_description", "type_of_teaching", "dates", "total_hours", "course", "course_title", "topic_description", "course_year"]]

    # Replace NaN with empty string for all columns
    df = df.replace({np.nan: ''})

    # Split into two DataFrames by 'Type of Teaching'
    df_courses = df[df["type_of_teaching"].str.lower().str.contains("teaching without patient care", na=False)].copy()
    df_clinical = df[df["type_of_teaching"].str.lower().str.contains("teaching with patient care", na=False)].copy()

    # For df_courses, set 'category_-_level_of_student' to 'MD Undergraduate Program'
    if not df_courses.empty:
        df_courses['category_-_level_of_student'] = 'MD Undergraduate Program'
        df_courses.drop(columns=['topic_description'], inplace=True, errors='ignore')
        df_courses.drop(columns=['course_year'], inplace=True, errors='ignore')
    
    # For df_clinical, extract student names and set student level based on Course Year
    if not df_clinical.empty:
        # Map Course Year values to student levels
        year_mapping = {
            '1': 'Year 1',
            '2': 'Year 2', 
            '3': 'Year 3 (Clinical Clerkship)',
            '4': 'Year 4'
        }
        df_clinical['student_level'] = df_clinical['course_year'].map(year_mapping).fillna('Year 3 (Clinical Clerkship)')
        df_clinical['student_name(s)'] = df_clinical['topic_description'].apply(extract_student_name)
        df_clinical.drop(columns=['topic_description'], inplace=True, errors='ignore')

    return df_courses, df_clinical

def storeData(df, connection, cursor, errors, rows_processed, rows_added_to_db, section_title):
    """
    Store the cleaned DataFrame into the database.
    Returns updated rows_processed and rows_added_to_db.
    """
    # Skip if DataFrame is empty
    if df.empty:
        return rows_processed, rows_added_to_db
        
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
        errors.append(f"Skipping insert: data_section_id not found for '{section_title}'.")
        return rows_processed, rows_added_to_db

    for i, row in df.iterrows():
        row_dict = row.to_dict()
        track_id = row_dict.get('track_id', '').strip()
        user_id = row_dict.get('user_id', None)
        # Remove user_id from data_details
        row_dict.pop('user_id', None)
        data_details_JSON = json.dumps(row_dict)
        # Check for existing entry with same track_id and user_id
        exists = False
        try:
            cursor.execute(
                """
                SELECT 1 FROM user_cv_data
                WHERE user_id = %s AND data_section_id = %s AND data_details::jsonb ->> 'track_id' = %s
                LIMIT 1
                """,
                (user_id, data_section_id, track_id)
            )
            if cursor.fetchone():
                exists = True
        except Exception as e:
            errors.append(f"Error checking for existing track_id for row {i}: {str(e)}")
            exists = False
        if not exists:
            try:
                cursor.execute(
                    """
                    INSERT INTO user_cv_data (user_id, data_section_id, data_details, editable)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (user_id, data_section_id, data_details_JSON, True)
                )
                rows_added_to_db += 1
            except Exception as e:
                errors.append(f"Error inserting row {i}: {str(e)}")
        else:
            errors.append(f"Skipped row {i}: track_id '{track_id}' for user_id '{user_id}' already exists.")
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
                "SELECT user_id FROM users WHERE first_name = %s AND last_name = %s and primary_department = 'Obstetrics & Gynaecology' LIMIT 1",
                (first_name.strip(), last_name.strip())
            )
            result = cursor.fetchone()
            return result[0] if result else None

        # Step 3: For matched user_ids, save cleaned data to the sections
        total_rows = 0
        for _, name_row in unique_names.iterrows():
            first_name = name_row['First Name']
            last_name = name_row['Last Name']
            user_id = get_user_id(cursor, first_name, last_name)
            if user_id:
                # Filter rows for this user
                user_rows = df[(df['First Name'] == first_name) & (df['Last Name'] == last_name)].copy()
                # Add user_id column for cleanData
                user_rows['user_id'] = user_id
                # Clean and store data for this user
                cleaned_courses, cleaned_clinical = cleanData(user_rows)
                
                # Store courses data (Teaching without patient care) to 8b. Courses Taught
                if not cleaned_courses.empty:
                    rows_processed, rows_added_to_db = storeData(
                        cleaned_courses, connection, cursor, errors, 
                        rows_processed, rows_added_to_db, SECTION_TITLE
                    )
                    total_rows += len(cleaned_courses)
                
                # Store clinical data (Teaching with patient care) to 8b.3. Clinical Teaching
                if not cleaned_clinical.empty:
                    rows_processed, rows_added_to_db = storeData(
                        cleaned_clinical, connection, cursor, errors, 
                        rows_processed, rows_added_to_db, SECTION_TITLE_OTHER
                    )
                    total_rows += len(cleaned_clinical)
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

