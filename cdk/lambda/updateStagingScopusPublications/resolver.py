import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
dynamodb = boto3.client('dynamodb')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def updateStagingScopusPublications(arguments):
    """
    Update the is_new status of staging Scopus publications
    arguments: {
        'publication_ids': [list of publication IDs to update],
        'is_new': boolean value to set
    }
    """
    publication_ids = arguments.get('publication_ids', [])
    is_new = arguments.get('is_new', False)

    if not isinstance(publication_ids, list) or len(publication_ids) == 0:
        return "No publication IDs provided"

    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()

    try:
        # Ensure we have a list of strings
        if isinstance(publication_ids, str):
            publication_ids = [publication_ids]
        
        # Convert to strings and validate UUID format
        valid_ids = []
        for pid in publication_ids:
            str_id = str(pid).strip()
            print(f"Processing ID: {str_id}")
            if str_id:  # Basic validation
                valid_ids.append(str_id)
        
        if not valid_ids:
            return "No valid publication IDs found"
        
        # Update the is_new status for the specified publication IDs
        # Use IN clause instead of ANY for better compatibility
        placeholders = ','.join(['%s'] * len(valid_ids))
        update_query = f"""
            UPDATE scopus_publications 
            SET is_new = %s 
            WHERE id IN ({placeholders})
        """
        
        # Prepare parameters: is_new value + all the IDs
        params = [is_new] + valid_ids
        cursor.execute(update_query, params)
        updated_count = cursor.rowcount
        
        # Commit the transaction
        connection.commit()
        print(f"Successfully updated {updated_count} Scopus publications with is_new = {is_new}")

        cursor.close()
        connection.close()

        return f"Successfully updated {updated_count} publications"

    except Exception as e:
        print(f"Error in updateStagingScopusPublications: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        print(f"publication_ids: {publication_ids}")
        print(f"is_new: {is_new}")
        connection.rollback()
        cursor.close()
        connection.close()
        return f"Error: {str(e)}"

def lambda_handler(event, context):
    try:
        arguments = event['arguments']
        return updateStagingScopusPublications(arguments)
    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        return f"Error: {str(e)}"
