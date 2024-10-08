import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def addTemplate(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    cursor.execute("INSERT INTO templates (title, data_section_ids, start_year, end_year) VALUES (%s, %s, %s, %s)", (arguments['title'], arguments['data_section_ids'], arguments['start_year'], arguments['end_year'],))
    cursor.close()
    connection.commit()
    connection.close()
    return "SUCCESS"

def lambda_handler(event, context):
    return addTemplate(event['arguments'])