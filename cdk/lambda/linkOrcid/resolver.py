import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ.get('DB_PROXY_ENDPOINT')

def linkOrcid(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to database")
    cursor = connection.cursor()

    # Prepare the UPDATE query
    query = "UPDATE users SET orcid_id = %s WHERE user_id = %s"

    # Execute the query with the provided arguments
    values = (arguments['orcid_id'], arguments['user_id'])
    cursor.execute(query, values)

    cursor.close()
    connection.commit()
    connection.close()
    return "Orcid ID linked successfully"

def lambda_handler(event, context):
    return linkOrcid(event['arguments'])