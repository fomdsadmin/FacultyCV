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
    
    # First, get the total count
    if ('data_section_id_list' not in arguments):
        cursor.execute(
            'SELECT COUNT(*) FROM user_cv_data WHERE data_section_id = %s AND archive != true',
            (arguments['data_section_id'],)
        )
    else:
        cursor.execute(
            'SELECT COUNT(*) FROM user_cv_data WHERE data_section_id IN %s AND archive != true',
            (tuple(arguments['data_section_id_list']),)
        )
    total_count = cursor.fetchone()[0]
    
    # Then get the limited data (max 1000 rows)
    if ('data_section_id_list' not in arguments):
        cursor.execute(
            'SELECT data_section_id, data_details, user_id FROM user_cv_data WHERE data_section_id = %s AND archive != true LIMIT 1000',
            (arguments['data_section_id'],)
        )
    else:
        cursor.execute(
            'SELECT data_section_id, data_detail, user_id FROM user_cv_data WHERE data_section_id IN %s AND archive != true LIMIT 1000',
            (tuple(arguments['data_section_id_list']),)
        )
    results = cursor.fetchall()
    cursor.close()
    connection.close()

    user_cv_data = []
    for result in results:
        user_cv_data.append({
            'data_section_id': result[0],
            'data_details': result[1],
            'user_id': result[2]
        })

    return {
        'data': user_cv_data,
        'total_count': total_count,
        'returned_count': len(user_cv_data)
    }

def lambda_handler(event, context):
    return getAllSectionCVData(event['arguments'])