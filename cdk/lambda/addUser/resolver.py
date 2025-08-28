import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def addUser(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to database")
    cursor = connection.cursor()

    # Prepare the INSERT query
    query = """
    INSERT INTO users (
        first_name, 
        last_name, 
        email, 
        role,
        pending,
        approved,
        cwl_username,
        vpp_username
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """

    # Execute the query with the provided arguments
    cursor.execute(query, (
        arguments['first_name'],
        arguments['last_name'],
        arguments['email'],
        arguments['role'],
        arguments['pending'] if 'pending' in arguments else True,
        arguments['approved'] if 'approved' in arguments else False,
        arguments['cwl_username'],
        arguments['vpp_username']
    ))

    cursor.close()
    connection.commit()
    connection.close()
    return "User added successfully"

def lambda_handler(event, context):
    return addUser(event['arguments'])