import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ.get('DB_PROXY_ENDPOINT')

def getDepartmentAffiliations(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    
    department = arguments.get('department', '')
    
    # If department is "All", get all affiliations, otherwise filter by department
    if department == "All":
        cursor.execute('''
            SELECT a.user_id, a.first_name, a.last_name, a.primary_unit, a.joint_units
            FROM affiliations a
            INNER JOIN users u ON a.user_id = u.user_id
        ''')
    else:
        cursor.execute('''
            SELECT a.user_id, a.first_name, a.last_name, a.primary_unit, a.joint_units
            FROM affiliations a
            INNER JOIN users u ON a.user_id = u.user_id
            WHERE u.primary_department = %s
            AND u.role = 'Faculty'
        ''', (department,))

    results = cursor.fetchall()
    
    # Close connection
    cursor.close()
    connection.close()
    
    # Format the results
    affiliations_list = []
    for row in results:
        user_id, first_name, last_name, primary_unit, joint_units = row
        
        # Parse JSON fields, handle None values
        try:
            primary_unit_data = json.loads(primary_unit) if primary_unit else {}
        except (json.JSONDecodeError, TypeError):
            primary_unit_data = {}
        
        try:
            joint_units_data = json.loads(joint_units) if joint_units else []
        except (json.JSONDecodeError, TypeError):
            joint_units_data = []
        
        affiliations_list.append({
            "user_id": user_id,
            "first_name": first_name,
            "last_name": last_name,
            "primary_unit": json.dumps(primary_unit_data),
            "joint_units": json.dumps(joint_units_data)
        })
    
    return affiliations_list

def lambda_handler(event, context):
    return getDepartmentAffiliations(event['arguments'])
