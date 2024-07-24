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

def updateTemplate(arguments):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    print("Connected to database")
    cursor = connection.cursor()

    # Prepare the UPDATE query
    query = """
    UPDATE templates SET 
      title = %s,
      data_section_ids = %s
    WHERE template_id = %s
    """

    # Execute the query with the provided arguments
    cursor.execute(query, (
        arguments['title'] if 'title' in arguments else '',
        arguments['data_section_ids'] if 'data_section_ids' in arguments else '',
        arguments['template_id']
    ))

    cursor.close()
    connection.commit()
    connection.close()
    return "SUCCESS"

def lambda_handler(event, context):
    return updateTemplate(event['arguments'])
