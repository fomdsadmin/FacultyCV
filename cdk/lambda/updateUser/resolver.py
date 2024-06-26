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

def updateUser(arguments):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    print("Connected to database")
    cursor = connection.cursor()

    # Prepare the UPDATE query
    query = """
    UPDATE users SET 
        first_name = %s, 
        last_name = %s, 
        preferred_name = %s, 
        email = %s, 
        role = %s, 
        primary_department = %s, 
        secondary_department = %s, 
        primary_faculty = %s, 
        secondary_faculty = %s, 
        campus = %s, 
        keywords = %s, 
        institution_user_id = %s, 
        scopus_id = %s, 
        orcid_id = %s
    WHERE user_id = %s
    """

    # Execute the query with the provided arguments
    cursor.execute(query, (
        arguments.get('firstName'), 
        arguments.get('lastName'), 
        arguments.get('preferredName'), 
        arguments.get('email'), 
        arguments.get('role'), 
        arguments.get('primaryDepartment'), 
        arguments.get('secondaryDepartment'), 
        arguments.get('primaryFaculty'), 
        arguments.get('secondaryFaculty'), 
        arguments.get('campus'), 
        arguments.get('keywords'), 
        arguments.get('institutionUserId'), 
        arguments.get('scopusId'), 
        arguments.get('orcidId'),
        arguments.get('userId')
    ))

    cursor.close()
    connection.commit()
    connection.close()
    return "User updated successfully"

def lambda_handler(event, context):
    return updateUser(event['arguments'])
