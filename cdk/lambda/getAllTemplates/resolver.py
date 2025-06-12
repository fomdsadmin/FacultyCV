import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def getAllTemplates(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    cursor.execute('SELECT template_id, title, template_structure, start_year, end_year FROM templates')
    results = cursor.fetchall()
    cursor.close()
    connection.close()
    templates = []
    for result in results:
        print(f"Raw from DB: {repr(result[2])}")  # This will show quotes if it's double-encoded
        print(f"Type from DB: {type(result[2])}")
        
        # Parse the JSON string from the database
        try:
            template_structure = json.loads(result[2]) if isinstance(result[2], str) else result[2]
        except json.JSONDecodeError:
            print(f"Error parsing JSON for template_id {result[0]}")
            template_structure = result[2]  # fallback to original value
        
        templates.append({
            'template_id': result[0],
            'title': result[1],
            'template_structure': json.loads(result[2]),
            'start_year': result[3],
            'end_year': result[4]
        })
    return templates

def lambda_handler(event, context):
    return getAllTemplates(event['arguments'])