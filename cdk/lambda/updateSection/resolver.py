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

def updateSection(arguments):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    print("Connected to Database")
    cursor = connection.cursor()
    cursor.execute("UPDATE data_sections SET archive = %s WHERE data_section_id = %s", (arguments['archive'], arguments['data_section_id']))
    cursor.close()
    connection.commit()
    connection.close()
    return "SUCCESS"

def lambda_handler(event, context):
    arguments = event['arguments']
    return updateSection(arguments=arguments)