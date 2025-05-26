import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def deleteUserDeclaration(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    cursor.execute("DELETE FROM declarations WHERE first_name = %s AND last_name = %s AND reporting_year = %s"
                   , (arguments['first_name'], arguments['last_name'], arguments['reporting_year']))
    cursor.close()
    connection.commit()
    connection.close()
    return "SUCCESS"

def lambda_handler(event, context):
    arguments = event['arguments']
    return deleteUserDeclaration(arguments=arguments)
