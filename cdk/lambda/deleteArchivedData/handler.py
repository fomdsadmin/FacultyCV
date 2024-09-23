import boto3
import json
import psycopg2
from datetime import datetime, timedelta

sm_client = boto3.client('secretsmanager')

def getCredentials():
    credentials = {}

    response = sm_client.get_secret_value(SecretId='facultyCV/credentials/dbCredentials')
    secrets = json.loads(response['SecretString'])
    credentials['username'] = secrets['username']
    credentials['password'] = secrets['password']
    credentials['host'] = secrets['host']
    credentials['db'] = secrets['dbname']
    return credentials

def deleteArchivedData():
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
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