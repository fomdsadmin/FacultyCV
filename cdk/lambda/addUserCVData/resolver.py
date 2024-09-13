import boto3
import json
import psycopg2
import os
import time

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

def addUserCVData(arguments):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    print("Connected to Database")
    cursor = connection.cursor()

    # Check if an entry with the same data_details, user_id, and data_section_id exists
    data_details_json = json.dumps(arguments['data_details'])
    cursor.execute("SELECT COUNT(*) FROM user_cv_data WHERE data_details::jsonb = %s AND user_id = %s AND data_section_id = %s", (data_details_json, arguments['user_id'], arguments['data_section_id']))
    existing_count = cursor.fetchone()[0]

    if existing_count == 0:
        # Insert the new entry
        cursor.execute("INSERT INTO user_cv_data (user_id, data_section_id, data_details, editable) VALUES (%s, %s, %s, %s)", (arguments['user_id'], arguments['data_section_id'], data_details_json, arguments['editable'],))
        data_section_id = arguments['data_section_id']
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
        connection.commit()
        cursor.close()
        connection.close()
        return "SUCCESS"
    else:
        cursor.close()
        connection.close()
        return "Entry already exists"

def lambda_handler(event, context):
    arguments = event['arguments']
    return addUserCVData(arguments=arguments)
