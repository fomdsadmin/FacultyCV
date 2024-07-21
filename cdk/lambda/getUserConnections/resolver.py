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
    cursor.execute('SELECT user_connection_id, user_id, user_connection FROM user_connections WHERE user_id = %s', (arguments['user_id'],))
    results = cursor.fetchall()
    cursor.close()
    connection.close()
    user_connections = []
    if len(results) == 0:
        return {}
    for result in results:
        user_connections.append({
            'user_connection_id': result[0],
            'user_id': result[1],
            'user_connection': result[2]
        })
    return user_connections

def lambda_handler(event, context):
    return getUserCVData(event['arguments'])