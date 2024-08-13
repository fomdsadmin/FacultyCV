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

def addUserCVData(arguments):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    print("Connected to Database")
    cursor = connection.cursor()

    # Check if an entry with the same data_details, user_id, and data_section_id exists
    data_details_json = json.dumps(arguments['data_details'])
    cursor.execute("SELECT COUNT(*) FROM user_cv_data WHERE data_details::jsonb = %s AND user_id = %s AND data_section_id = %s", (data_details_json, arguments['user_id'], arguments['data_section_id']))
    existing_count = cursor.fetchone()[0]

    if existing_count == 0:
        # Insert the new entry
        cursor.execute("INSERT INTO user_cv_data (user_id, data_section_id, data_details) VALUES (%s, %s, %s)", (arguments['user_id'], arguments['data_section_id'], data_details_json,))
        connection.commit()
        cursor.close()
        connection.close()
        return "SUCCESS"
    else:
        cursor.close()
        connection.close()
        return "Entry already exists"

def lambda_handler(event, context):
    arguments = event['arguments']
    return addUserCVData(arguments=arguments)
