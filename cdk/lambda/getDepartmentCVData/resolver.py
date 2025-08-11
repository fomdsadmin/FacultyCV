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
    
    section_title_lower = section_title.lower() if section_title else ''
    
    if 'publication' in section_title_lower:
        # Return specific fields for publications
        return {
            'end_date': data_details.get('end_date'),
        }
    elif 'patent' in section_title_lower:
        # Return specific fields for patents
        return {
            'year': data_details.get('year'),
        }
    elif 'grant' in section_title_lower:
        # Return specific fields for grants
        return {
            'dates': data_details.get('dates'),
            'amount': data_details.get('amount'),
        }
    else:
        # Return all data for other sections
        return data_details

def getDepartmentCVData(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    
    data_section_id = arguments.get('data_section_id')
    dept = arguments.get('dept')
    section_title = arguments.get('section_title')
    
    if not data_section_id:
        raise ValueError("data_section_id is required")
    
    if dept == 'All':
        # Query all data for the given section_id
        cursor.execute(
            'SELECT COUNT(*) FROM user_cv_data WHERE data_section_id = %s AND archive != true',
            (data_section_id,)
        )
        total_count = cursor.fetchone()[0]
        
        cursor.execute(
            'SELECT data_section_id, data_details FROM user_cv_data WHERE data_section_id = %s AND archive != true LIMIT 2000',
            (data_section_id,)
        )
    else:
        # First get user_ids from users table where primary_department matches
        cursor.execute(
            'SELECT user_id FROM users WHERE primary_department = %s',
            (dept,)
        )
        user_ids = [row[0] for row in cursor.fetchall()]
        
        if not user_ids:
            # No users found for this department
            total_count = 0
            results = []
        else:
            # Use the user_ids to get CV data
            user_ids_placeholder = ','.join(['%s'] * len(user_ids))
            
            # Get total count
            cursor.execute(
                f'SELECT COUNT(*) FROM user_cv_data WHERE data_section_id = %s AND user_id IN ({user_ids_placeholder}) AND archive != true',
                [data_section_id] + user_ids
            )
            total_count = cursor.fetchone()[0]
            
            # Get the actual data
            cursor.execute(
                f'SELECT data_section_id, data_details FROM user_cv_data WHERE data_section_id = %s AND user_id IN ({user_ids_placeholder}) AND archive != true LIMIT 2000',
                [data_section_id] + user_ids
            )
        
    results = cursor.fetchall()
    cursor.close()
    connection.close()

    user_cv_data = []
    for result in results:
        try:
            raw_data = json.loads(result[1])
            filtered_data = filter_data_by_section(raw_data, section_title)
        except (json.JSONDecodeError, TypeError):
            # If JSON parsing fails, use raw data
            filtered_data = result[1]
        
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