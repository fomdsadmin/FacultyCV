import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def updateUserActiveStatus(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    
    user_ids = arguments.get('user_ids')
    active = arguments.get('active')
    
    if user_ids is None or active is None:
        raise ValueError("user_ids and active status are required")
    
    # Ensure user_ids is a list
    if not isinstance(user_ids, list):
        user_ids = [user_ids]
    
    if not user_ids:
        raise ValueError("At least one user_id is required")
    
    try:
        updated_count = 0
        
        # Update the active status for each user in the array
        for user_id in user_ids:
            cursor.execute(
                'UPDATE users SET active = %s WHERE user_id = %s',
                (active, user_id)
            )
            updated_count += cursor.rowcount
        
        # Check if any updates were successful
        if updated_count == 0:
            raise ValueError(f"No users found with the provided user_ids: {user_ids}")
        
        connection.commit()
        cursor.close()
        connection.close() 
        return f'SUCCESS - Updated {updated_count} user(s)'
    except Exception as e:
        connection.rollback()
        cursor.close()
        connection.close()
        raise e

def lambda_handler(event, context):
    try:
        result = updateUserActiveStatus(event['arguments'])
        return result
    except Exception as e:
        return str(e)
