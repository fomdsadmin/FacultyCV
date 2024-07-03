import boto3
import json
import psycopg2

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

def getUserCVData(arguments):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    print("Connected to Database")
    cursor = connection.cursor()
    cursor.execute('SELECT user_cv_data_id, user_id, data_section_id, data_details FROM user_cv_data WHERE user_id = %s AND data_section_id = %s', (arguments['user_id'], arguments['data_section_id']))
    results = cursor.fetchall()
    cursor.close()
    connection.close()
    if len(results) == 0:
        return {}
    return {
        'user_cv_data_id': results[0][0],
        'user_id': results[0][1],
        'data_section_id': results[0][2],
        'data_details': results[0][3]
    }

def lambda_handler(event, context):
    return getUserCVData(event['arguments'])