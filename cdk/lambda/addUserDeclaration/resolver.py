import boto3
import json
import psycopg2
import os
import time
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
dynamodb = boto3.client('dynamodb')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def addUserDeclaration(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()

    # Check if an entry with the same data_details, user_id, and data_section_id exists
    cursor.execute("SELECT COUNT(*) FROM declarations WHERE first_name = %s AND last_name = %s"
                   , (arguments['first_name'], arguments['last_name']))
    existing_count = cursor.fetchone()[0]

    insert_query = '''
        INSERT INTO declarations (
            first_name,
            last_name,
            reporting_year,
            created_by,
            other_data
        ) VALUES (%s, %s, %s, %s, %s)
        RETURNING id, created_on;
    '''

        # Insert the new entry
    cursor.execute(insert_query, (
        arguments['first_name'],
        arguments['last_name'],
        arguments['reporting_year'],
        arguments['created_by'],
        json.dumps(arguments['other_data'])  # Convert dict to JSON string
        )
    )

    inserted_id, created_on = cursor.fetchone()

    connection.commit()
    cursor.close()
    connection.close()
    return {
    'id': inserted_id,
    'created_on': created_on.strftime("%Y-%m-%d %H:%M:%S.%f")
    }


def lambda_handler(event, context):
    arguments = event['arguments']
    return addUserDeclaration(arguments=arguments)
