import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def addSection(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    attributes_json = json.dumps(arguments['attributes'])  # Convert attributes dictionary to JSON string
    cursor.execute("INSERT INTO data_sections (title, description, data_type, attributes) VALUES (%s, %s, %s, %s)", (arguments['title'], arguments['description'], arguments['data_type'], attributes_json))
    cursor.close()
    connection.commit()
    connection.close()
    return "SUCCESS"

def lambda_handler(event, context):
    return addSection(event['arguments'])