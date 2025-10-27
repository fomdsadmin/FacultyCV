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
    cursor.execute("SELECT user_id FROM users WHERE cwl_username = %s", (cwl_username,))
    username_user_id = cursor.fetchone()
    if not username_user_id:
        return "Username not found"

    username_user_id = username_user_id[0]
    #cognito_user_id = cognito_user_data[0]
    #cognito_user_role = cognito_user_data[1]

    cursor.execute("SELECT * FROM users WHERE cwl_username = %s", (cwl_username,))

    # Fetch the result
    result = cursor.fetchone()

    if result is not None:
        user = {
            'user_id': result[0] if result[0] is not None else '',
            'first_name': result[1] if result[1] is not None else '',
            'last_name': result[2] if result[2] is not None else '',
            'preferred_name': result[3] if result[3] is not None else '',
            'email': result[4] if result[4] is not None else '',
            'role': result[5] if result[5] is not None else '',
            'bio': result[6] if result[6] is not None else '',
            'rank': result[7] if result[7] is not None else '',
            'institution': result[8] if result[8] is not None else '',
            'primary_department': result[9] if result[9] is not None else '',
            'secondary_department': result[10] if result[10] is not None else '',
            'primary_faculty': result[11] if result[11] is not None else '',
            'secondary_faculty': result[12] if result[12] is not None else '',
            'primary_affiliation': result[13] if result[13] is not None else '',
            'secondary_affiliation': result[14] if result[14] is not None else '',
            'campus': result[15] if result[15] is not None else '',
            'keywords': result[16] if result[16] is not None else '',
            'institution_user_id': result[17] if result[17] is not None else '',
            'scopus_id': result[18] if result[18] is not None else '',
            'orcid_id': result[19] if result[19] is not None else '',
            'joined_timestamp': result[20] if result[20] is not None else '',
            'pending': result[21] if result[21] is not None else '',
            'approved': result[22] if result[22] is not None else '',
            'cwl_username': result[23] if result[23] is not None else '',
            'vpp_username': result[25] if result[25] is not None else '',
            'active': result[26] if result[26] is not None else '',
            'terminated': result[27] if result[27] is not None else '',
        }
    else:
        user = "User not found"

    cursor.close()
    connection.commit()
    connection.close()
    return user

def lambda_handler(event, context):
    return getUser(event)