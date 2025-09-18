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
    - Maps physician_id to user_id 
    - Fixes encoding issues in text fields
    """
    # Clean and prepare the data
    df["physician_id"] = df["PhysicianID"].astype(str).str.strip()

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
    
    # Apply encoding fixes to text columns that exist
    if 'Division' in df.columns:
        df["division"] = df["Division"].fillna('').str.strip().apply(fix_encoding)
    if 'medical_program' in df.columns:
        df['program'] = df['medical_program'].fillna('').str.strip().apply(fix_encoding)
    if 'health_authority' in df.columns:
        df['health_authority'] = df['health_authority'].fillna('').str.strip().apply(fix_encoding)
    if 'Rank' in df.columns:
        df['rank'] = df['Rank'].fillna('').str.strip().apply(fix_encoding)

    # Map health authority entries to custom system values
    if 'health_authority' in df.columns:
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
    
    return df

def getUserMapping(cursor, physician_ids):
    """
    Get user_id mapping from users table based on physician_id (user_id)
    Returns a dictionary mapping physician_id to user info
    """
    if not physician_ids:
        return {}
    
    # Create placeholders for the IN clause
    placeholders = ','.join(['%s'] * len(physician_ids))
    query = f"""
        SELECT user_id, first_name, last_name 
        FROM users 
        WHERE user_id IN ({placeholders})
    """
    
    cursor.execute(query, physician_ids)
    results = cursor.fetchall()
    
    # Create mapping dictionary
    user_mapping = {}
    for row in results:
        user_id, first_name, last_name = row
        user_mapping[str(user_id)] = {
            'user_id': user_id,
            'first_name': first_name,
            'last_name': last_name
        }
    
    return user_mapping

def updateAffiliationsData(df, user_mapping, cursor):
    """
    Update existing affiliations records based on CSV data:
    - Always update hospital affiliations when physician_id matches user_id
    - Only update division and program for primary appointments when academic rank matches
    """
    updates_made = 0
    errors = []
    skipped_rank_mismatch = 0
    skipped_no_affiliation = 0
    
    for _, row in df.iterrows():
        physician_id = str(row['physician_id'])
        
        # Skip if physician_id not found in users table
        if physician_id not in user_mapping:
            errors.append(f"Physician ID {physician_id} not found in users table")
            continue
        
        user_id = user_mapping[physician_id]['user_id']
        
        try:
            # Get existing affiliations for this user
            cursor.execute("SELECT primary_unit, joint_units, research_affiliations, hospital_affiliations FROM affiliations WHERE user_id = %s", (user_id,))
            result = cursor.fetchone()
            
            if not result:
                skipped_no_affiliation += 1
                errors.append(f"No existing affiliations found for user {user_id}")
                continue
            
            primary_unit, joint_units, research_affiliations, hospital_affiliations = result
            
            # Parse JSON fields - handle both string and already-parsed data
            def safe_json_parse(data):
                if data is None:
                    return []
                elif isinstance(data, str):
                    try:
                        return json.loads(data)
                    except (json.JSONDecodeError, TypeError):
                        return []
                elif isinstance(data, list):
                    return data
                else:
                    return []
            
            primary_unit = safe_json_parse(primary_unit)
            joint_units = safe_json_parse(joint_units)
            research_affiliations = safe_json_parse(research_affiliations)
            hospital_affiliations = safe_json_parse(hospital_affiliations)
            
            updated = False
            
            # Always update hospital affiliations when physician_id matches user_id
            if 'health_authority' in row and row['health_authority']:
                # Update or create hospital affiliation
                hospital_updated = False
                for hosp in hospital_affiliations:
                    if isinstance(hosp, dict):
                        hosp['authority'] = row['health_authority']
                        hospital_updated = True
                        break
                
                # If no hospital affiliation exists, create one
                if not hospital_updated:
                    hospital_affiliations.append({
                        'authority': row['health_authority'],
                        'hospital': '',
                        'role': '',
                        'start': '',
                        'end': ''
                    })
                updated = True
            
            # Check if any primary unit rank matches CSV rank for division/program updates
            csv_rank = row.get('rank', '').strip()
            rank_matched = False
            
            if csv_rank:
                # Update division and program only for primary units where rank matches
                for unit in primary_unit:
                    if isinstance(unit, dict) and unit.get('rank', '').strip() == csv_rank:
                        # Update additional_info for division and program
                        if 'additional_info' not in unit:
                            unit['additional_info'] = {}
                        
                        if 'division' in row and row['division']:
                            unit['additional_info']['division'] = row['division']
                        
                        if 'program' in row and row['program']:
                            unit['additional_info']['program'] = row['program']
                        
                        rank_matched = True
                        updated = True
            
            if updated:
                # Update the database record
                update_query = """
                UPDATE affiliations SET 
                    primary_unit = %s,
                    joint_units = %s,
                    research_affiliations = %s,
                    hospital_affiliations = %s
                WHERE user_id = %s
                """
                cursor.execute(update_query, (
                    json.dumps(primary_unit),
                    json.dumps(joint_units),
                    json.dumps(research_affiliations),
                    json.dumps(hospital_affiliations),
                    user_id
                ))
                updates_made += 1
            
            # Track rank mismatch only if no hospital update was made and rank didn't match
            if not updated or (csv_rank and not rank_matched and 'health_authority' not in row):
                skipped_rank_mismatch += 1
                if csv_rank:
                    errors.append(f"No matching rank '{csv_rank}' found in primary units for user {user_id}")
                
        except Exception as e:
            errors.append(f"Error updating user {user_id}: {str(e)}")
    
    return updates_made, errors, skipped_rank_mismatch, skipped_no_affiliation

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
    Loads a DataFrame from file bytes based on file extension (.csv, .xlsx, or .json).
    """
    if file_key.lower().endswith('.json'):
        # For JSON, decode bytes to text, parse, and convert to DataFrame
        json_str = file_bytes.decode('utf-8')
        json_data = json.loads(json_str)
        # Convert JSON to DataFrame
        if isinstance(json_data, list):
            return pd.DataFrame(json_data)
        elif isinstance(json_data, dict):
            # If it's a dict, assume it's a single record and convert to DataFrame
            return pd.DataFrame([json_data])
        else:
            raise ValueError('JSON data must be a list of objects or a single object')
    elif file_key.lower().endswith('.xlsx'):
        # For Excel, read as bytes
        return pd.read_excel(io.BytesIO(file_bytes))
    elif file_key.lower().endswith('.csv'):
        # For CSV, decode bytes to text
        return pd.read_csv(io.StringIO(file_bytes.decode('utf-8')), skiprows=0, header=0)
    else:
        raise ValueError('Unsupported file type. Only CSV, XLSX, and JSON are supported.')

def lambda_handler(event, context):
    """
    Processes affiliations update file (CSV or Excel) uploaded to S3
    Reads file with pandas, matches physician_id with user_id, and updates existing affiliations
    """
    try:
        # Parse S3 event
        s3_event = event["Records"][0]["s3"]
        bucket_name = s3_event["bucket"]["name"]
        file_key = s3_event["object"]["key"]

        print(f"Processing affiliations update file: {file_key} from bucket: {bucket_name}")

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
        required_columns = ['PhysicianID']
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

        # Get user mapping from physician_id to user info
        unique_physician_ids = df['physician_id'].unique().tolist()
        user_mapping = getUserMapping(cursor, unique_physician_ids)
        print(f"Found {len(user_mapping)} users in database")

        # Update existing affiliations data
        updates_made, errors, skipped_rank_mismatch, skipped_no_affiliation = updateAffiliationsData(df, user_mapping, cursor)
        print(f"Updated {updates_made} affiliations records")

        # Commit changes
        connection.commit()
        print("Changes committed to database.")
        
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
            'affiliations_updated': updates_made,
            'skipped_rank_mismatch': skipped_rank_mismatch,
            'skipped_no_affiliation': skipped_no_affiliation,
            'errors': errors[:20] if errors else [],  # Limit errors to first 20
            'summary': {
                'total_processed': len(df),
                'successful_updates': updates_made,
                'failed_updates': len(errors)
            }
        }

        print(f"Affiliations update completed: {result}")
        return result

    except Exception as e:
        print(f"Error processing affiliations update: {str(e)}")
        return {
            'statusCode': 500,
            'status': 'FAILED',
            'error': str(e)
        }
