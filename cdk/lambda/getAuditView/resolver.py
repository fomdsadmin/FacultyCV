import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def getAuditView(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()

    cursor.execute(
        'SELECT * FROM audit_view WHERE logged_user_id = %s',
        (arguments['logged_user_id'],)
    )

    results = cursor.fetchall()
    cursor.close()
    connection.close()

    if len(results) == 0:
        return []

    audit_view_records = []
    for result in results:
        audit_view_records.append({
            'log_view_id': result[0],
            'ts': str(result[1]),
            'logged_user_id': result[2],
            'logged_user_first_name': result[3],
            'logged_user_last_name': result[4],
            'ip': result[5],
            'browser_name': result[6],
            'browser_version': result[7],
            'page': result[8],
            'session_id': result[9],
            'assistant': result[10],
            'profile_record': result[11],
            'role': result[12]
        })  
    return audit_view_records

def lambda_handler(event, context):
    return getAuditView(event['arguments'])
    
