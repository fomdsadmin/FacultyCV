import boto3
import json
import psycopg2
from databaseConnect import get_connection
import os
from datetime import datetime, timedelta

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def deleteArchivedData():
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to database")
    cursor = connection.cursor()
    
    # Calculate the date one month ago
    one_month_ago = datetime.now() - timedelta(days=30)
    
    # Delete rows where archive is true and archive_timestamp is older than one month
    delete_query = """
    DELETE FROM user_cv_data
    WHERE archive = true AND archive_timestamp < %s
    """
    cursor.execute(delete_query, (one_month_ago,))
    
    cursor.close()
    connection.commit()
    connection.close()
    return "Archived data deleted successfully"

def lambda_handler(event, context):
    return deleteArchivedData()