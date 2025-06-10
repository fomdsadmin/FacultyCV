import boto3
import json
import psycopg2
import os
import time
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
dynamodb = boto3.client('dynamodb')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def addBatchedUserCVData(arguments):
    """
    arguments: {
        'publications': [list of data_details dicts],
        'user_id': str,
        'data_section_id': str,
        'editable': bool,
    }
    """
    publications = arguments.get('data_details_list', [])
    user_id = arguments['user_id']
    data_section_id = arguments['data_section_id']
    editable = arguments['editable']

    if not isinstance(publications, list):
        return "No publications provided"

    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()

    # 1. Delete all existing publications for this user and section
    cursor.execute(
        "DELETE FROM user_cv_data WHERE user_id = %s AND data_section_id = %s",
        (user_id, data_section_id)
    )

    inserted_count = 0
    for pub in publications:
        data_details_json = json.dumps(pub)
        cursor.execute(
            "INSERT INTO user_cv_data (user_id, data_section_id, data_details, editable) VALUES (%s, %s, %s, %s)",
            (user_id, data_section_id, data_details_json, editable)
        )
        inserted_count += 1

    if inserted_count > 0:
        connection.commit()

    cursor.close()
    connection.close()

    return f"Successfully replaced with {inserted_count} publication(s)"

def lambda_handler(event, context):
    arguments = event['arguments']
    return addBatchedUserCVData(arguments=arguments)