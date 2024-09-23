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

def linkScopusId(arguments):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    print("Connected to database")
    cursor = connection.cursor()

    # Prepare the UPDATE query
    query = "UPDATE users SET scopus_id = %s" + ("orcid_id = %s" if 'orcid_id' in arguments else "")
    query += " WHERE user_id = %s"

    # Execute the query with the provided arguments
    values = (arguments['scopus_id'], arguments['orcid_id'], arguments['user_id']) if 'orcid_id' in arguments else (arguments['scopus_id'], arguments['user_id'])
    cursor.execute(query, values)

    cursor.close()
    connection.commit()
    connection.close()
    return "Scopus ID linked successfully"

def lambda_handler(event, context):
    return linkScopusId(event['arguments'])
