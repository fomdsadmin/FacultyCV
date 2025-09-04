import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ.get('DB_PROXY_ENDPOINT')

def getUserAffiliations(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    
    # Get column names
    cursor.execute('SELECT primary_unit, joint_units, research_affiliations, hospital_affiliations FROM affiliations WHERE user_id = %s', 
                  (arguments['user_id'],))
    
    # Get the result
    result = cursor.fetchone()
    
    # Close connection
    cursor.close()
    connection.close()
    
    # Handle the case where no results are found
    if not result:
        return []
    
    # Create a dictionary with all fields, handling None values
    affiliations_data = {
        "primary_unit": result[0] if result[0] is not None else [],
        "joint_units": result[1] if result[1] is not None else [],
        "research_affiliations": result[2] if result[2] is not None else [],
        "hospital_affiliations": result[3] if result[3] is not None else []
    }
    
    # Format as expected in the schema
    return [{
        "data_details": json.dumps(affiliations_data)
    }]

def lambda_handler(event, context):
    return getUserAffiliations(event['arguments'])