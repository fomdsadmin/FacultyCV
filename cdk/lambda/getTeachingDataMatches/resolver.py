import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def getTeachingDataMatches(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    cursor.execute('SELECT * FROM teaching_data WHERE institution_user_id = %s', (arguments['institution_user_id'],))
    results = cursor.fetchall()
    cursor.close()
    connection.close()
    matches = []
    if len(results) == 0:
        return []
    for result in results:
        matches.append({
            'teaching_data_id': result[0],
            'institution_user_id': result[11],
            'data_details': {
                'year': result[1],
                'session': result[2],
                'course': result[3],
                'description': result[4],
                'scheduled_hours': result[5],
                'class_size': result[6],
                'lectures': result[7],
                'tutorials': result[8],
                'labs': result[9],
                'other': result[10]
            }
        })
    return matches

def lambda_handler(event, context):
    return getTeachingDataMatches(event['arguments'])