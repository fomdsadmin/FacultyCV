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

def addUser(arguments):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    print("Connected to database")
    cursor = connection.cursor()

    # Prepare the INSERT query
    query = """
    INSERT INTO users (
        first_name, 
        last_name, 
        preferred_name, 
        email, 
        role,
        rank, 
        primary_department, 
        secondary_department, 
        primary_faculty, 
        secondary_faculty, 
        campus, 
        keywords, 
        institution_user_id, 
        scopus_id, 
        orcid_id
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    # Execute the query with the provided arguments
    cursor.execute(query, (
        arguments['first_name'],
        arguments['last_name'],
        arguments['preferred_name'] if 'preferred_name' in arguments else '', 
        arguments['email'],
        arguments['role'],
        arguments['rank'] if 'rank' in arguments else '',
        arguments['primary_department'] if 'primary_department' in arguments else '',
        arguments['secondary_department'] if 'secondary_department' in arguments else '',
        arguments['primary_faculty'] if 'primary_faculty' in arguments else '',
        arguments['secondary_faculty'] if 'secondary_faculty' in arguments else '',
        arguments['campus'] if 'campus' in arguments else '',
        arguments['keywords'] if 'keywords' in arguments else '',
        arguments['institution_user_id'] if 'institution_user_id' in arguments else '',
        arguments['scopus_id'] if 'scopus_id' in arguments else '',
        arguments['orcid_id'] if 'orcid_id' in arguments else ''
    ))

    cursor.close()
    connection.commit()
    connection.close()
    return "User added successfully"

def lambda_handler(event, context):
    return addUser(event['arguments'])