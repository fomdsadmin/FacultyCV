import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ.get('DB_PROXY_ENDPOINT')

def getUserAffiliations(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    cursor.execute('SELECT * FROM affiliations WHERE user_id = %s AND first_name = %s AND last_name = %s', (arguments['user_id'], arguments['first_name'], arguments['last_name']))
    results = cursor.fetchall()
    cursor.close()
    connection.close()

    if len(results) == 0:
        return []
    return results

def lambda_handler(event, context):
    return getUserAffiliations(event['arguments'])