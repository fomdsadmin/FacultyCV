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

SECTION_TITLE_A = "8b. Courses Taught"

def cleanData(df):
    """
    Cleans the input DataFrame by performing various transformations:
    Returns two DataFrames: a (Post-Secondary Education) and b (Dissertations with non-empty thesis titles)
    """
    # Make copies for processing different sections
    a = df.copy()
    
    # Ensure relevant columns are string type before using .str methods
    for col in ["user_id", "category_id", "course_term", "course_number", "principal_course_brief_description", "contact_hours", 
                "class_size", "lecture_hours", "tutorial_hours", "lab_hours", "other_hours", "course_role"]:
        if col in a.columns:
            a[col] = a[col].astype(str)

    # Helper function to safely clean string columns
    def safe_string_clean(series):
        """Safely clean a pandas series, handling NaN, None, and string representations"""
        return series.fillna('').astype(str).replace(['nan', 'None', 'null', 'NULL'], '').str.strip()
    
    # Helper function to process user_id with unique transformation
    def process_user_id(x):
        """Apply transformation to make user IDs unique - add 10000 to avoid conflicts"""
        if pd.isna(x) or x == '' or str(x).strip() == '' or str(x) == 'nan':
            return ""
        try:
            original_id = int(float(x))  # Handle cases like "123.0"
            # Apply transformation to make unique - add 534234 to avoid conflicts with existing IDs
            unique_id = original_id + 534234
            return str(unique_id)
        except (ValueError, TypeError):
            return str(x).strip()  # If conversion fails, return as string
    
    # Helper function to convert decimal hours to integers when possible
    def clean_hours(value):
        """Convert decimal hours to integers when they have no fractional component"""
        if pd.isna(value) or value == '' or str(value).strip() == '' or str(value) == 'nan':
            return ""
        try:
            # Convert to float first to handle string numbers
            float_val = float(str(value).strip())
            # Check if it's a whole number
            if float_val.is_integer():
                return str(int(float_val))
            else:
                return str(float_val)
        except (ValueError, TypeError):
            return str(value).strip()
    
    # Process dataframe A (Post-Secondary Education)
    a["user_id"] = a["user_id"].apply(process_user_id)
    # Convert user_id to Int64 (nullable integer) to avoid float decimals while preserving NaN
    a["user_id"] = a["user_id"].astype('Int64')
    a["course"] = safe_string_clean(a["course_number"]) if "course_number" in a.columns else ""
    a["contact_hours_(per_year)"] = a["contact_hours"].apply(clean_hours) if "contact_hours" in a.columns else ""
    a["number_of_students"] = safe_string_clean(a["class_size"]) if "class_size" in a.columns else ""
    a["lecture_hours_(per_year)"] = safe_string_clean(a["lecture_hours"]) if "lecture_hours" in a.columns else ""
    a["tutorial_hours_(per_year)"] = safe_string_clean(a["tutorial_hours"]) if "tutorial_hours" in a.columns else ""
    a["lab_hours_(per_year)"] = safe_string_clean(a["lab_hours"]) if "lab_hours" in a.columns else ""
    a["other_hours_(per_year)"] = safe_string_clean(a["other_hours"])
    a["category"] = safe_string_clean(a["category_id"]) if "category_id" in a.columns else ""
    a["brief_description"] = safe_string_clean(a["principal_course_brief_description"]) if "principal_course_brief_description" in a.columns else ""
    a["details"] = safe_string_clean(a["course_role"]) if "course_role" in a.columns else ""
    
    # Map category_id values to type column with custom mapping
    def map_category_to_type(row):
        category_id = str(row.get('category_id', '')).strip()
        category_mapping = {
            '2006': 'Undergraduate Non-medical School Teaching',
            '2008': 'MD Undergraduate Program',
            '2010': 'Post-graduate Medical Resident Teaching',
            '2013': 'Other Healthcare Professionals',
            '2016': 'Other Non-departmental Teaching',
            '2018': 'Graduate Non-Medical Teaching',
            '2014': 'Postdoctoral Fellows and Clinical Fellow Teaching',
            '2012': 'Others (BSc in Pharmacology)',
        }
        
        # Get the mapped value or use category_other as fallback
        if category_id in category_mapping:
            mapped_value = category_mapping[category_id]
            return mapped_value
        
    # Apply the mapping logic to create type and title columns
    a["category_id"] = safe_string_clean(a["category_id"]) if "category_id" in a.columns else ""
    a["category_-_level_of_student"] = a.apply(map_category_to_type, axis=1)
    
        # Map category_id values to type column with custom mapping
    def map_term_to_session(row):
        term_id = str(row.get('course_term', '')).strip()
        term_mapping = {
            'W - Term 1': 'Winter Term 1 (Sept - Dec)',
            'W - Term 2': 'Winter Term 2 (Jan - Apr)',
            'S': 'Summer Session (May - Aug)',
            'Term 1&2': 'Winter Term 1 & 2 (Sept - Apr)',
            'S/F': 'Other (S/F)',
            'W/S': 'Other (W/S)',
        }
        
        # Get the mapped value or use category_other as fallback
        if term_id in term_mapping:
            mapped_value = term_mapping[term_id]
            return mapped_value
    
    a["course_term"] = safe_string_clean(a["course_term"]) if "course_term" in a.columns else ""
    a["session"] = a.apply(map_term_to_session, axis=1)
    
    # start_date will be taken from year ('2013' , 'Present' (Should map to 'Current')) + month ('01 (should map to 'January')',  'id' (skip))
    def format_date(year):
        """
        Format year and month into a readable date string.
        Returns empty string if year is 'id' (skip), NaN, null, or empty.
        """
        # Handle year - check for NaN, None, empty, or 'id'
        if pd.isna(year) or year is None or str(year).strip().lower() in ['', 'nan', 'none', 'null', 'id']:
            return ""
        
        year_str = str(year).strip()
        if year_str.lower() == 'present':
            year_str = 'Current'
            return year_str
        
        return year_str
        

    # Process start_date and end_date for dataframe A
    if 'course_year' in a.columns:
        a['start_date'] = a.apply(lambda row: format_date(row['course_year']), axis=1)
    elif 'start_date' not in a.columns:
        a['start_date'] = ""
        
    if 'course_end_year' in a.columns:
        a['end_date'] = a.apply(lambda row: format_date(row['course_end_year']), axis=1)
    elif 'end_date' not in a.columns:
        a['end_date'] = ""

    # Ensure start_date and end_date are strings for dataframe A
    a['start_date'] = a['start_date'].astype(str).fillna('').str.strip()
    a['end_date'] = a['end_date'].astype(str).fillna('').str.strip()

    # Combine start and end dates into a single 'dates' column
    # Only show ranges when both dates exist, avoid empty dashes
    def combine_dates(row):
        # Safely get start and end dates, handling NaN/None
        start = str(row["start_date"]) if pd.notna(row["start_date"]) else ""
        end = str(row["end_date"]) if pd.notna(row["end_date"]) else ""
        
        # Clean the strings
        start = start.strip() if start not in ['nan', 'None', 'null', 'NULL'] else ""
        end = end.strip() if end not in ['nan', 'None', 'null', 'NULL'] else ""

        if start and end:
            return f"{start} - {end}"
        elif start:
            return start
        elif end:
            return end
        else:
            return ""
    a["dates"] = a.apply(combine_dates, axis=1)
    
    a = a[["user_id", "category_-_level_of_student", "course", "brief_description", "dates", "contact_hours_(per_year)", 
           "number_of_students", "lecture_hours_(per_year)", "tutorial_hours_(per_year)", "lab_hours_(per_year)", "other_hours_(per_year)", "session", "details"]]

    # Comprehensive replacement of NaN, None, and string representations with empty strings
    a = a.fillna('').replace(['nan', 'None', 'null', 'NULL', np.nan, None], '')
    
    return a


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
        
        # Ensure all values are clean strings, not NaN or None
        clean_row_dict = {}
        for key, value in row_dict.items():
            if pd.isna(value) or value is None:
                clean_row_dict[key] = ""
            elif str(value).lower() in ['nan', 'none', 'null']:
                clean_row_dict[key] = ""
            else:
                clean_row_dict[key] = str(value).strip()
        
        data_details_JSON = json.dumps(clean_row_dict)
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
        dfA = cleanData(df)
        print("Data cleaned successfully.")

        # Connect to database
        connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
        cursor = connection.cursor()
        print("Connected to database")

        rows_processed = 0
        rows_added_to_db = 0
        errors = []

        rows_processed, rows_added_to_db = storeData(dfA, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_A)
        # rows_processed, rows_added_to_db = storeData(dfB, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_B)
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

