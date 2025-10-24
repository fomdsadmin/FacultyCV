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
    - Structures data into joint_units format
    - Fixes encoding issues in text fields
    """
    # Clean and prepare the data
    df["employee_id"] = df["employee_id"].astype(str).str.strip()
    df["job_profile"] = df["job_profile"].fillna('').str.strip()
    df["business_title"] = df["business_title"].fillna('').str.strip()
    df["type"] = df["type"].fillna('').str.strip().str.lower()
    df["location"] = df["location"].fillna('').str.strip()
    df["apt_percent"] = df["apt_percent"].astype(str).str.strip()

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

def getExistingAffiliations(cursor, user_ids):
    """
    Get existing affiliations for the given user_ids
    Returns a dictionary mapping user_id to their current affiliations
    """
    if not user_ids:
        return {}
    
    # Create placeholders for the IN clause
    placeholders = ','.join(['%s'] * len(user_ids))
    query = f"""
        SELECT user_id, primary_unit, joint_units, research_affiliations, hospital_affiliations
        FROM affiliations 
        WHERE user_id IN ({placeholders})
    """
    
    cursor.execute(query, user_ids)
    results = cursor.fetchall()
    
    # Create affiliations dictionary
    existing_affiliations = {}
    for row in results:
        user_id, primary_unit, joint_units, research_affiliations, hospital_affiliations = row
        
        # Parse JSON fields
        try:
            primary_unit_data = json.loads(primary_unit) if primary_unit else []
        except (json.JSONDecodeError, TypeError):
            primary_unit_data = []
        
        try:
            joint_units_data = json.loads(joint_units) if joint_units else []
        except (json.JSONDecodeError, TypeError):
            joint_units_data = []
        
        try:
            research_affiliations_data = json.loads(research_affiliations) if research_affiliations else []
        except (json.JSONDecodeError, TypeError):
            research_affiliations_data = []
        
        try:
            hospital_affiliations_data = json.loads(hospital_affiliations) if hospital_affiliations else []
        except (json.JSONDecodeError, TypeError):
            hospital_affiliations_data = []
        
        existing_affiliations[user_id] = {
            'primary_unit': primary_unit_data,
            'joint_units': joint_units_data,
            'research_affiliations': research_affiliations_data,
            'hospital_affiliations': hospital_affiliations_data
        }
    
    return existing_affiliations

def structureJointAffiliationsData(df, user_mapping, existing_affiliations):
    """
    Structure the data to append joint units to existing affiliations:
    - Process all entries (regardless of type) as joint appointments
    - Append to existing joint_units list for each user
    """
    updated_affiliations = {}
    errors = []
    
    # Group data by user to handle multiple joint appointments per user
    user_joint_appointments = {}
    
    for _, row in df.iterrows():
        employee_id = str(row['employee_id'])

        # Skip if employee_id not found in users table
        if employee_id not in user_mapping:
            errors.append(f"Employee ID {employee_id} not found in users table")
            continue

        user_info = user_mapping[employee_id]
        user_id = user_info['user_id']

        # Initialize user's joint appointments if not exists
        if user_id not in user_joint_appointments:
            user_joint_appointments[user_id] = {
                'user_info': user_info,
                'joint_appointments': []
            }

        # Create unit object for joint appointment
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

        # Add to joint appointments
        user_joint_appointments[user_id]['joint_appointments'].append(unit_data)
    
    # Now process each user's joint appointments
    for user_id, appointments in user_joint_appointments.items():
        user_info = appointments['user_info']
        joint_appointments = appointments['joint_appointments']

        # Get existing affiliations for this user
        existing_data = existing_affiliations.get(user_id, {
            'primary_unit': [],
            'joint_units': [],
            'research_affiliations': [],
            'hospital_affiliations': []
        })

        # Append new joint appointments to existing joint_units
        updated_joint_units = existing_data['joint_units'].copy()
        updated_joint_units.extend(joint_appointments)

        # Store updated affiliations
        updated_affiliations[user_id] = {
            'user_id': user_id,
            'first_name': user_info['first_name'],
            'last_name': user_info['last_name'],
            'primary_unit': existing_data['primary_unit'],
            'joint_units': updated_joint_units,
            'research_affiliations': existing_data['research_affiliations'],
            'hospital_affiliations': existing_data['hospital_affiliations']
        }
    
    return updated_affiliations, errors

def storeData(updated_affiliations, connection, cursor, errors, rows_processed, rows_added_to_db):
    """
    Store the updated affiliations data (with appended joint units) into the database.
    """
    for user_id, user_data in updated_affiliations.items():
        try:
            # Check if record already exists
            cursor.execute("SELECT COUNT(*) FROM affiliations WHERE user_id = %s", (user_id,))
            record_exists = cursor.fetchone()[0] > 0
            
            if record_exists:
                # Update existing record with new joint units
                query = """
                UPDATE affiliations SET 
                    joint_units = %s
                WHERE user_id = %s
                """
                cursor.execute(query, (
                    json.dumps(user_data['joint_units']),
                    user_id,
                ))
            else:
                # Insert new record (this case should be rare since we're appending to existing data)
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
    Processes joint affiliations upload file (CSV or Excel) uploaded to S3
    Reads file with pandas, transforms, and appends to existing joint_units in affiliations table
    """
    try:
        # Parse S3 event
        s3_event = event["Records"][0]["s3"]
        bucket_name = s3_event["bucket"]["name"]
        file_key = s3_event["object"]["key"]

        print(f"Processing joint affiliations file: {file_key} from bucket: {bucket_name}")

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

        # Get user_ids for existing affiliations lookup
        user_ids = list(user_mapping[emp_id]['user_id'] for emp_id in user_mapping.keys())
        
        # Get existing affiliations
        existing_affiliations = getExistingAffiliations(cursor, user_ids)
        print(f"Found existing affiliations for {len(existing_affiliations)} users")

        # Structure the data for joint affiliations append
        updated_affiliations, structure_errors = structureJointAffiliationsData(df, user_mapping, existing_affiliations)
        print(f"Structured joint appointments for {len(updated_affiliations)} users")

        # Store data in database
        rows_processed = 0
        rows_added_to_db = 0
        errors = structure_errors.copy()

        rows_processed, rows_added_to_db = storeData(
            updated_affiliations, connection, cursor, errors, rows_processed, rows_added_to_db
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
            'users_with_existing_affiliations': len(existing_affiliations),
            'users_processed': rows_processed,
            'users_updated_in_database': rows_added_to_db,
            'errors': errors[:20] if errors else [],  # Limit errors to first 20
            'summary': {
                'joint_units_appended': sum(len(data['joint_units']) - len(existing_affiliations.get(user_id, {}).get('joint_units', [])) 
                                          for user_id, data in updated_affiliations.items()),
                'total_joint_units_after_update': sum(len(data['joint_units']) for data in updated_affiliations.values())
            }
        }

        print(f"Joint affiliations import completed: {result}")
        return result

    except Exception as e:
        print(f"Error processing joint affiliations import: {str(e)}")
        return {
            'statusCode': 500,
            'status': 'FAILED',
            'error': str(e)
        }
