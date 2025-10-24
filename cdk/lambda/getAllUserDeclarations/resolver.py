import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def getAllUserDeclarations(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    
    # Get the department argument
    department = arguments.get('department', 'All')
    
    if department == 'All':
        # If department is 'All', get all declarations
        cursor.execute(
            'SELECT reporting_year, other_data, created_by, created_on, user_id FROM declarations'
        )
    else:
        # Join with users table to filter by primary_department
        cursor.execute(
            '''SELECT d.reporting_year, d.other_data, d.created_by, d.created_on, d.user_id 
               FROM declarations d 
               INNER JOIN users u ON d.user_id = u.user_id 
               WHERE u.primary_department = %s''',
            (department,)
        )
    
    results = cursor.fetchall()
    cursor.close()
    connection.close()
    
    if len(results) == 0:
        return []
    
    matches = []
    for result in results:
        reporting_year = result[0]
        other_data = result[1]  # JSONB field
        created_by = result[2]
        created_on = result[3]
        user_id = result[4]
        match = {
            'reporting_year': reporting_year,
            'other_data': other_data,
            'created_by': created_by,
            'created_on': created_on.strftime("%Y-%m-%d %H:%M:%S.%f"),
            'user_id': user_id
        }
        matches.append(match)

    return matches

def lambda_handler(event, context):
    return getAllUserDeclarations(event['arguments'])