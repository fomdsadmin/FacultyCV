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
    Matches users by name from APT department and updates their info
    """
    updated_users = 0
    affiliations_data = {}
    errors = []
    matched_users = 0
    
    # Get existing users from database for APT department
    apt_users = getAPTUsers(cursor)
    print(f"Found {len(apt_users)} existing APT users in database")
    
    # Filter existing users from the json users list before processing
    filtered_user_list = []
    existing_users_skipped = 0
    
    for json_user in user_data_list:
        given_name = json_user.get('givenName', '').strip().lower()
        family_name = json_user.get('familyName', '').strip().lower()
        employee_id = str(json_user.get('employeeId', ''))
        cwl = json_user.get('cwl', '')
        
        # Check if user already exists by name, employee_id, or cwl
        user_exists = False
        for db_user in apt_users:
            db_given = db_user['first_name'].strip().lower() if db_user['first_name'] else ''
            db_family = db_user['last_name'].strip().lower() if db_user['last_name'] else ''
            db_employee_id = str(db_user['employee_id']) if db_user['employee_id'] else ''
            db_cwl = db_user['cwl_username'] or ''
            
            # Match by name, employee_id, or cwl
            if ((given_name and family_name and given_name == db_given and family_name == db_family) or
                (employee_id and employee_id == db_employee_id) or
                (cwl and cwl == db_cwl)):
                user_exists = True
                existing_users_skipped += 1
                break
        
        if not user_exists:
            filtered_user_list.append(json_user)
    
    print(f"Filtered out {existing_users_skipped} existing users, processing {len(filtered_user_list)} new users")
    
    for json_user in filtered_user_list:
        try:
            given_name = json_user.get('givenName', '').strip().lower()
            family_name = json_user.get('familyName', '').strip().lower()
            
            if not given_name or not family_name:
                errors.append(f"Missing name data for user: {json_user.get('employeeId', 'unknown')}")
                continue
            
            # Insert users and update user information (cwl_username and employee_id)
            update_result = insertUsers(json_user, cursor)
            if update_result['success']:
                updated_users += 1
                
                # Get the user_id for the newly inserted/updated user
                employee_id = str(json_user.get('employeeId', ''))
                cwl = json_user.get('cwl', '')
                if cwl and not cwl.endswith('@ubc.ca'):
                    cwl = cwl + '@ubc.ca'
                
                # Find the user in the database to get user_id
                user_query = """
                SELECT user_id, first_name, last_name, primary_department 
                FROM users 
                WHERE (employee_id = %s OR cwl_username = %s)
                AND (first_name ILIKE %s AND last_name ILIKE %s)
                """
                cursor.execute(user_query, (employee_id, cwl, given_name, family_name))
                user_result = cursor.fetchone()
                
                if user_result:
                    user_id, first_name, last_name, primary_department = user_result
                    matched_user = {
                        'user_id': user_id,
                        'first_name': first_name,
                        'last_name': last_name,
                        'primary_department': primary_department
                    }
                    matched_users += 1
                    
                    # Process academic appointments for affiliations
                    if 'academicAppointments' in json_user and json_user['academicAppointments']:
                        affiliations_result = processAcademicAppointments(
                            json_user, user_id, matched_user
                        )
                        affiliations_data[user_id] = affiliations_result
                else:
                    errors.append(f"Could not retrieve user_id for {given_name} {family_name} after insert/update")
            else:
                errors.append(f"Failed to update user {given_name} {family_name}: {update_result['error']}")
       
        except Exception as e:
            errors.append(f"Error processing user {json_user.get('givenName', '')} {json_user.get('familyName', '')}: {str(e)}")
            
    connection.commit()
    print(f"Matched {matched_users} users from JSON with database")
    print(f"Skipped {existing_users_skipped} existing users during filtering")
    return updated_users, affiliations_data, errors

def insertUsers(user_data, cursor):
    """
    Insert new user information in the users table - cwl_username, employee_id, active, terminated, and email
    Note: Only new users are processed as existing users are filtered out before calling this function
    """
    try:
        # Extract relevant fields from JSON
        cwl = user_data.get('cwl', '')
        if cwl and not cwl.endswith('@ubc.ca'):
            cwl = cwl + '@ubc.ca'
        
        employee_id = str(user_data.get('employeeId', ''))
        
        # Handle active and terminated status
        is_active = user_data.get('isActiveEmployee', True)
        is_terminated = user_data.get('isTerminatedEmployee', False)
        first_name = user_data.get('givenName', '')
        last_name = user_data.get('familyName', '')
        
        # Handle email - priority: emails array first entry > single email > empty
        email = ''
        emails_list = user_data.get('emails', [])
        if emails_list and len(emails_list) > 0:
            # Use first entry from emails array
            email = emails_list[0]
        elif 'email' in user_data and user_data.get('email'):
            # Use single email attribute if present
            email = user_data.get('email', '')
        
        # Insert new user record (we already filtered out existing users)
        insert_query = """
        INSERT INTO users (first_name, last_name, cwl_username, employee_id, active, terminated, email, primary_department, primary_faculty, role ) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, 'Anesthesiology, Pharmacology & Therapeutics', 'Faculty of Medicine', 'Faculty')
        """
        
        cursor.execute(insert_query, (
            first_name,
            last_name,
            cwl,
            employee_id,
            is_active,
            is_terminated,
            email
        ))
        
        return {'success': True}
        
    except Exception as e:
        return {'success': False, 'error': str(e)}

def processAcademicAppointments(user_data, user_id, user_info):
    """
    Process academic appointments data into affiliations format for APT department
    Logic:
    - If 2+ appointments: put higher roster % in primary, others in joint
    - If 50-50 split: put the one matching user's primary department in primary
    - If all roster % are 100: check end dates and only add the latest one
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
        # Default to APT department if not specified
        dept_description = appointment.get('department', {}).get('description', 'Department of Anesthesiology, Pharmacology, and Therapeutics')
        dept_code = appointment.get('department', {}).get('code', 'ANAE')
        
        unit_data = {
            'unit': dept_description,
            'department_code': dept_code,
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
    
    # Check if all roster percentages are 100
    all_roster_100 = all(apt['roster_percentage'] == 100 for apt in unit_appointments)
    
    if all_roster_100 and len(unit_appointments) > 1:
        # Filter to keep only the latest appointment based on end date
        from datetime import datetime
        
        def parse_date(date_str):
            """Parse date string and return datetime object, return min date if parsing fails"""
            if not date_str:
                return datetime.min
            try:
                return datetime.strptime(date_str, '%Y-%m-%d')
            except:
                # Try other date formats if needed
                try:
                    return datetime.strptime(date_str, '%Y/%m/%d')
                except:
                    return datetime.min
        
        # Sort by end date (latest first), considering None as current (max date)
        def get_sort_date(appointment):
            end_date = appointment['additional_info']['end']
            if not end_date or end_date == 'null' or end_date is None:
                return datetime.max  # Current appointments (no end date) are considered latest
            return parse_date(end_date)
        
        unit_appointments.sort(key=get_sort_date, reverse=True)
        # Keep only the latest one
        unit_appointments = [unit_appointments[0]]
    else:
        # Sort appointments by roster percentage (descending) for normal processing
        unit_appointments.sort(key=lambda x: x['roster_percentage'], reverse=True)
    
    if len(unit_appointments) == 1:
        # Single appointment goes to primary
        def clean_unit_data(unit):
            cleaned = unit.copy()
            cleaned.pop('department_code', None)
            cleaned.pop('roster_percentage', None)
            return cleaned
        
        affiliations_data['primary_unit'].append(clean_unit_data(unit_appointments[0]))
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
                         user_primary_dept in dept_desc or 'anest' in user_primary_dept and 'anest' in dept_desc)):
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
        
        # Clean unit data helper function
        def clean_unit_data(unit):
            cleaned = unit.copy()
            cleaned.pop('department_code', None)
            cleaned.pop('roster_percentage', None)
            return cleaned
        
        # Add to affiliations
        affiliations_data['primary_unit'].append(clean_unit_data(primary_appointment))
        affiliations_data['joint_units'].extend([clean_unit_data(apt) for apt in joint_appointments])
    
    return affiliations_data

def getAPTUsers(cursor):
    """
    Get all users from the database where primary_department is 'Anesthesiology, Pharmacology & Therapeutics'
    Returns a list of user dictionaries with user_id, first_name, last_name, and primary_department
    """
    query = """
        SELECT user_id, first_name, last_name, primary_department, employee_id, cwl_username
        FROM users 
        WHERE primary_department = %s
    """
    
    cursor.execute(query, ('Anesthesiology, Pharmacology & Therapeutics',))
    results = cursor.fetchall()
    
    # Create list of user dictionaries
    apt_users = []
    for row in results:
        user_id, first_name, last_name, primary_department, employee_id, cwl_username = row
        apt_users.append({
            'user_id': user_id,
            'first_name': first_name or '',
            'last_name': last_name or '',
            'primary_department': primary_department or '',
            'employee_id': employee_id,
            'cwl_username': cwl_username
        })
    
    return apt_users

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
    Processes APT department affiliations upload file (JSON format) uploaded to S3
    Matches users by name from 'Anesthesiology, Pharmacology & Therapeutics' department
    and updates their cwl_username, employee_id, and affiliations data
    """
    try:
        # Parse S3 event
        s3_event = event["Records"][0]["s3"]
        bucket_name = s3_event["bucket"]["name"]
        file_key = s3_event["object"]["key"]

        print(f"Processing APT affiliations file: {file_key} from bucket: {bucket_name}")

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
        else:
            raise ValueError('Only JSON files are supported for APT import')

    except Exception as e:
        print(f"Error processing APT affiliations import: {str(e)}")
        return {
            'statusCode': 500,
            'status': 'FAILED',
            'error': str(e)
        }

def handle_json_file(file_bytes, file_key, connection, cursor, bucket_name):
    """
    Handle JSON file processing for APT department user data and academic appointments
    Matches users by name and updates cwl_username, employee_id, and affiliations
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
                'joint_units': sum(len(data['joint_units']) for data in affiliations_data.values()),
                'matched_users': len([e for e in errors if 'No database match found' not in e])
            }
        }

        print(f"APT affiliations import completed: {result}")
        return result

    except Exception as e:
        cursor.close()
        connection.close()
        raise e
