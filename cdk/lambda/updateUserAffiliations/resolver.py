import boto3
import json
import psycopg2
from datetime import datetime
import time
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
dynamodb = boto3.client('dynamodb')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def updateUserAffiliations(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to database")
    cursor = connection.cursor()

    user_id = arguments.get('user_id')
    first_name = arguments.get('first_name')
    last_name = arguments.get('last_name')
    
    # Parse affiliations JSON if it's a string
    affiliations_str = arguments.get('affiliations', '{}')
    if isinstance(affiliations_str, str):
        try:
            affiliations = json.loads(affiliations_str)
        except json.JSONDecodeError:
            print("Error decoding JSON:", affiliations_str)
            affiliations = {}
    else:
        affiliations = affiliations_str
        
    print(f"Parsed affiliations data: {affiliations}")

    # First check if a record exists
    cursor.execute("SELECT COUNT(*) FROM affiliations WHERE user_id = %s", (user_id,))
    record_exists = cursor.fetchone()[0] > 0

    if record_exists:
        # Update existing record
        query = """
        UPDATE affiliations SET 
            faculty = %s,
            institution = %s,
            academic_units = %s,
            research_affiliations = %s,
            hospital_affiliations = %s
        WHERE user_id = %s AND first_name = %s AND last_name = %s
        """
        
        cursor.execute(query, (
            json.dumps(affiliations.get('faculty', {})),
            json.dumps(affiliations.get('institution', {})),
            json.dumps(affiliations.get('academic_units', [])),
            json.dumps(affiliations.get('research_affiliations', [])),
            json.dumps(affiliations.get('hospital_affiliations', [])),
            user_id,
            first_name,
            last_name
        ))
    else:
        # Insert new record
        query = """
        INSERT INTO affiliations (
            user_id, first_name, last_name, faculty, institution, 
            academic_units, research_affiliations, hospital_affiliations
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        cursor.execute(query, (
            user_id,
            first_name,
            last_name,
            json.dumps(affiliations.get('faculty', {})),
            json.dumps(affiliations.get('institution', {})),
            json.dumps(affiliations.get('academic_units', [])),
            json.dumps(affiliations.get('research_affiliations', [])),
            json.dumps(affiliations.get('hospital_affiliations', []))
        ))

    cursor.close()
    connection.commit()
    connection.close()
    return "User affiliations updated successfully"

def lambda_handler(event, context):
    return updateUserAffiliations(event['arguments'])
