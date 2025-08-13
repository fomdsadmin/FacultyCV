import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def getAuditView(arguments, identity=None):
    
    logged_user_id = arguments.get('logged_user_id', None)
    user_groups = identity.get('groups', []) if identity else []
    
    # Pagination parameters
    page_number = int(arguments.get('page_number', 1))
    page_size = int(arguments.get('page_size', 20))
    offset = (page_number - 1) * page_size

    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    
    filters = []
    params = []
    
    # if id is in the argument 
    if logged_user_id is not None:
        filters.append("logged_user_id = %s")
        params.append(logged_user_id)

    if arguments.get('email'):
        filters.append("logged_user_email ILIKE %s")
        params.append(f"%{arguments['email']}%")
    if arguments.get('first_name'):
        filters.append("logged_user_first_name ILIKE %s")
        params.append(f"%{arguments['first_name']}%")
    if arguments.get('last_name'):
        filters.append("logged_user_last_name ILIKE %s")
        params.append(f"%{arguments['last_name']}%")
    if arguments.get('action'):
        filters.append("logged_user_action = %s")
        params.append(arguments['action'])
    if arguments.get('start_date'):
        filters.append("ts >= %s")
        params.append(arguments['start_date'])
    if arguments.get('end_date'):
        filters.append("ts <= %s")
        params.append(arguments['end_date'])

    where_clause = " AND ".join(filters)
    if where_clause:
        where_clause = "WHERE " + where_clause

    # Get total count for pagination
    count_query = f"SELECT COUNT(*) FROM audit_view {where_clause}"
    cursor.execute(count_query, tuple(params))
    total_count = cursor.fetchone()[0]

    # Get paginated data
    query = f"SELECT * FROM audit_view {where_clause} ORDER BY ts DESC LIMIT %s OFFSET %s"
    params.extend([page_size, offset])
    cursor.execute(query, tuple(params))
    results = cursor.fetchall()
    
    audit_view_records = []
    for result in results:
        audit_view_records.append(
            {
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
            )  
    cursor.close()
    connection.close()

    return {
        "records": audit_view_records,
        "total_count": total_count
    }
    
def lambda_handler(event, context):
    return getAuditView(event['arguments'],event.get('identity'))
    
