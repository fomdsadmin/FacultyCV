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

def changeUsername(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to database")
    cursor = connection.cursor()

    # Prepare the UPDATE query
    query = """
    UPDATE users SET 
        user_name = %s, 
    WHERE user_id = %s
    """

    # Execute the query with the provided arguments
    cursor.execute(query, (
        arguments['username'],
        arguments['user_id']
    ))

    print("Updated user logs")
    cursor.close()
    connection.commit()
    connection.close()
    return "User updated successfully"

def lambda_handler(event, context):
    return changeUsername(event['arguments'])
