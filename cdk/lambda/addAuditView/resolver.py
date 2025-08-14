import boto3
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def addAuditView(arguments, identity=None):

    # print("RAW ARGUMENTS:", arguments)
    # print("RAW IDENTITY:", identity)

    if "input" in arguments:
        arguments = arguments["input"]
    
    logged_user_id = arguments.get('logged_user_id')
    logged_user_email = arguments.get('logged_user_email')
    logged_user_first_name = arguments.get('logged_user_first_name')
    logged_user_last_name = arguments.get('logged_user_last_name')
    logged_user_role = arguments.get('logged_user_role')  
    ip = arguments.get('ip')
    browser_version = arguments.get('browser_version')
    page = arguments.get('page')
    session_id = arguments.get('session_id')
    assistant = arguments.get('assistant')
    profile_record = arguments.get('profile_record')
    logged_user_action = arguments.get('logged_user_action')

    print("logged_user_id:", logged_user_id)
    print("logged_user_email:", logged_user_email)

    # Validate required fields
    # if logged_user_id is None or logged_user_first_name is None or logged_user_last_name is None:
    #     raise Exception("logged_user_id, logged_user_first_name, and logged_user_last_name are required.")

    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    cursor = connection.cursor()

    # Insert the audit record
    cursor.execute(
    """
        INSERT INTO audit_view (
            ts,
            logged_user_id, logged_user_first_name, logged_user_last_name, ip,
            browser_version, page, session_id, assistant,
            profile_record, logged_user_role, logged_user_email, logged_user_action
        ) VALUES (NOW(), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING log_view_id, ts, logged_user_id, logged_user_first_name, logged_user_last_name, ip,
            browser_version, page, session_id, assistant, profile_record, logged_user_role, logged_user_email, logged_user_action
        """,
        (
            logged_user_id, logged_user_first_name, logged_user_last_name, ip,
            browser_version, page, session_id, assistant,
            profile_record, logged_user_role, logged_user_email, logged_user_action
        )
    )
    result = cursor.fetchone()
    print("result:", result)
    connection.commit()
    cursor.close()
    connection.close()

    # Map result to AuditViewRecord
    return {
        'log_view_id': result[0],
        'ts': str(result[1]),
        'logged_user_id': result[2],
        'logged_user_first_name': result[3],
        'logged_user_last_name': result[4],
        'ip': result[5],
        'browser_version': result[6],
        'page': result[7],
        'session_id': result[8],
        'assistant': result[9],
        'profile_record': result[10],
        'logged_user_role': result[11],
        'logged_user_email': result[12],
        'logged_user_action': result[13]
    }

def lambda_handler(event, context):
    return addAuditView(event['arguments'],event.get('identity'))