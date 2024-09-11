import boto3
import json
import psycopg2
import os

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

def getUser(event):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    print("Connected to database")
    cursor = connection.cursor()
    
    arguments = event['arguments']

    cognito_idp = boto3.client('cognito-idp')

    user_name = event['identity']['claims']['username']
    user_pool_id = os.environ['USER_POOL_ID']

    # Get user attributes
    user_attributes = cognito_idp.admin_get_user(
        UserPoolId=user_pool_id,
        Username=user_name
    )

    cognito_email = next(attr['Value'] for attr in user_attributes['UserAttributes'] if attr['Name'] == 'email')
    # Prepare the SELECT query
    email = arguments['email']  # get the email from arguments

    if email != cognito_email:
        return "Unauthorized"

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
    return getUser(event)