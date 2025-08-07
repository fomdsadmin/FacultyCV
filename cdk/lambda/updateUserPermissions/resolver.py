import boto3
import json
import psycopg2
from datetime import datetime
import time
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
dynamodb = boto3.client('dynamodb')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def updateUserPermissions(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to database")
    cursor = connection.cursor()

    query = """
    UPDATE users SET 
        pending = %s, 
        approved = %s
    WHERE user_id = %s
    """

    # Execute the query with the provided arguments
    cursor.execute(query, (
        arguments['pending'] if 'pending' in arguments else False,
        arguments['approved'] if 'approved' in arguments else False,
        arguments['user_id']
    ))

    # Check if any rows were affected
    rows_affected = cursor.rowcount
    if rows_affected == 0:
        return "User not found"

    cursor.close()
    connection.commit()
    connection.close()
    return "User permissions updated successfully"

def lambda_handler(event, context):
    return updateUserPermissions(event['arguments'])