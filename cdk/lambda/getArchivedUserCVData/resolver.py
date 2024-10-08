import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ.get('DB_PROXY_ENDPOINT')

def getArchivedUserCVData(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    cursor.execute('SELECT user_cv_data_id, user_id, data_section_id, data_details, archive, archive_timestamp, editable FROM user_cv_data WHERE user_id = %s AND archive = true', (arguments['user_id'],))
    results = cursor.fetchall()
    cursor.close()
    connection.close()
    archived_user_cv_data = []
    if len(results) == 0:
        return {}
    for result in results:
        archived_user_cv_data.append({
            'user_cv_data_id': result[0],
            'user_id': result[1],
            'data_section_id': result[2],
            'data_details': result[3],
            'archive': result[4],
            'archive_timestamp': result[5].isoformat() if result[5] else None,
            'editable': result[6]
        })
    return archived_user_cv_data

def lambda_handler(event, context):
    return getArchivedUserCVData(event['arguments'])
