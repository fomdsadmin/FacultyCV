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

def getPatentMatches(arguments):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    print("Connected to Database")
    cursor = connection.cursor()

    # Retrieve results with the same last name
    cursor.execute('SELECT * FROM patents WHERE last_name = %s', (arguments['last_name'],))
    results_same_last = cursor.fetchall()

    # Retrieve results with the same first name
    cursor.execute('SELECT * FROM patents WHERE first_name = %s', (arguments['first_name'],))
    results_same_first = cursor.fetchall()

    cursor.close()
    connection.close()

    # Combine results in the specified order
    matches = []
    
    if len(results_same_last) > 0:
        for result in results_same_last:
            matches.append({
                'patent_id': result[0],
                'first_name': result[2],
                'last_name': result[3],
                'data_details': {
                    'title': result[1],
                    'first_name': result[2],
                    'last_name': result[3],
                    'publication_number': result[4],
                    'publication_date': result[5],
                    'family_number': result[6],
                    'country_code': result[7],
                    'kind_code': result[8],
                    'classification': result[9]
                }
            })

    if len(results_same_first) > 0:
        for result in results_same_first:
            matches.append({
                'patent_id': result[0],
                'first_name': result[2],
                'last_name': result[3],
                'data_details': {
                    'title': result[1],
                    'first_name': result[2],
                    'last_name': result[3],
                    'publication_number': result[4],
                    'publication_date': result[5],
                    'family_number': result[6],
                    'country_code': result[7],
                    'kind_code': result[8],
                    'classification': result[9]
                }
            })

    return matches

def lambda_handler(event, context):
    return getPatentMatches(event['arguments'])
