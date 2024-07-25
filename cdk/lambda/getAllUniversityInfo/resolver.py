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

def getAllUniversityInfo(arguments):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    print("Connected to Database")
    cursor = connection.cursor()
    cursor.execute('SELECT university_info_id, type, value FROM university_info')
    results = cursor.fetchall()
    cursor.close()
    connection.close()
    university_info = []
    for result in results:
        university_info.append({
            'university_info_id': result[0],
            'type': result[1],
            'value': result[2],
        })
    return university_info

def lambda_handler(event, context):
    return getAllUniversityInfo(event['arguments'])