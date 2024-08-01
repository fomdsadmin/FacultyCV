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

def getTeachingDataMatches(arguments):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    print("Connected to Database")
    cursor = connection.cursor()
    cursor.execute('SELECT * FROM teaching_data WHERE institution_user_id = %s', (arguments['institution_user_id'],))
    results = cursor.fetchall()
    cursor.close()
    connection.close()
    matches = []
    if len(results) == 0:
        return []
    for result in results:
        matches.append({
            'teaching_data_id': result[0],
            'institution_user_id': result[11],
            'data_details': {
                'year': result[1],
                'session': result[2],
                'course': result[3],
                'description': result[4],
                'scheduled_hours': result[5],
                'class_size': result[6],
                'lectures': result[7],
                'tutorials': result[8],
                'labs': result[9],
                'other': result[10]
            }
        })
    return matches

def lambda_handler(event, context):
    return getTeachingDataMatches(event['arguments'])