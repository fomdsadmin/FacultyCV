import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def getAllSections(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    cursor.execute('SELECT data_section_id, title, description, data_type, attributes, archive FROM data_sections WHERE archive != true')
    results = cursor.fetchall()
    cursor.close()
    connection.close()
    data_sections = []
    for result in results:
        data_sections.append({
            'data_section_id': result[0],
            'title': result[1],
            'description': result[2],
            'data_type': result[3],
            'attributes': result[4],
            'archive': result[5]
        })
    return data_sections

def lambda_handler(event, context):
    return getAllSections(event['arguments'])