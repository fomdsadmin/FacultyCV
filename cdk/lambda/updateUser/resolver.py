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
        bio = %s,
        rank = %s, 
        institution = %s, 
        primary_department = %s, 
        secondary_department = %s, 
        primary_faculty = %s, 
        secondary_faculty = %s, 
        primary_affiliation = %s,
        secondary_affiliation = %s,
        campus = %s, 
        keywords = %s, 
        institution_user_id = %s, 
        scopus_id = %s, 
        orcid_id = %s
    WHERE user_id = %s
    """

    # Execute the query with the provided arguments
    cursor.execute(query, (
        arguments['first_name'] if 'first_name' in arguments else '',
        arguments['last_name'] if 'last_name' in arguments else '',
        arguments['preferred_name'] if 'preferred_name' in arguments else '', 
        arguments['email'] if 'email' in arguments else '',
        arguments['role'] if 'role' in arguments else '',
        arguments['bio'] if 'bio' in arguments else '',
        arguments['rank'] if 'rank' in arguments else '',
        arguments['institution'] if 'institution' in arguments else '',
        arguments['primary_department'] if 'primary_department' in arguments else '',
        arguments['secondary_department'] if 'secondary_department' in arguments else '',
        arguments['primary_faculty'] if 'primary_faculty' in arguments else '',
        arguments['secondary_faculty'] if 'secondary_faculty' in arguments else '',
        arguments['primary_affiliation'] if 'primary_affiliation' in arguments else '',
        arguments['secondary_affiliation'] if 'secondary_affiliation' in arguments else '',
        arguments['campus'] if 'campus' in arguments else '',
        arguments['keywords'] if 'keywords' in arguments else '',
        arguments['institution_user_id'] if 'institution_user_id' in arguments else '',
        arguments['scopus_id'] if 'scopus_id' in arguments else '',
        arguments['orcid_id'] if 'orcid_id' in arguments else '',
        arguments['user_id']
    ))

    cursor.close()
    connection.commit()
    connection.close()
    return "User updated successfully"

def lambda_handler(event, context):
    return updateUser(event['arguments'])
