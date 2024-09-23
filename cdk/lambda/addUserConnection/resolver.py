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

def addUserConnection(arguments):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    print("Connected to Database")
    cursor = connection.cursor()
    
    # Check for existing connection
    cursor.execute("SELECT COUNT(*) FROM user_connections WHERE faculty_user_id = %s AND assistant_user_id = %s", (arguments['faculty_user_id'], arguments['assistant_user_id']))
    existing_connection = cursor.fetchone()[0]

    if existing_connection > 0:
        cursor.close()
        connection.close()
        return "connection already exists"

    # Proceed with the insertion if no existing connection is found
    cursor.execute("INSERT INTO user_connections (faculty_user_id, faculty_first_name, faculty_last_name, faculty_email, assistant_user_id, assistant_first_name, assistant_last_name, assistant_email, status) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)", 
                   (arguments['faculty_user_id'], arguments['faculty_first_name'], arguments['faculty_last_name'], arguments['faculty_email'], 
                    arguments['assistant_user_id'], arguments['assistant_first_name'], arguments['assistant_last_name'], arguments['assistant_email'], 
                    arguments['status']))
    
    cursor.close()
    connection.commit()
    connection.close()
    return "SUCCESS"

def lambda_handler(event, context):
    arguments = event['arguments']
    return addUserConnection(arguments=arguments)
