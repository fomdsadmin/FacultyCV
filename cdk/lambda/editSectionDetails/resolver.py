import boto3
import json
import psycopg2
import os
from datetime import datetime
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def editSectionDetails(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()

    cursor.execute("UPDATE data_sections SET title = %s, data_type = %s, description = %s, info = %s WHERE data_section_id = %s", 
                  (arguments['title'], arguments['data_type'], arguments['description'], arguments['info'], arguments['data_section_id']))
                  
    cursor.close()
    connection.commit()
    connection.close()
    return "SUCCESS"

def lambda_handler(event, context):
    arguments = event['arguments']
    return editSectionDetails(arguments=arguments)