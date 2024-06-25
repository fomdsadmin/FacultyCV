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
    print("Connected to Database")
    connection.close()
    # TODO
    return {
        "facultyMemberId": "testId",
        "firstName": "Aayush",
        "preferredName": "",
        "lastName": "Behl",
        "email": "aayush.behl@ubc.ca",
        "currentRank": "Student",
        "primaryDepartment": "Faculty of Applied Science",
        "secondaryDepartment": "",
        "primaryFaculty": "Computer Engineering",
        "secondaryFaculty": "",
        "campus": "Vancouver",
        "keywords": "",
        "institutionUserId": "123",
        "scopusId": 1234,
        "orcidId": "12345"
    }

def lambda_handler(event, context):
    return getUser(event['arguments'])