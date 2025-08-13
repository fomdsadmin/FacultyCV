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
    # Print available columns for debugging
    print(f"Available columns in DataFrame: {df.columns.tolist()}")
    
    # Define expected columns
    expected_columns = ["physician_id", "employee_id", "last_name", "first_name", "email", "username", "role", "faculty", "department"]
    
    # Handle physician_id FIRST before converting to string type
    # Convert physician_id to integer if it has a value, otherwise None for auto-generation
    def process_user_id(x):
        if pd.isna(x) or x == '' or str(x).strip() == '' or str(x) == 'nan':
            return None
        try:
            return int(x)  # Convert string to integer (e.g., "123" -> 123)
        except (ValueError, TypeError):
            return None  # If conversion fails, let DB auto-generate
    
    df["user_id"] = df["physician_id"].apply(process_user_id)
    
    # Convert user_id to Int64 (nullable integer) to avoid float decimals while preserving NaN
    df["user_id"] = df["user_id"].astype('Int64')
    
    # Now ensure relevant columns are string type before using .str methods
    for col in expected_columns:
        if col in df.columns:
            df[col] = df[col].astype(str)
        else:
            print(f"Warning: Column '{col}' not found in DataFrame")
            # Add missing column with empty string values
            # df[col] = ''

    # Handle physician_id - if empty, set to None for auto-generation
    df["physician_id"] = df["physician_id"].fillna('').str.strip()
    
    df["employee_id"] = df["employee_id"].fillna('').str.strip()
    
    df["last_name"] = df["last_name"].fillna('').str.strip()
    df["first_name"] = df["first_name"].fillna('').str.strip()
    
    # Handle email - ensure empty values become empty strings, not 'nan'
    df["email"] = df["email"].fillna('').astype(str).str.strip()
    df["email"] = df["email"].apply(lambda x: '' if x == 'nan' or x == 'None' else x)
    
    # Handle username - ensure empty values become empty strings, not 'nan'
    df["username"] = df["username"].apply(lambda x: '' if x == 'nan' or x == 'None' else x)
    
    df["role"] = df["role"].fillna('').str.strip()
    df["faculty"] = df["faculty"].fillna('').str.strip()
    df["department"] = df["department"].fillna('').str.strip()

    # Keep only the cleaned columns and make an explicit copy to avoid SettingWithCopyWarning
    df = df[["user_id", "employee_id", "last_name", "first_name", "email", "username", "role", "faculty", "department"]].copy()

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
            if user_id_value is None or pd.isna(user_id_value):
                cursor.execute(
                    """
                    INSERT INTO users (employee_id, last_name, first_name, email, username, role, primary_faculty, primary_department, pending, approved)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (row['employee_id'], row['last_name'], row['first_name'], row['email'], 
                     row['username'], row['role'], row['faculty'], row['department'], False, True)
                )
            else:
                cursor.execute(
                    """
                    INSERT INTO users (user_id, employee_id, last_name, first_name, email, username, role, primary_faculty, primary_department, pending, approved)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (user_id_value, row['employee_id'], row['last_name'], row['first_name'], row['email'], 
                     row['username'], row['role'], row['faculty'], row['department'], False, True)
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

