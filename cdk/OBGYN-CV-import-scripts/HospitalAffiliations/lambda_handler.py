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
    df["division"] = df["Division"].fillna('').str.strip()
    df['medical_program'] = df['medical_program'].fillna('').str.strip()
    df['health_authority'] = df['health_authority'].fillna('').str.strip()

    # Map health authority entries to custom system values
    health_authority_map = {
        'PHC': 'Providence Health Care',
        'PHSA': 'Provincial Health Services Authority',
        'VCH': 'Vancouver Coastal Health',
        'FHA': 'Fraser Health Authority',
        'VCH/FHA': 'VCH/FHA',
        'VIHA': 'Island Health Authority',
        'IHA': 'Interior Health Authority',
        'NHA': 'Northern Health Authority',
        # Add more mappings as needed
    }
    def map_health_authority(val):
        return health_authority_map.get(val, val)
    df['health_authority'] = df['health_authority'].apply(map_health_authority)

    # Replace NaN with empty string for all columns
    df = df.replace({np.nan: ''})
    
    # Keep only relevant columns
    df = df[["employee_id", "job_profile", "business_title", "type", "apt_percent", "location", "division", "medical_program", "health_authority"]]

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
    - primary_unit: list for full-time appointments (to handle edge cases with 2 full-time entries)
    - Only process full-time entries, disregard part-time ones
    """
    affiliations_data = {}
    errors = []
    
    # Group data by user to handle multiple appointments per user
    user_appointments = {}
    
    for _, row in df.iterrows():
        employee_id = str(row['employee_id'])

        # Skip if employee_id not found in users table
        if employee_id not in user_mapping:
            errors.append(f"Employee ID {employee_id} not found in users table")
            continue

        # Skip if not full-time - only process full-time entries
        # if row['type'].lower() != 'full time':
        #     continue

        user_info = user_mapping[employee_id]
        user_id = user_info['user_id']

        # Initialize user's appointments if not exists
        if user_id not in user_appointments:
            user_appointments[user_id] = {
                'user_info': user_info,
                'full_time': []
            }

        # Create unit object for full-time appointments only
        unit_data = {
            'unit': 'Obstetrics & Gynaecology',
            'rank': row['job_profile'],
            'title': row['business_title'],
            'apt_percent': row['apt_percent'],
            'location': row['location'],
            'type': row['type'],
            'additional_info': {
                'division': row['division'],
                'program': row['medical_program'],
                'start': '',
                'end': ''
            }
        }

        # Add to full-time appointments
        user_appointments[user_id]['full_time'].append(unit_data)
    
    # Now process each user's appointments
    for user_id, appointments in user_appointments.items():
        user_info = appointments['user_info']
        full_time_appointments = appointments['full_time']

        # Find the employee_id for this user_id
        employee_id_for_user = None
        for emp_id, info in user_mapping.items():
            if info['user_id'] == user_id:
                employee_id_for_user = emp_id
                break

        # Initialize user's affiliations with primary_unit as a list
        affiliations_data[user_id] = {
            'user_id': user_id,
            'first_name': user_info['first_name'],
            'last_name': user_info['last_name'],
            'primary_unit': [],
            'joint_units': [],
            'research_affiliations': [],
            'hospital_affiliations': []
        }

        # Hospital affiliation: add only one entry, matching primary unit
        hospital_affiliation_entry = None
        if employee_id_for_user:
            # Use the first row for this employee_id
            row = df[df['employee_id'] == employee_id_for_user].iloc[0]
            if row['health_authority']:
                hospital_affiliation_entry = {
                    'authority': row['health_authority'],
                    'hospital': '',
                    'role': '',
                    'start': '',
                    'end': ''
                }
        if hospital_affiliation_entry:
            affiliations_data[user_id]['hospital_affiliations'].append(hospital_affiliation_entry)
        
        # Handle full-time appointments - all go to primary_unit as it's now a list
        affiliations_data[user_id]['primary_unit'] = full_time_appointments
    
    # After processing all appointments, leave percent blank for all units
    # No logic to assign percent values
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
                'primary_units': sum(len(data['primary_unit']) for data in affiliations_data.values()),
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
