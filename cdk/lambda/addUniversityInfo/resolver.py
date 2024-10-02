import boto3
import json
import psycopg2
import os

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def getCredentials():
    credentials = {}

    response = sm_client.get_secret_value(SecretId='facultyCV/credentials/dbCredentials')
    secrets = json.loads(response['SecretString'])
    credentials['username'] = secrets['username']
    credentials['password'] = secrets['password']
    credentials['host'] = secrets['host']
    credentials['db'] = secrets['dbname']
    return credentials

def addUniversityInfo(arguments):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=DB_PROXY_ENDPOINT, database=credentials['db'])
    print("Connected to Database")
    cursor = connection.cursor()
    cursor.execute("INSERT INTO university_info (type, value) VALUES (%s, %s)", (arguments['type'], arguments['value']))
    cursor.close()
    connection.commit()
    connection.close()
    return "SUCCESS"

def lambda_handler(event, context):
    return addUniversityInfo(event['arguments'])