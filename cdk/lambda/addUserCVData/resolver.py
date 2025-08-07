import boto3
import json
import psycopg2
import os
import time
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
dynamodb = boto3.client('dynamodb')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def addUserCVData(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()

    # Check if an entry with the same data_details, user_id, and data_section_id exists
    data_details_json = json.dumps(arguments['data_details'])
    cursor.execute("SELECT user_cv_data_id, archive FROM user_cv_data WHERE data_details::jsonb = %s AND user_id = %s AND data_section_id = %s", (data_details_json, arguments['user_id'], arguments['data_section_id']))
    existing = cursor.fetchone()

    if existing is None:
        # Insert the new entry
        cursor.execute("INSERT INTO user_cv_data (user_id, data_section_id, data_details, editable, archive, archive_timestamp) VALUES (%s, %s, %s, %s, false, NULL)", (arguments['user_id'], arguments['data_section_id'], data_details_json, arguments['editable'],))
        connection.commit()
        cursor.close()
        connection.close()
        return "SUCCESS"
    else:
        user_cv_data_id, is_archived = existing
        if is_archived:
            # Unarchive and update data_details
            cursor.execute("UPDATE user_cv_data SET archive = false, archive_timestamp = NULL, data_details = %s WHERE user_cv_data_id = %s", (data_details_json, user_cv_data_id))
            connection.commit()
            cursor.close()
            connection.close()
            return "UNARCHIVED"
        else:
            # Entry already exists and is not archived, do nothing or return a message
            cursor.close()
            connection.close()
            return "ALREADY_EXISTS"

def lambda_handler(event, context):
    arguments = event['arguments']
    return addUserCVData(arguments=arguments)
