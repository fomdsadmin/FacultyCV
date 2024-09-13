import boto3
import json
import psycopg2
import time
from datetime import datetime
import os

sm_client = boto3.client('secretsmanager')
dynamodb = boto3.client('dynamodb')

def getCredentials():
    credentials = {}

    response = sm_client.get_secret_value(SecretId='facultyCV/credentials/dbCredentials')
    secrets = json.loads(response['SecretString'])
    credentials['username'] = secrets['username']
    credentials['password'] = secrets['password']
    credentials['host'] = secrets['host']
    credentials['db'] = secrets['dbname']
    return credentials

def updateUserCVData(arguments):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    print("Connected to Database")
    cursor = connection.cursor()
    archive = arguments.get('archive', None)
    archive_timestamp = datetime.now() if archive else None
    if 'data_details' in arguments:
        data_details_json = json.dumps(arguments['data_details'])  # Convert data_details dictionary to JSON string
        if archive is not None:
            cursor.execute("UPDATE user_cv_data SET data_details = %s, archive = %s, archive_timestamp = %s WHERE user_cv_data_id = %s", 
                           (data_details_json, archive, archive_timestamp, arguments['user_cv_data_id']))
        else:
            cursor.execute("UPDATE user_cv_data SET data_details = %s WHERE user_cv_data_id = %s", 
                           (data_details_json, arguments['user_cv_data_id']))
    else:
        if archive is not None:
            cursor.execute("UPDATE user_cv_data SET archive = %s, archive_timestamp = %s WHERE user_cv_data_id = %s", 
                           (archive, archive_timestamp, arguments['user_cv_data_id']))
    # Fetch all templates which have the data_section_id
    cursor.execute('SELECT data_section_id FROM user_cv_data WHERE user_cv_data_id = %s', (arguments['user_cv_data_id'],))
    data_section_id = cursor.fetchone()
    data_section_id = data_section_id[0]
    cursor.execute('SELECT template_id, data_section_ids FROM templates')
    templates = cursor.fetchall()
    # Get all template ids which have the data_section_id
    filtered_template_ids = []
    for template in templates:
        if data_section_id in template[1]:
            filtered_template_ids.append(template[0])
    for template_id in filtered_template_ids:
        # Update the key cognito_user_id/template_id to the current timestamp
        user_logs = {
            'logEntryId': {'S': f"{arguments['cognito_user_id']}/{template_id}"},
            'timestamp': {'N': f"{int(time.time())}"}
        }
        dynamodb.put_item(
            TableName=os.environ['TABLE_NAME'],
            Item=user_logs
        )
    print("Updated user logs")
    cursor.close()
    connection.commit()
    connection.close()
    return "SUCCESS"


def lambda_handler(event, context):
    arguments = event['arguments']
    return updateUserCVData(arguments=arguments)