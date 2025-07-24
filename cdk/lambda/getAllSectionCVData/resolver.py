import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ.get('DB_PROXY_ENDPOINT')

def getAllSectionCVData(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    if ('data_section_id_list' not in arguments):
        cursor.execute(
            'SELECT data_section_id, data_details FROM user_cv_data WHERE data_section_id = %s AND archive != true LIMIT 100',
            (arguments['data_section_id'],)
        )
    else:
        cursor.execute(
            'SELECT data_section_id, data_details FROM user_cv_data WHERE data_section_id IN %s AND archive != true LIMIT 100',
            (tuple(arguments['data_section_id_list']),)
        )
    results = cursor.fetchall()
    cursor.close()
    connection.close()

    user_cv_data = []
    if len(results) == 0:
        return []
    
    for result in results:
        user_cv_data.append({
            'data_section_id': result[0],
            'data_details': result[1],
        })

    return user_cv_data

def lambda_handler(event, context):
    return getAllSectionCVData(event['arguments'])