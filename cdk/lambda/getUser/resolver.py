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

def getUser(arguments):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    print("Connected to database")
    cursor = connection.cursor()
    
    # Prepare the SELECT query
    email = arguments['email']  # get the email from arguments
    query = f"""
    SELECT * FROM users 
    WHERE email = '{email}'
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
            'primary_department': result[8],
            'secondary_department': result[9],
            'primary_faculty': result[10],
            'secondary_faculty': result[11],
            'campus': result[12],
            'keywords': result[13],
            'institution_user_id': result[14],
            'scopus_id': result[15],
            'orcid_id': result[16],
            'joined_timestamp': result[17]
        }
    else:
        user = "User not found"

    cursor.close()
    connection.commit()
    connection.close()
    return user

def lambda_handler(event, context):
    return getUser(event['arguments'])