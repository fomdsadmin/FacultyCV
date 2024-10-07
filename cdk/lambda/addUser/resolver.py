import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def addUser(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
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
        bio,
        rank,
        institution, 
        primary_department, 
        secondary_department, 
        primary_faculty, 
        secondary_faculty,
        primary_affiliation,
        secondary_affiliation, 
        campus, 
        keywords, 
        institution_user_id, 
        scopus_id, 
        orcid_id
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    # Execute the query with the provided arguments
    cursor.execute(query, (
        arguments['first_name'],
        arguments['last_name'],
        arguments['preferred_name'] if 'preferred_name' in arguments else '', 
        arguments['email'],
        arguments['role'],
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
        arguments['orcid_id'] if 'orcid_id' in arguments else ''
    ))

    cursor.close()
    connection.commit()
    connection.close()
    return "User added successfully"

def lambda_handler(event, context):
    return addUser(event['arguments'])