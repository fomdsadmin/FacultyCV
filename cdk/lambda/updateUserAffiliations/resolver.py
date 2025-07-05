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

    # Extract affiliations JSON object from arguments
    affiliations = arguments.get('affiliations', {}) or {}

    # Prepare the UPDATE query with all required fields
    query = """
    UPDATE users SET 
        first_name = %s,
        last_name = %s,
        primary_academic_unit = %s,
        secondary_academic_unit = %s,
        primary_academic_rank = %s,
        secondary_academic_rank = %s,
        primary_appointment_percent = %s,
        secondary_appointment_percent = %s,
        primary_start_date = %s,
        secondary_start_date = %s,
        department_division = %s,
        department_program = %s,
        department_title = %s,
        department_start_date = %s,
        department_end_date = %s,
        research_center = %s,
        research_division_or_pillar = %s,
        research_title = %s,
        research_start_date = %s,
        research_end_date = %s,
        hospital_health_authority = %s,
        hospital_name = %s,
        hospital_role = %s,
        hospital_start_date = %s,
        hospital_end_date = %s
    WHERE user_id = %s
    """

    # Use affiliations.get(...) for all affiliation fields
    cursor.execute(query, (
        arguments.get('first_name', ''),
        arguments.get('last_name', ''),
        affiliations.get('primary_academic_unit', ''),
        affiliations.get('secondary_academic_unit', ''),
        affiliations.get('primary_academic_rank', ''),
        affiliations.get('secondary_academic_rank', ''),
        affiliations.get('primary_appointment_percent', ''),
        affiliations.get('secondary_appointment_percent', ''),
        affiliations.get('primary_start_date', ''),
        affiliations.get('secondary_start_date', ''),
        affiliations.get('department_division', ''),
        affiliations.get('department_program', ''),
        affiliations.get('department_title', ''),
        affiliations.get('department_start_date', ''),
        affiliations.get('department_end_date', ''),
        affiliations.get('research_center', ''),
        affiliations.get('research_division_or_pillar', ''),
        affiliations.get('research_title', ''),
        affiliations.get('research_start_date', ''),
        affiliations.get('research_end_date', ''),
        affiliations.get('hospital_health_authority', ''),
        affiliations.get('hospital_name', ''),
        affiliations.get('hospital_role', ''),
        affiliations.get('hospital_start_date', ''),
        affiliations.get('hospital_end_date', ''),
        arguments['user_id']
    ))

    cursor.close()
    connection.commit()
    connection.close()
    return "User affiliations updated successfully"

def lambda_handler(event, context):
    return updateUserAffiliations(event['arguments'])
