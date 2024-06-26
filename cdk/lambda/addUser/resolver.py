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
        primary_department, 
        secondary_department, 
        primary_faculty, 
        secondary_faculty, 
        campus, 
        keywords, 
        institution_user_id, 
        scopus_id, 
        orcid_id
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    # Execute the query with the provided arguments
    cursor.execute(query, (
        arguments['firstName'], 
        arguments['lastName'], 
        arguments['preferredName'], 
        arguments['email'], 
        arguments['role'], 
        arguments['primaryDepartment'], 
        arguments['secondaryDepartment'], 
        arguments['primaryFaculty'], 
        arguments['secondaryFaculty'], 
        arguments['campus'], 
        arguments['keywords'], 
        arguments['institutionUserId'], 
        arguments['scopusId'], 
        arguments['orcidId']
    ))

    cursor.close()
    connection.commit()
    connection.close()
    return "User added successfully"

def lambda_handler(event, context):
    return addUser(event['arguments'])