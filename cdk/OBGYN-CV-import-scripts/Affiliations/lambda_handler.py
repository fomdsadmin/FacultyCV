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
DB_PROXY_ENDPOINT = os.environ.get('DB_PROXY_ENDPOINT')

def cleanData(df):
    """
    Cleans the input DataFrame by performing various transformations:
    - Maps employee_id to user_id from users table
    - Structures data into primary_unit and joint_units format
    - Fixes encoding issues in text fields
    """
    # Clean and prepare the data
    df["employee_id"] = df["employee_id"].astype(str).str.strip()
    df["job_profile"] = df["job_profile"].fillna('').str.strip()
    df["business_title"] = df["business_title"].fillna('').str.strip()
    df["type"] = df["type"].fillna('').str.strip().str.lower()
    df["location"] = df["location"].fillna('').str.strip()
    
    # Fix encoding issues in text fields
    def fix_encoding(text):
        if not isinstance(text, str):
            return text
        
        # Common encoding fixes for broken UTF-8/Windows-1252 characters
        replacements = {
            'â€™': "'",  # Right single quotation mark
            'â€œ': '"',  # Left double quotation mark
            'â€': '"',   # Right double quotation mark
            'â€"': '–',  # En dash
            'â€"': '—',  # Em dash
            'â€¢': '•',  # Bullet point
            'â€¦': '…',  # Horizontal ellipsis
            'Ã¡': 'á',   # á with acute accent
            'Ã©': 'é',   # é with acute accent
            'Ã­': 'í',   # í with acute accent
            'Ã³': 'ó',   # ó with acute accent
            'Ãº': 'ú',   # ú with acute accent
            'Ã±': 'ñ',   # ñ with tilde
            'Ã ': 'à',   # à with grave accent
            'Ã¨': 'è',   # è with grave accent
            'Ã¬': 'ì',   # ì with grave accent
            'Ã²': 'ò',   # ò with grave accent
            'Ã¹': 'ù',   # ù with grave accent
        }
        
        for broken, fixed in replacements.items():
            text = text.replace(broken, fixed)
        
        return text
    
    # Apply encoding fixes to text columns
    df["location"] = df["location"].apply(fix_encoding)
    
    # Replace NaN with empty string for all columns
    df = df.replace({np.nan: ''})
    
    # Keep only relevant columns
    df = df[["employee_id", "job_profile", "business_title", "type", "location"]]
    
    return df

def getUserMapping(cursor, employee_ids):
    """
    Get user_id mapping from users table based on employee_id
    Returns a dictionary mapping employee_id to user_id
    """
    if not employee_ids:
        return {}
    
    # Create placeholders for the IN clause
    placeholders = ','.join(['%s'] * len(employee_ids))
    query = f"""
        SELECT employee_id, user_id, first_name, last_name 
        FROM users 
        WHERE employee_id IN ({placeholders})
    """
    
    cursor.execute(query, employee_ids)
    results = cursor.fetchall()
    
    # Create mapping dictionary
    user_mapping = {}
    for row in results:
        employee_id, user_id, first_name, last_name = row
        user_mapping[str(employee_id)] = {
            'user_id': user_id,
            'first_name': first_name,
            'last_name': last_name
        }
    
    return user_mapping

def structureAffiliationsData(df, user_mapping):
    """
    Structure the data into the format expected by the affiliations table:
    - primary_unit: object for type="Full time"
    - joint_units: array for type="Part time"
    """
    affiliations_data = {}
    errors = []
    
    for _, row in df.iterrows():
        employee_id = str(row['employee_id'])
        
        # Skip if employee_id not found in users table
        if employee_id not in user_mapping:
            errors.append(f"Employee ID {employee_id} not found in users table")
            continue
        
        user_info = user_mapping[employee_id]
        user_id = user_info['user_id']
        
        # Initialize user's affiliations if not exists
        if user_id not in affiliations_data:
            affiliations_data[user_id] = {
                'user_id': user_id,
                'first_name': user_info['first_name'],
                'last_name': user_info['last_name'],
                'primary_unit': {},
                'joint_units': [],
                'research_affiliations': [],
                'hospital_affiliations': []
            }
        
        # Create unit object
        unit_data = {
            'unit': 'Obstetrics & Gynaecology',  # Will be mapped from department/unit if available, otherwise empty
            'rank': row['job_profile'],  # job_profile maps to rank
            'title': row['business_title'],
            'percent': '',  # Not provided in CSV, will be empty
            'location': row['location'],
            'additional_info': {
                'division': '',
                'program': '',
                'start': '',
                'end': ''
            }
        }
        
        # Assign to primary_unit or joint_units based on type
        if row['type'].lower() == 'full time':
            # For full time, we need to handle multiple entries
            if not affiliations_data[user_id]['primary_unit']:
                # First full-time entry goes to primary_unit
                affiliations_data[user_id]['primary_unit'] = unit_data
            else:
                # Additional full-time entries go to joint_units
                affiliations_data[user_id]['joint_units'].append(unit_data)
        elif row['type'].lower() == 'part time':
            # Part-time entries always go to joint_units
            affiliations_data[user_id]['joint_units'].append(unit_data)
        else:
            errors.append(f"Unknown type '{row['type']}' for employee {employee_id}. Expected 'Full time' or 'Part time'")
    
    # After processing all rows, set percentage based on appointment structure
    for user_id, user_data in affiliations_data.items():
        has_primary = bool(user_data['primary_unit'])
        joint_count = len(user_data['joint_units'])
        
        if has_primary and joint_count == 0:
            # Single primary unit only - set to 100%
            user_data['primary_unit']['percent'] = '100'
        elif has_primary and joint_count == 1:
            # Check if the joint unit was originally a full-time entry (multiple full-time case)
            # We can identify this by checking if we have exactly 2 total units
            total_units = 1 + joint_count  # 1 primary + joint count
            if total_units == 2:
                # Likely case: 2 full-time entries split between primary and joint
                user_data['primary_unit']['percent'] = '50'
                user_data['joint_units'][0]['percent'] = '50'
            # For other cases (primary + part-time), leave blank for manual input
        # For all other cases (multiple joints, complex arrangements), leave blank for manual input
    
    return affiliations_data, errors

def storeData(affiliations_data, connection, cursor, errors, rows_processed, rows_added_to_db):
    """
    Store the structured affiliations data into the database.
    """
    for user_id, user_data in affiliations_data.items():
        try:
            # Check if record already exists
            cursor.execute("SELECT COUNT(*) FROM affiliations WHERE user_id = %s", (user_id,))
            record_exists = cursor.fetchone()[0] > 0
            
            if record_exists:
                # Update existing record
                query = """
                UPDATE affiliations SET 
                    primary_unit = %s,
                    joint_units = %s,
                    research_affiliations = %s,
                    hospital_affiliations = %s
                WHERE user_id = %s
                """
                cursor.execute(query, (
                    json.dumps(user_data['primary_unit']),
                    json.dumps(user_data['joint_units']),
                    json.dumps(user_data['research_affiliations']),
                    json.dumps(user_data['hospital_affiliations']),
                    user_id,
                ))
                print(f"Updated affiliations for user {user_id}")
            else:
                # Insert new record
                query = """
                INSERT INTO affiliations (
                    user_id, first_name, last_name,
                    primary_unit, joint_units, research_affiliations, hospital_affiliations
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """
                cursor.execute(query, (
                    user_id,
                    user_data['first_name'],
                    user_data['last_name'],
                    json.dumps(user_data['primary_unit']),
                    json.dumps(user_data['joint_units']),
                    json.dumps(user_data['research_affiliations']),
                    json.dumps(user_data['hospital_affiliations'])
                ))
                print(f"Inserted new affiliations for user {user_id}")
            
            rows_added_to_db += 1
            
        except Exception as e:
            errors.append(f"Error processing user {user_id}: {str(e)}")
        finally:
            rows_processed += 1
    
    connection.commit()
    return rows_processed, rows_added_to_db

def fetchFromS3(bucket, key):
    """
    Fetch the raw csv data from s3
    :param bucket: str, the name of the target bucket
    :param key_raw: str, the key (path) to the raw csv file
    :return file bytes
    """
    s3 = boto3.resource('s3')
    s3_bucket_raw = s3.Object(bucket, key)
    response = s3_bucket_raw.get()
    file_bytes = response["Body"].read()
    return file_bytes

def loadData(file_bytes, file_key):
    """
    Loads a DataFrame from file bytes based on file extension (.csv or .xlsx).
    """
    if file_key.lower().endswith('.xlsx'):
        # For Excel, read as bytes
        return pd.read_excel(io.BytesIO(file_bytes))
    elif file_key.lower().endswith('.csv'):
        # For CSV, decode bytes to text
        return pd.read_csv(io.StringIO(file_bytes.decode('utf-8')), skiprows=0, header=0)
    else:
        raise ValueError('Unsupported file type. Only CSV and XLSX are supported.')

def lambda_handler(event, context):
    """
    Processes affiliations upload file (CSV or Excel) uploaded to S3
    Reads file with pandas, transforms, and adds to affiliations table
    """
    try:
        # Parse S3 event
        s3_event = event["Records"][0]["s3"]
        bucket_name = s3_event["bucket"]["name"]
        file_key = s3_event["object"]["key"]

        print(f"Processing affiliations file: {file_key} from bucket: {bucket_name}")

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
        print(f"Loaded {len(df)} rows with columns: {list(df.columns)}")

        # Validate required columns
        required_columns = ['employee_id', 'job_profile', 'business_title', 'type', 'location']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return {
                'statusCode': 400,
                'status': 'FAILED',
                'error': f'Missing required columns: {missing_columns}'
            }

        # Clean the DataFrame
        df = cleanData(df)
        print("Data cleaned successfully.")
        print(df.head().to_string())

        # Connect to database
        connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
        cursor = connection.cursor()
        print("Connected to database")

        # Get user mapping from employee_id to user_id
        unique_employee_ids = df['employee_id'].unique().tolist()
        user_mapping = getUserMapping(cursor, unique_employee_ids)
        print(f"Found {len(user_mapping)} users in database")

        # Structure the data for affiliations table
        affiliations_data, structure_errors = structureAffiliationsData(df, user_mapping)
        print(f"Structured data for {len(affiliations_data)} users")

        # Store data in database
        rows_processed = 0
        rows_added_to_db = 0
        errors = structure_errors.copy()

        rows_processed, rows_added_to_db = storeData(
            affiliations_data, connection, cursor, errors, rows_processed, rows_added_to_db
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
            'total_csv_rows': len(df),
            'unique_users_found': len(user_mapping),
            'users_processed': rows_processed,
            'users_added_to_database': rows_added_to_db,
            'errors': errors[:20] if errors else [],  # Limit errors to first 20
            'summary': {
                'primary_units': sum(1 for data in affiliations_data.values() if data['primary_unit']),
                'joint_units': sum(len(data['joint_units']) for data in affiliations_data.values())
            }
        }

        print(f"Affiliations import completed: {result}")
        return result

    except Exception as e:
        print(f"Error processing affiliations import: {str(e)}")
        return {
            'statusCode': 500,
            'status': 'FAILED',
            'error': str(e)
        }
