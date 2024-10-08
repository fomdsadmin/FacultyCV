import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ.get('DB_PROXY_ENDPOINT')

def getAllUniversityInfo(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    cursor.execute('SELECT university_info_id, type, value FROM university_info')
    results = cursor.fetchall()
    cursor.close()
    connection.close()
    university_info = []
    for result in results:
        university_info.append({
            'university_info_id': result[0],
            'type': result[1],
            'value': result[2],
        })
    return university_info

def lambda_handler(event, context):
    return getAllUniversityInfo(event['arguments'])