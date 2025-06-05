import boto3
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def addAuditView(arguments, identity=None):
    # Extract fields from arguments from cognito identity
    logged_user_id = identity.get('sub') if identity else None
    logged_user_first_name = identity.get('given_name') if identity else None
    logged_user_last_name = identity.get('family_name') if identity else None
    logged_user_role = identity.get('groups', [None])[0] if identity and 'groups' in identity else None
    
    ip = arguments.get('ip')
    browser_name = arguments.get('browser_name')
    browser_version = arguments.get('browser_version')
    page = arguments.get('page')
    session_id = arguments.get('session_id')
    assistant = arguments.get('assistant')
    profile_record = arguments.get('profile_record')

    # Validate required fields
    if logged_user_id is None or logged_user_first_name is None or logged_user_last_name is None:
        raise Exception("logged_user_id, logged_user_first_name, and logged_user_last_name are required.")

    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    cursor = connection.cursor()

    # Insert the audit record
    cursor.execute(
        """
        INSERT INTO audit_view (
            logged_user_id, logged_user_first_name, logged_user_last_name, ip,
            browser_name, browser_version, page, session_id, assistant,
            profile_record, logged_user_role
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING log_view_id, NOW(), logged_user_id, logged_user_first_name, logged_user_last_name, ip,
                browser_name, browser_version, page, session_id, assistant, profile_record, logged_user_role
        """,
        (
            logged_user_id, logged_user_first_name, logged_user_last_name, ip,
            browser_name, browser_version, page, session_id, assistant,
            profile_record, logged_user_role
        )
    )
    result = cursor.fetchone()
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
        'browser_name': result[6],
        'browser_version': result[7],
        'page': result[8],
        'session_id': result[9],
        'assistant': result[10],
        'profile_record': result[11],
        'logged_user_role': result[12]
    }

def lambda_handler(event, context):
    return addAuditView(event['arguments'],event.get('identity'))