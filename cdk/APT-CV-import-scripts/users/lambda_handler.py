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


def cleanData(df):
    """
    Cleans the input DataFrame by performing various transformations:
    """
    
    # Define expected columns
    expected_columns = ["id", "first_name", "middle_name", "last_name", "email", "active"]
    
    # Handle physician_id FIRST before converting to string type
    # Convert physician_id to integer if it has a value, otherwise None for auto-generation
    # Apply a simple transformation to make IDs unique (add offset to avoid conflicts)
    def process_user_id(x):
        if pd.isna(x) or x == '' or str(x).strip() == '' or str(x) == 'nan':
            return None
        try:
            original_id = int(x)  # Convert string to integer (e.g., "123" -> 123)
            # Apply transformation to make unique - add 10000 to avoid conflicts with existing IDs
            unique_id = original_id + 534234
            return unique_id
        except (ValueError, TypeError):
            return None  # If conversion fails, let DB auto-generate
    
    df["user_id"] = df["id"].apply(process_user_id)
    
    # Convert user_id to Int64 (nullable integer) to avoid float decimals while preserving NaN
    df["user_id"] = df["user_id"].astype('Int64')
    

    # Handle name fields - process first_name, middle_name, last_name
    def safe_string_clean(series, column_name):
        """Safely clean a pandas series, handling NaN, None, and string representations"""
        if column_name in df.columns:
            return series.fillna('').astype(str).replace(['nan', 'None', 'null', 'NULL'], '').str.strip()
        else:
            return ''
    
    # Clean individual name fields
    df["first_name"] = safe_string_clean(df.get("first_name", pd.Series(dtype=str)), "first_name")
    df["middle_name"] = safe_string_clean(df.get("middle_name", pd.Series(dtype=str)), "middle_name")
    df["last_name"] = safe_string_clean(df.get("last_name", pd.Series(dtype=str)), "last_name")
    
    # Combine first_name and middle_name for the final first_name field
    def combine_first_middle(row):
        first = str(row["first_name"]).strip() if pd.notna(row["first_name"]) else ""
        middle = str(row["middle_name"]).strip() if pd.notna(row["middle_name"]) else ""
        
        # Clean the strings
        first = first if first not in ['nan', 'None', 'null', 'NULL', ''] else ""
        middle = middle if middle not in ['nan', 'None', 'null', 'NULL', ''] else ""
        
        if first and middle:
            return f"{first} {middle}"
        elif first:
            return first
        elif middle:
            return middle
        else:
            return ""
    
    df["first_name"] = df.apply(combine_first_middle, axis=1)
    
    # Handle email - ensure empty values become empty strings, not 'nan'
    df["email"] = df["email"].fillna('').astype(str).str.strip()
    df["email"] = df["email"].apply(lambda x: '' if x == 'nan' or x == 'None' else x)
    
    # Handle active column - convert 0/1 to false/true
    if "active" in df.columns:
        def convert_active(x):
            if pd.isna(x) or x == '' or str(x).strip() == '':
                return False  # Default to false for empty values
            try:
                # Convert to int first, then to boolean
                val = int(float(x))  # Handle cases like "1.0"
                return bool(val)  # 0 -> False, 1 -> True
            except (ValueError, TypeError):
                return False  # Default to false for invalid values
        
        df["active"] = df["active"].apply(convert_active)
    else:
        df["active"] = False  # Default to false if column doesn't exist
    
    df["role"] = 'Faculty'
    df["faculty"] = 'Faculty of Medicine'
    df["department"] = 'Anesthesiology, Pharmacology & Therapeutics'
    
    # Handle employee_id and username fields if they exist, otherwise set defaults
    if "employee_id" not in df.columns:
        df["employee_id"] = ''
    else:
        df["employee_id"] = df["employee_id"].fillna('').astype(str).str.strip()
    
    if "username" not in df.columns:
        df["username"] = ''
    else:
        df["username"] = df["username"].fillna('').astype(str).str.strip()

    # Keep only the cleaned columns and make an explicit copy to avoid SettingWithCopyWarning
    df = df[["user_id", "employee_id", "first_name", "last_name", "email", "username", "active", "role", "faculty", "department"]].copy()

    # Replace NaN with empty string for all columns except user_id
    for col in df.columns:
        if col != 'user_id':
            df.loc[:, col] = df[col].replace({np.nan: ''})
    
    return df


def storeData(df, connection, cursor, errors, rows_processed, rows_added_to_db):
    """
    Store the cleaned DataFrame into the database.
    Returns updated rows_processed and rows_added_to_db.
    """
    for i, row in df.iterrows():
        try:
            # Check if user_id is None or NaN - let the database auto-generate it
            user_id_value = row['user_id']
            cursor.execute(
                """
                INSERT INTO users (user_id, last_name, first_name, email, cwl_username, role, primary_faculty, primary_department, active, pending, approved, terminated)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (user_id_value, row['last_name'], row['first_name'], row['email'], 
                row['username'], row['role'], row['faculty'], row['department'], row['active'], False, True, False)
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

    except Exception as e:
        print(f"Error processing manual upload: {str(e)}")
        return {
            'statusCode': 500,
            'status': 'FAILED',
            'error': str(e)
        }

