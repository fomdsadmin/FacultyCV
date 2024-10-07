import boto3
import json
import psycopg2
import os
from datetime import datetime
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def updateSection(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    attributes_json = json.dumps(arguments['attributes'])  # Convert attributes dictionary to JSON string
    cursor.execute("UPDATE data_sections SET archive = %s, attributes = %s WHERE data_section_id = %s", (arguments['archive'], attributes_json, arguments['data_section_id']))
    cursor.close()
    connection.commit()
    connection.close()
    return "SUCCESS"

def lambda_handler(event, context):
    arguments = event['arguments']
    return updateSection(arguments=arguments)