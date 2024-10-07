import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ.get('DB_PROXY_ENDPOINT')

def getUserCVData(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    if ('data_section_id_list' not in arguments):
        cursor.execute('SELECT user_cv_data_id, user_id, data_section_id, data_details, editable FROM user_cv_data WHERE user_id = %s AND data_section_id = %s AND archive != true', (arguments['user_id'], arguments['data_section_id']))
    else:
        cursor.execute('SELECT user_cv_data_id, user_id, data_section_id, data_details, editable FROM user_cv_data WHERE user_id = %s AND data_section_id IN %s AND archive != true', (arguments['user_id'], tuple(arguments['data_section_id_list'])))
    results = cursor.fetchall()
    cursor.close()
    connection.close()
    user_cv_data = []
    if len(results) == 0:
        return []
    for result in results:
        user_cv_data.append({
            'user_cv_data_id': result[0],
            'user_id': result[1],
            'data_section_id': result[2],
            'data_details': result[3],
            'editable': result[4]
        })
    return user_cv_data

def lambda_handler(event, context):
    return getUserCVData(event['arguments'])