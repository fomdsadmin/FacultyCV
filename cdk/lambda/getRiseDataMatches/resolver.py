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

def getRiseDataMatches(arguments):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    print("Connected to Database")
    cursor = connection.cursor()
    # Retrieve results with the same first name AND last name
    cursor.execute('SELECT * FROM rise_data WHERE first_name = %s AND last_name = %s', (arguments['first_name'], arguments['last_name'],))
    results_same_first_last = cursor.fetchall()

    # Retrieve results with the same last name
    cursor.execute('SELECT * FROM rise_data WHERE last_name = %s', (arguments['last_name'],))
    results_same_last = cursor.fetchall()

    # Retrieve results with the same first name
    cursor.execute('SELECT * FROM rise_data WHERE first_name = %s', (arguments['first_name'],))
    results_same_first = cursor.fetchall()

    cursor.close()
    connection.close()

    # Combine results in the specified order
    matches = []
    if len(results_same_first_last) > 0:
        for result in results_same_first_last:
            matches.append({
                'rise_data_id': result[0],
                'first_name': result[1],
                'last_name': result[2],
                'data_details': {
                    'first_name': result[1],
                    'last_name': result[2],
                    'keywords': result[3],
                    'agency': result[4],
                    'department': result[5],
                    'program': result[6],
                    'title': result[7],
                    'amount': result[8],
                    'dates': result[9]
                }
            })

    if len(results_same_last) > 0:
        for result in results_same_last:
            matches.append({
                'rise_data_id': result[0],
                'first_name': result[1],
                'last_name': result[2],
                'data_details': {
                    'first_name': result[1],
                    'last_name': result[2],
                    'keywords': result[3],
                    'agency': result[4],
                    'department': result[5],
                    'program': result[6],
                    'title': result[7],
                    'amount': result[8],
                    'dates': result[9]
                }
            })

    if len(results_same_first) > 0:
        for result in results_same_first:
            matches.append({
                'rise_data_id': result[0],
                'first_name': result[1],
                'last_name': result[2],
                'data_details': {
                    'first_name': result[1],
                    'last_name': result[2],
                    'keywords': result[3],
                    'agency': result[4],
                    'department': result[5],
                    'program': result[6],
                    'title': result[7],
                    'amount': result[8],
                    'dates': result[9]
                }
            })

    return matches

def lambda_handler(event, context):
    return getRiseDataMatches(event['arguments'])