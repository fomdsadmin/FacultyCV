import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def getUserDeclarations(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    cursor.execute(
        'SELECT reporting_year, other_data, created_by, created_on FROM declarations WHERE user_id = %s',
        (arguments['user_id'],)
    )
    results = cursor.fetchall()
    cursor.close()
    connection.close()
    if len(results) == 0:
        return []
    matches = []
    for result in results:
        year = result[0]
        other_data = result[1]  # JSONB field
        created_by = result[2]
        created_on = result[3]
        match = {
            'reporting_year': year,
            'other_data': other_data,
            'created_by':created_by,
            'created_on': created_on.strftime("%Y-%m-%d %H:%M:%S.%f")
        }
        matches.append(match)

    return matches

def lambda_handler(event, context):
    return getUserDeclarations(event['arguments'])