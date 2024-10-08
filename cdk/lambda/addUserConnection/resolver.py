import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def addUserConnection(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    
    # Check for existing connection
    cursor.execute("SELECT COUNT(*) FROM user_connections WHERE faculty_user_id = %s AND assistant_user_id = %s", (arguments['faculty_user_id'], arguments['assistant_user_id']))
    existing_connection = cursor.fetchone()[0]

    if existing_connection > 0:
        cursor.close()
        connection.close()
        return "connection already exists"

    # Proceed with the insertion if no existing connection is found
    cursor.execute("INSERT INTO user_connections (faculty_user_id, faculty_first_name, faculty_last_name, faculty_email, assistant_user_id, assistant_first_name, assistant_last_name, assistant_email, status) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)", 
                   (arguments['faculty_user_id'], arguments['faculty_first_name'], arguments['faculty_last_name'], arguments['faculty_email'], 
                    arguments['assistant_user_id'], arguments['assistant_first_name'], arguments['assistant_last_name'], arguments['assistant_email'], 
                    arguments['status']))
    
    cursor.close()
    connection.commit()
    connection.close()
    return "SUCCESS"

def lambda_handler(event, context):
    arguments = event['arguments']
    return addUserConnection(arguments=arguments)
