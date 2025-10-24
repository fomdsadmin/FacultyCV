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

SECTION_TITLE_A = "8[f-i]. Other Teaching and Learning Activities"

def cleanData(df):
    """
    Cleans the input DataFrame by performing various transformations:
    """
    # Make copies for processing different sections
    a = df.copy()
    
    # Ensure relevant columns are string type before using .str methods
    for col in ["user_id", "description_of_leadership"]:
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
    
    a["user_id"] = a["user_id"].apply(process_user_id)
    # Convert user_id to Int64 (nullable integer) to avoid float decimals while preserving NaN
    a["user_id"] = a["user_id"].astype('Int64')
    a["details"] = safe_string_clean(a["description_of_leadership"]) if "description_of_leadership" in a.columns else ""
    a["type"] = 'g. Educational Leadership'
    
    
    # start_date will be taken from year ('2013' , 'Present' (Should map to 'Current')) + month ('01 (should map to 'January')',  'id' (skip))
    def format_date(year, month):
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
        
        # Handle month - check for NaN, None, empty, or 'id'
        if pd.isna(month) or month is None or str(month).strip().lower() in ['', 'nan', 'none', 'null', 'id']:
            return year_str
        
        month_str = str(month).strip()
        # Map month numbers to month names
        month_mapping = {
            '01': 'January', '02': 'February', '03': 'March', '04': 'April',
            '05': 'May', '06': 'June', '07': 'July', '08': 'August',
            '09': 'September', '10': 'October', '11': 'November', '12': 'December',
            '1': 'January', '2': 'February', '3': 'March', '4': 'April',
            '5': 'May', '6': 'June', '7': 'July', '8': 'August',
            '9': 'September'
        }
        
        if month_str in month_mapping:
            return f"{month_mapping[month_str]} {year_str}"
        elif month_str.lower() not in ['', 'nan', 'none', 'null', 'id']:
            # If month is already a name or other format, use as is
            return f"{month_str} {year_str}"
        else:
            return year_str

    # Process start_date and end_date for dataframe A
    if 'year' in a.columns and 'month' in a.columns:
        a['start_date'] = a.apply(lambda row: format_date(row['year'], row['month']), axis=1)
    elif 'start_date' not in a.columns:
        a['start_date'] = ""
        
    if 'end_year' in a.columns and 'end_month' in a.columns:
        a['end_date'] = a.apply(lambda row: format_date(row['end_year'], row['end_month']), axis=1)
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
    
    a = a[["user_id", "details", "dates", "type"]]

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

