import boto3
import json
import psycopg2
from datetime import datetime
import time
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
dynamodb = boto3.client('dynamodb')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def updateUser(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
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
        institution = %s, 
        primary_department = %s, 
        primary_faculty = %s, 
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
        arguments['institution'] if 'institution' in arguments else '',
        arguments['primary_department'] if 'primary_department' in arguments else '',
        arguments['primary_faculty'] if 'primary_faculty' in arguments else '',
        arguments['campus'] if 'campus' in arguments else '',
        arguments['keywords'] if 'keywords' in arguments else '',
        arguments['institution_user_id'] if 'institution_user_id' in arguments else '',
        arguments['scopus_id'] if 'scopus_id' in arguments else '',
        arguments['orcid_id'] if 'orcid_id' in arguments else '',
        arguments['user_id']
    ))

    # Update the key cognito_user_id/user_id to the current timestamp
    # user_logs = {
    #     'logEntryId': {'S': f"{arguments['cognito_user_id']}/{arguments['user_id']}"},
    #     'timestamp': {'N': f"{int(time.time())}"}
    # }
    # dynamodb.put_item(
    #     TableName=os.environ['TABLE_NAME'],
    #     Item=user_logs
    # )
    print("Updated user logs")
    cursor.close()
    connection.commit()
    connection.close()
    return "User updated successfully"

def lambda_handler(event, context):
    return updateUser(event['arguments'])
