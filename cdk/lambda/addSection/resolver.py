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

def addSection(arguments):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=DB_PROXY_ENDPOINT, database=credentials['db'])
    print("Connected to Database")
    cursor = connection.cursor()
    attributes_json = json.dumps(arguments['attributes'])  # Convert attributes dictionary to JSON string
    cursor.execute("INSERT INTO data_sections (title, description, data_type, attributes) VALUES (%s, %s, %s, %s)", (arguments['title'], arguments['description'], arguments['data_type'], attributes_json))
    cursor.close()
    connection.commit()
    connection.close()
    return "SUCCESS"

def lambda_handler(event, context):
    return addSection(event['arguments'])