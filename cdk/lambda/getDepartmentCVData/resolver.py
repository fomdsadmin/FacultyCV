import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ.get('DB_PROXY_ENDPOINT')

def filter_data_by_section(data_details, section_title):
    """Filter data_details based on section title"""
    if not isinstance(data_details, dict):
        return data_details

    if 'Publication' in section_title:
        # Return specific fields for publications
        return {
            'end_date': data_details.get('end_date'),
        }
    elif 'Other' in section_title:
        # Return specific fields for publications
        return {
            'type': data_details.get('publication_type'),
            'end_date': data_details.get('end_date'),
        }
    elif 'Patent' in section_title:
        # Return specific fields for patents
        return {
            'year': data_details.get('year'),
        }
    elif 'Grant' in section_title:
        # Return specific fields for grants
        return {
            'dates': data_details.get('dates'),
            'amount': data_details.get('amount'),
            'type': data_details.get('type'),
        }
    elif 'All' in section_title:
        return data_details

def getDepartmentCVData(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    
    data_section_id = arguments.get('data_section_id')
    dept = arguments.get('dept')
    section_title = arguments.get('title')
    user_ids = arguments.get('user_ids')  # New parameter for specific user IDs
    
    if not data_section_id:
        raise ValueError("data_section_id is required")
    
    # If user_ids are provided, use them directly (highest priority)
    if user_ids and len(user_ids) > 0:
        print(f"Fetching data for specific user IDs: {user_ids}")
        user_ids_placeholder = ','.join(['%s'] * len(user_ids))
        # Get total count
        cursor.execute(
            f'SELECT COUNT(*) FROM user_cv_data WHERE data_section_id = %s AND user_id IN ({user_ids_placeholder}) AND archive != true',
            [data_section_id] + user_ids
        )
        total_count = cursor.fetchone()[0]
        
        # Get the actual data with user information
        cursor.execute(
            f'''SELECT ucd.data_section_id, ucd.data_details, u.first_name, u.last_name, ucd.user_id 
                FROM user_cv_data ucd 
                JOIN users u ON ucd.user_id = u.user_id 
                WHERE ucd.data_section_id = %s AND ucd.user_id IN ({user_ids_placeholder}) AND ucd.archive != true''',
            [data_section_id] + user_ids
        )
    # If dept is 'All' or empty string, get all data
    elif dept == 'All' or dept == '' or dept is None:
        print("Fetching data for all users")
        cursor.execute(
            'SELECT COUNT(*) FROM user_cv_data WHERE data_section_id = %s AND archive != true',
            (data_section_id,)
        )
        total_count = cursor.fetchone()[0]
        cursor.execute(
            '''SELECT ucd.data_section_id, ucd.data_details, u.first_name, u.last_name, ucd.user_id 
               FROM user_cv_data ucd 
               JOIN users u ON ucd.user_id = u.user_id 
               WHERE ucd.data_section_id = %s AND ucd.archive != true LIMIT 10000''',
            (data_section_id,)
        )
    # Otherwise, filter by department
    else:
        print(f"Fetching data for department: {dept}")
        cursor.execute(
            'SELECT user_id FROM users WHERE primary_department = %s',
            (dept,)
        )
        dept_user_ids = [row[0] for row in cursor.fetchall()]
        if not dept_user_ids:
            # No users found for this department
            total_count = 0
            results = []
        else:
            user_ids_placeholder = ','.join(['%s'] * len(dept_user_ids))
            # Get total count
            cursor.execute(
                f'SELECT COUNT(*) FROM user_cv_data WHERE data_section_id = %s AND user_id IN ({user_ids_placeholder}) AND archive != true',
                [data_section_id] + dept_user_ids
            )
            total_count = cursor.fetchone()[0]
            
            # Get the actual data with user information
            cursor.execute(
                f'''SELECT ucd.data_section_id, ucd.data_details, u.first_name, u.last_name, ucd.user_id 
                    FROM user_cv_data ucd 
                    JOIN users u ON ucd.user_id = u.user_id 
                    WHERE ucd.data_section_id = %s AND ucd.user_id IN ({user_ids_placeholder}) AND ucd.archive != true''',
                [data_section_id] + dept_user_ids
            )
        
    results = cursor.fetchall()
    cursor.close()
    connection.close()

    user_cv_data = []
    for result in results:
        try:
            # result[1] is the data_details, result[2] is first_name, result[3] is last_name, result[4] is user_id
            raw_data = result[1]
            first_name = result[2]
            last_name = result[3]
            user_id = result[4]
            
            # If it's a string, then parse it
            if isinstance(raw_data, str):
                raw_data = json.loads(raw_data)
            
            filtered_data = filter_data_by_section(raw_data, section_title)
            
            # Always add first_name and last_name to the filtered data
            if isinstance(filtered_data, dict):
                filtered_data['first_name'] = first_name
                filtered_data['last_name'] = last_name
                filtered_data['user_id'] = user_id
            else:
                # If filtered_data is not a dict, create one
                filtered_data = {
                    'original_data': filtered_data,
                    'first_name': first_name,
                    'last_name': last_name,
                    'user_id': user_id
                }
                
        except (json.JSONDecodeError, TypeError) as e:
            # If JSON parsing fails, use raw data with user info
            filtered_data = {
                'original_data': result[1],
                'first_name': result[2] if len(result) > 2 else '',
                'last_name': result[3] if len(result) > 3 else '',
                'user_id': result[4] if len(result) > 4 else '',
            }
            print(f"Error parsing data: {e}")
        
        user_cv_data.append({
            'data_section_id': result[0],
            'data_details': filtered_data,
        })

    return {
        'data': user_cv_data,
        'total_count': total_count,
        'returned_count': len(user_cv_data)
    }

def lambda_handler(event, context):
    return getDepartmentCVData(event['arguments'])