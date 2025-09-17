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

def processUserData(user_data_list, connection, cursor):
    """
    Process the JSON user data to update users table and create affiliations data
    """
    updated_users = 0
    affiliations_data = {}
    errors = []
    
    # Extract employee IDs from the JSON data
    employee_ids = [str(user['employeeId']) for user in user_data_list if 'employeeId' in user]
    
    # Get existing users from database
    user_mapping = getUserMapping(cursor, employee_ids)
    print(f"Found {len(user_mapping)} existing users in database")
    
    for user in user_data_list:
        try:
            employee_id = str(user.get('employeeId', ''))
            
            # Skip if employee not found in database
            if employee_id not in user_mapping:
                errors.append(f"Employee ID {employee_id} not found in users table")
                continue
            
            user_id = user_mapping[employee_id]['user_id']
            
            # Update user information
            update_result = updateUserInfo(user, user_id, cursor)
            if update_result['success']:
                updated_users += 1
            else:
                errors.append(f"Failed to update user {employee_id}: {update_result['error']}")
            
            # Process academic appointments for affiliations
            if 'academicAppointments' in user and user['academicAppointments']:
                affiliations_result = processAcademicAppointments(
                    user, user_id, user_mapping[employee_id]
                )
                affiliations_data[user_id] = affiliations_result
            
        except Exception as e:
            errors.append(f"Error processing user {user.get('employeeId', 'unknown')}: {str(e)}")
            
            
    connection.commit()
    return updated_users, affiliations_data, errors

def updateUserInfo(user_data, user_id, cursor):
    """
    Update user information in the users table
    """
    try:
        # Extract relevant fields from JSON
        cwl = user_data.get('cwl', '')
        if (cwl):
            cwl = cwl + '@ubc.ca'
        email = user_data.get('email', '')
        given_name = user_data.get('givenName', '')
        family_name = user_data.get('familyName', '')
        is_active = user_data.get('isActiveEmployee', False)
        is_terminated = user_data.get('isTerminatedEmployee', False)
        
        # Handle emails array - take first email if available
        emails_list = user_data.get('emails', [])
        if emails_list and not email:
            email = emails_list[0]
        
        # Update user record
        update_query = """
        UPDATE users SET 
            cwl_username = %s,
            email = %s,
            first_name = %s,
            last_name = %s,
            active = %s,
            terminated = %s
        WHERE user_id = %s
        """
        
        cursor.execute(update_query, (
            cwl,
            email,
            given_name,
            family_name,
            is_active,
            is_terminated,
            user_id
        ))
        
        return {'success': True}
        
    except Exception as e:
        return {'success': False, 'error': str(e)}

def processAcademicAppointments(user_data, user_id, user_info):
    """
    Process academic appointments data into affiliations format
    Logic:
    - If 2+ appointments: put higher roster % in primary, others in joint
    - If 50-50 split: put the one matching user's primary department in primary
    """
    appointments = user_data.get('academicAppointments', [])
    
    # Initialize affiliations structure
    affiliations_data = {
        'user_id': user_id,
        'first_name': user_info['first_name'],
        'last_name': user_info['last_name'],
        'primary_unit': [],
        'joint_units': [],
        'research_affiliations': [],
        'hospital_affiliations': []
    }
    
    if not appointments:
        return affiliations_data
    
    # Convert appointments to unit data with roster percentages
    unit_appointments = []
    for appointment in appointments:
        unit_data = {
            'unit': appointment.get('department', {}).get('description', 'Obstetrics & Gynaecology'),
            'department_code': appointment.get('department', {}).get('code', ''),
            'rank': appointment.get('rank', ''),
            'title': appointment.get('rank', ''),  # Using rank as title
            'apt_percent': str(appointment.get('rosterPercentage', 100)),
            'roster_percentage': appointment.get('rosterPercentage', 100),
            'location': '',  # Not provided in JSON
            'type': appointment.get('trackType', ''),
            'additional_info': {
                'division': '',  # Not provided in JSON
                'program': '',   # Not provided in JSON
                'start': appointment.get('startDate', ''),
                'end': appointment.get('endDate', '')
            }
        }
        unit_appointments.append(unit_data)
    
    # Sort appointments by roster percentage (descending)
    unit_appointments.sort(key=lambda x: x['roster_percentage'], reverse=True)
    
    if len(unit_appointments) == 1:
        # Single appointment goes to primary
        affiliations_data['primary_unit'].append(unit_appointments[0])
    else:
        # Multiple appointments - apply logic
        highest_percentage = unit_appointments[0]['roster_percentage']
        
        # Find all appointments with the highest percentage
        highest_appointments = [apt for apt in unit_appointments if apt['roster_percentage'] == highest_percentage]
        
        if len(highest_appointments) == 1:
            # Clear winner by percentage
            primary_appointment = highest_appointments[0]
            joint_appointments = [apt for apt in unit_appointments if apt['roster_percentage'] != highest_percentage]
        else:
            # Tie in percentage - check if it's 50-50 and use department matching
            if highest_percentage == 50 and len(highest_appointments) == 2:
                # 50-50 split - check department matching
                user_primary_dept = user_info.get('primary_department', '').lower()
                primary_appointment = None
                
                for apt in highest_appointments:
                    dept_code = apt['department_code'].lower()
                    dept_desc = apt['unit'].lower()
                    
                    # Check if department matches (by code or description)
                    if (user_primary_dept and 
                        (dept_code in user_primary_dept or user_primary_dept in dept_code or
                         user_primary_dept in dept_desc or 'obstet' in user_primary_dept and 'obstet' in dept_desc)):
                        primary_appointment = apt
                        break
                
                if primary_appointment:
                    joint_appointments = [apt for apt in unit_appointments if apt != primary_appointment]
                else:
                    # No department match, use first one as primary
                    primary_appointment = highest_appointments[0]
                    joint_appointments = unit_appointments[1:]
            else:
                # Other tie scenarios - use first highest as primary
                primary_appointment = highest_appointments[0]
                joint_appointments = unit_appointments[1:]
        
        # Remove department_code and roster_percentage from the final data (internal use only)
        def clean_unit_data(unit):
            cleaned = unit.copy()
            cleaned.pop('department_code', None)
            cleaned.pop('roster_percentage', None)
            return cleaned
        
        # Add to affiliations
        affiliations_data['primary_unit'].append(clean_unit_data(primary_appointment))
        affiliations_data['joint_units'].extend([clean_unit_data(apt) for apt in joint_appointments])
    
    return affiliations_data

def getUserMapping(cursor, employee_ids):
    """
    Get user_id mapping from users table based on employee_id
    Returns a dictionary mapping employee_id to user_id with primary department info
    """
    if not employee_ids:
        return {}
    
    # Create placeholders for the IN clause
    placeholders = ','.join(['%s'] * len(employee_ids))
    query = f"""
        SELECT employee_id, user_id, first_name, last_name, primary_department 
        FROM users 
        WHERE employee_id IN ({placeholders})
    """
    
    cursor.execute(query, employee_ids)
    results = cursor.fetchall()
    
    # Create mapping dictionary
    user_mapping = {}
    for row in results:
        employee_id, user_id, first_name, last_name, primary_department = row
        user_mapping[str(employee_id)] = {
            'user_id': user_id,
            'first_name': first_name,
            'last_name': last_name,
            'primary_department': primary_department or ''
        }
    
    return user_mapping

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
    Loads data from file bytes based on file extension (.csv, .xlsx, or .json).
    """
    if file_key.lower().endswith('.json'):
        # For JSON, decode bytes to text and parse
        json_str = file_bytes.decode('utf-8')
        return json.loads(json_str)
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
    Processes affiliations upload file (CSV, Excel, or JSON) uploaded to S3
    For JSON: processes user data and academic appointments
    For CSV/Excel: uses legacy DataFrame processing
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

        # Connect to database
        connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
        cursor = connection.cursor()
        print("Connected to database")

        # Check if it's a JSON file
        if file_key.lower().endswith('.json'):
            return handle_json_file(file_bytes, file_key, connection, cursor, bucket_name)

    except Exception as e:
        print(f"Error processing affiliations import: {str(e)}")
        return {
            'statusCode': 500,
            'status': 'FAILED',
            'error': str(e)
        }

def handle_json_file(file_bytes, file_key, connection, cursor, bucket_name):
    """
    Handle JSON file processing for user data and academic appointments
    """
    try:
        # Load JSON data
        user_data_list = loadData(file_bytes, file_key)
        print(f"Loaded JSON data for {len(user_data_list)} users")

        # Process user data and get affiliations
        updated_users, affiliations_data, errors = processUserData(user_data_list, connection, cursor)
        print(f"Updated {updated_users} users")

        # Store affiliations data in database
        rows_processed = 0
        rows_added_to_db = 0

        if affiliations_data:
            rows_processed, rows_added_to_db = storeData(
                affiliations_data, connection, cursor, errors, rows_processed, rows_added_to_db
            )
            print("Affiliations data stored successfully.")
        
        cursor.close()
        connection.close()

        # Clean up - delete the processed file
        s3_client.delete_object(Bucket=bucket_name, Key=file_key)
        print(f"Processed file {file_key}, and deleted from bucket {bucket_name}")

        result = {
            'statusCode': 200,
            'status': 'COMPLETED',
            'total_users_in_json': len(user_data_list),
            'users_updated': updated_users,
            'affiliations_processed': rows_processed,
            'affiliations_added_to_database': rows_added_to_db,
            'errors': errors[:20] if errors else [],  # Limit errors to first 20
            'summary': {
                'primary_units': sum(len(data['primary_unit']) for data in affiliations_data.values()),
                'joint_units': sum(len(data['joint_units']) for data in affiliations_data.values())
            }
        }

        print(f"JSON affiliations import completed: {result}")
        return result

    except Exception as e:
        cursor.close()
        connection.close()
        raise e
