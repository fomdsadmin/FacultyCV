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

    # user_name = event['identity']['claims']['email']
    # user_pool_id = os.environ['USER_POOL_ID']

    # print("User pool id: ", user_pool_id)
    # print("Claims", event['identity']['claims'])
    # print("identity", event['identity'])

    cwl_username = arguments['cwl_username']  # get the email from arguments
    # Retrieve user_ids from users table
    cursor.execute(f"SELECT user_id FROM users WHERE cwl_username = '{cwl_username}'")
    username_user_id = cursor.fetchone()
    print('got to here')
    print('username_user_id: ', username_user_id)
    if not username_user_id:
        return "Username not found"

    username_user_id = username_user_id[0]
    #cognito_user_id = cognito_user_data[0]
    #cognito_user_role = cognito_user_data[1]
    print('before query')
    query = f"""
    SELECT * FROM users 
    WHERE cwl_username = '{cwl_username}'
    """
    
    # Execute the query
    cursor.execute(query)

    # Fetch the result
    result = cursor.fetchone()
    print(result)
    print('after query fetchone')

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
            'joined_timestamp': result[20],
            'pending': result[21],
            'approved': result[22],
            'cwl_username': result[23],
            'vpp_username': result[25],
            'active': result[26]
        }
    else:
        user = "User not found"

    cursor.close()
    connection.commit()
    connection.close()
    return user

def lambda_handler(event, context):
    return getUser(event)