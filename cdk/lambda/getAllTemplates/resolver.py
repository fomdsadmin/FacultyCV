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

def getAllTemplates(arguments):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    print("Connected to Database")
    cursor = connection.cursor()
    cursor.execute('SELECT template_id, title, data_section_ids FROM templates')
    results = cursor.fetchall()
    cursor.close()
    connection.close()
    templates = []
    for result in results:
        templates.append({
            'template_id': result[0],
            'title': result[1],
            'data_section_ids': result[2]
        })
    return templates

def lambda_handler(event, context):
    return getAllTemplates(event['arguments'])