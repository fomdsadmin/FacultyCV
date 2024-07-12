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

def updateUser(arguments):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    print("Connected to database")
    cursor = connection.cursor()

    # Prepare the UPDATE query
    query = """
    UPDATE university_info SET 
        type = %s, 
        value = %s, 
    WHERE university_info_id = %s
    """

    # Execute the query with the provided arguments
    cursor.execute(query, (
        arguments['type'] if 'type' in arguments else '',
        arguments['value'] if 'value' in arguments else '',
        arguments['university_info_id']
    ))

    cursor.close()
    connection.commit()
    connection.close()
    return "University info updated successfully"

def lambda_handler(event, context):
    return updateUser(event['arguments'])
