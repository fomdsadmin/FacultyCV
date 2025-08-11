import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def getAllUsersCount(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    
    # Update query to select all columns from the 'users' table
    cursor.execute('SELECT COUNT(*) FROM users')
    results = cursor.fetchall()
    cursor.close()
    connection.close()

    print("Users count: ", results)
    return results[0][0] if results else 0

def lambda_handler(event, context):
    return getAllUsersCount(event['arguments'])
