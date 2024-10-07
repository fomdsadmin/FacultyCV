import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ.get('DB_PROXY_ENDPOINT')

def updateUniversityInfo(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to database")
    cursor = connection.cursor()

    # Prepare the UPDATE query
    query = """
    UPDATE university_info SET 
        type = %s, 
        value = %s, 
    WHERE university_info_id = %s
    """

    # Execute the query with the provided arguments
    cursor.execute(query, (
        arguments['type'] if 'type' in arguments else '',
        arguments['value'] if 'value' in arguments else '',
        arguments['university_info_id']
    ))

    cursor.close()
    connection.commit()
    connection.close()
    return "University info updated successfully"

def lambda_handler(event, context):
    return updateUniversityInfo(event['arguments'])
