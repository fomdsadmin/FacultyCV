import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def getUserConnections(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    
    if 'faculty_user_id' in arguments:
        cursor.execute('SELECT user_connection_id, faculty_user_id, faculty_first_name, faculty_last_name, faculty_email, assistant_user_id, assistant_first_name, assistant_last_name, assistant_email, status FROM user_connections WHERE faculty_user_id = %s', (arguments['faculty_user_id'],))
    elif 'assistant_user_id' in arguments:
        cursor.execute('SELECT user_connection_id, faculty_user_id, faculty_first_name, faculty_last_name, faculty_email, assistant_user_id, assistant_first_name, assistant_last_name, assistant_email, status FROM user_connections WHERE assistant_user_id = %s', (arguments['assistant_user_id'],))
    else:
        return []

    results = cursor.fetchall()
    cursor.close()
    connection.close()
    
    user_connections = []
    for result in results:
        user_connections.append({
        'user_connection_id': result[0],
        'faculty_user_id': result[1],
        'faculty_first_name': result[2],
        'faculty_last_name': result[3],
        'faculty_email': result[4],
        'assistant_user_id': result[5],
        'assistant_first_name': result[6],
        'assistant_last_name': result[7],
        'assistant_email': result[8],
        'status': result[9]
    })      
    return user_connections

def lambda_handler(event, context):
    return getUserConnections(event['arguments'])