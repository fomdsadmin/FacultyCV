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
    
    user_id = arguments.get('user_id')
    active = arguments.get('active')
    
    if user_id is None or active is None:
        raise ValueError("user_id and active status are required")
    
    try:
        # Update the active status for the specified user
        cursor.execute(
            'UPDATE users SET active = %s WHERE user_id = %s',
            (active, user_id)
        )
        
        # Check if the update was successful
        if cursor.rowcount == 0:
            raise ValueError(f"User with user_id {user_id} not found")
        
        connection.commit()
        cursor.close()
        connection.close() 
        return 'SUCCESS'
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
