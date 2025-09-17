import boto3
import json
import psycopg2
import os
import time
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
dynamodb = boto3.client('dynamodb')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def addStagingScopusPublications(arguments):
    """
    arguments: {
        'user_id': str,
        'publications': [list of publication data dicts],
    }
    """
    user_id = arguments['user_id']
    publications = arguments.get('publications', [])

    if not isinstance(publications, list):
        return "No publications provided"

    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()

    try:
        # 1. First, remove all existing entries for this user_id
        cursor.execute(
            "DELETE FROM scopus_publications WHERE user_id = %s",
            (user_id,)
        )
        deleted_count = cursor.rowcount
        print(f"Deleted {deleted_count} existing Scopus publications for user {user_id}")

        # 2. Insert new publications
        inserted_count = 0
        for publication in publications:
            data_details_json = json.dumps(publication)
            cursor.execute(
                "INSERT INTO scopus_publications (user_id, data_details, is_new, fetched_at) VALUES (%s, %s, %s, CURRENT_TIMESTAMP)",
                (user_id, data_details_json, True)
            )
            inserted_count += 1

        # Commit the transaction
        connection.commit()
        print(f"Successfully inserted {inserted_count} new Scopus publications for user {user_id}")

        cursor.close()
        connection.close()

        return f"Successfully processed {inserted_count} publications. Deleted {deleted_count} existing entries."

    except Exception as e:
        print(f"Error in addStagingScopusPublications: {str(e)}")
        connection.rollback()
        cursor.close()
        connection.close()
        return f"Error: {str(e)}"

def lambda_handler(event, context):
    arguments = event['arguments']
    return addStagingScopusPublications(arguments=arguments)
