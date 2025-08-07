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
    data_section_title = arguments.get('data_section_title', "")

    if not isinstance(publications, list):
        return "No publications provided"

    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    inserted_count = 0

    if (data_section_title == 'Publications'):
        # 1. Delete all existing publications for this user and section
        cursor.execute(
            "DELETE FROM user_cv_data WHERE user_id = %s AND data_section_id = %s",
            (user_id, data_section_id)
        )
        for pub in publications:
            data_details_json = json.dumps(pub)
            cursor.execute(
                "INSERT INTO user_cv_data (user_id, data_section_id, data_details, editable) VALUES (%s, %s, %s, %s)",
                (user_id, data_section_id, data_details_json, editable)
            )
            inserted_count += 1
    else:
        for pub in publications:
            data_details_json = json.dumps(pub)
            cursor.execute(
                "SELECT COUNT(*) FROM user_cv_data WHERE data_details::jsonb = %s AND user_id = %s AND data_section_id = %s",
                (data_details_json, user_id, data_section_id)
            )
            existing_count = cursor.fetchone()[0]
            if existing_count == 0:
                cursor.execute(
                    "INSERT INTO user_cv_data (user_id, data_section_id, data_details, editable) VALUES (%s, %s, %s, %s)",
                    (user_id, data_section_id, data_details_json, editable)
                )
                inserted_count += 1

    if inserted_count > 0:
        connection.commit()

    cursor.close()
    connection.close()

    return f"Successfully added {inserted_count} entry(s)"

def lambda_handler(event, context):
    arguments = event['arguments']
    return addBatchedUserCVData(arguments=arguments)