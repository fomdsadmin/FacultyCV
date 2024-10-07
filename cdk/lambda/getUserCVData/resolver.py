import boto3
import json
import psycopg2
import os

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ.get('DB_PROXY_ENDPOINT')

def getCredentials():
    credentials = {}

    response = sm_client.get_secret_value(SecretId='facultyCV/credentials/dbCredentials')
    secrets = json.loads(response['SecretString'])
    credentials['username'] = secrets['username']
    credentials['password'] = secrets['password']
    credentials['host'] = secrets['host']
    credentials['db'] = secrets['dbname']
    return credentials

def getUserCVData(arguments):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=DB_PROXY_ENDPOINT, database=credentials['db'])
    print("Connected to Database")
    cursor = connection.cursor()
    if ('data_section_id_list' not in arguments):
        cursor.execute('SELECT user_cv_data_id, user_id, data_section_id, data_details, editable FROM user_cv_data WHERE user_id = %s AND data_section_id = %s AND archive != true', (arguments['user_id'], arguments['data_section_id']))
    else:
        cursor.execute('SELECT user_cv_data_id, user_id, data_section_id, data_details, editable FROM user_cv_data WHERE user_id = %s AND data_section_id IN %s AND archive != true', (arguments['user_id'], tuple(arguments['data_section_id_list'])))
    results = cursor.fetchall()
    cursor.close()
    connection.close()
    user_cv_data = []
    if len(results) == 0:
        return []
    for result in results:
        user_cv_data.append({
            'user_cv_data_id': result[0],
            'user_id': result[1],
            'data_section_id': result[2],
            'data_details': result[3],
            'editable': result[4]
        })
    return user_cv_data

def lambda_handler(event, context):
    return getUserCVData(event['arguments'])