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

def getExistingUser(arguments):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=DB_PROXY_ENDPOINT, database=credentials['db'])
    print("Connected to database")
    cursor = connection.cursor()
    
    # Prepare the SELECT query
    institution_user_id = arguments['institution_user_id']  # get the id from arguments
    query = f"""
    SELECT * FROM users 
    WHERE institution_user_id = '{institution_user_id}'
    """
    
    # Execute the query
    cursor.execute(query)

    # Fetch the result
    result = cursor.fetchone()
    if result is not None:
        user = {
            'user_id': result[0],
            'first_name': result[1],
            'last_name': result[2],
            'preferred_name': result[3],
            'email': result[4],
            'role': result[5],
            'bio': result[6],
            'rank': result[7],
            'institution': result[8],
            'primary_department': result[9],
            'secondary_department': result[10],
            'primary_faculty': result[11],
            'secondary_faculty': result[12],
            'primary_affiliation': result[13],
            'secondary_affiliation': result[14],
            'campus': result[15],
            'keywords': result[16],
            'institution_user_id': result[17],
            'scopus_id': result[18],
            'orcid_id': result[19],
            'joined_timestamp': result[20]
        }
    else:
        user = "User not found"

    cursor.close()
    connection.commit()
    connection.close()
    return user

def lambda_handler(event, context):
    return getExistingUser(event['arguments'])