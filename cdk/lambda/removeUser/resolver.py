import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def removeUser(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to database")
    cursor = connection.cursor()

    # Prepare the DELETE query with multiple conditions for safety
    query = """
    DELETE FROM users 
    WHERE user_id = %s 
    """

    # Execute the query with the provided arguments
    cursor.execute(query, (
        arguments['user_id'],
    ))

    # Get the number of rows affected
    rows_affected = cursor.rowcount
    
    cursor.close()
    connection.commit()
    connection.close()
    
    if rows_affected > 0:
        return f"User removed successfully. {rows_affected} record(s) deleted."
    else:
        return "No user found matching the provided criteria."

def lambda_handler(event, context):
    return removeUser(event['arguments'])
