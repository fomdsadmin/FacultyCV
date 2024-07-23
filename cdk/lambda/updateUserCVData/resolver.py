import boto3
import json
import psycopg2
from datetime import datetime

sm_client = boto3.client('secretsmanager')

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

    cursor.close()
    connection.commit()
    connection.close()
    return "SUCCESS"


def lambda_handler(event, context):
    arguments = event['arguments']
    return updateUserCVData(arguments=arguments)