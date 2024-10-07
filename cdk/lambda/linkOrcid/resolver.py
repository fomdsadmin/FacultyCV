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

def linkOrcid(arguments):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=DB_PROXY_ENDPOINT, database=credentials['db'])
    print("Connected to database")
    cursor = connection.cursor()

    # Prepare the UPDATE query
    query = "UPDATE users SET orcid_id = %s WHERE user_id = %s"

    # Execute the query with the provided arguments
    values = (arguments['orcid_id'], arguments['user_id'])
    cursor.execute(query, values)

    cursor.close()
    connection.commit()
    connection.close()
    return "Orcid ID linked successfully"

def lambda_handler(event, context):
    return linkOrcid(event['arguments'])