import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def getUser(event):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
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

    # Retrieve user_ids from users table
    cursor.execute(f"SELECT user_id FROM users WHERE email = '{email}'")
    email_user_id = cursor.fetchone()
    cursor.execute(f"SELECT user_id, role FROM users WHERE email = '{cognito_email}'")
    cognito_user_data = cursor.fetchone()

    if not email_user_id or not cognito_user_data:
        return "User not found"

    email_user_id = email_user_id[0]
    cognito_user_id = cognito_user_data[0]
    cognito_user_role = cognito_user_data[1]

    query = f"""
    SELECT * FROM users 
    WHERE email = '{email}'
    """
    
    # Execute the query
    cursor.execute(query)

    # Fetch the result
    result = cursor.fetchone()

    if (email_user_id != cognito_user_id) and ("Admin" not in cognito_user_role) and ("Assistant" not in cognito_user_role):
        return {
            'user_id': '',
            'first_name': '',
            'last_name': '',
            'preferred_name': '',
            'email': result[4],
            'role': result[5],
            'bio': '',
            'rank': '',
            'institution': '',
            'primary_department': '',
            'secondary_department': '',
            'primary_faculty': '',
            'secondary_faculty': '',
            'primary_affiliation': '',
            'secondary_affiliation': '',
            'campus': '',
            'keywords': '',
            'institution_user_id': '',
            'scopus_id': '',
            'orcid_id': '',
            'joined_timestamp': ''
        }

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