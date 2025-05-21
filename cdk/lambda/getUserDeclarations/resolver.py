import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def getUserDeclarations(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    cursor.execute(
        'SELECT reporting_year, other_data, created_on, created_by FROM declarations WHERE first_name = %s AND last_name = %s',
        (arguments['first_name'], arguments['last_name'])
    )
    results = cursor.fetchall()
    cursor.close()
    connection.close()
    if len(results) == 0:
        return []
    matches = []
    for result in results:
        year = result[0]
        other_data = result[1]  # JSONB field
        created_on = result[2]
        created_by = result[3]

        match = {
            'year': year,
            'coi': other_data.get('conflict_of_interest'),
            'fomMerit': other_data.get('fom_merit'),
            'psa': other_data.get('psa_awards'),
            'promotion': other_data.get('fom_promotion_review'),
            'meritJustification': other_data.get('merit_justification'),
            'psaJustification': other_data.get('psa_justification'),
            'honorific': other_data.get('fom_honorific_impact_report'),
            'created_on': created_on,
            'created_by': created_by
        }
        updated_at = other_data.get('updated_at')
        if updated_at is not None:
            match['updated_at'] = updated_at

        matches.append(match)

    return matches

def lambda_handler(event, context):
    return getUserDeclarations(event['arguments'])