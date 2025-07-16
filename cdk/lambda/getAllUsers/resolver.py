import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def getAllUsers(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    
    # Update query to select all columns from the 'users' table
    cursor.execute('SELECT * FROM users')
    results = cursor.fetchall()
    cursor.close()
    connection.close()
    
    # Define a list of column names matching the 'users' table schema
    columns = [
        'user_id', 'first_name', 'last_name', 'preferred_name', 'email',
        'role', 'bio', 'rank', 'institution', 'primary_department', 'secondary_department',
        'primary_faculty', 'secondary_faculty', 'primary_affiliation', 'secondary_affiliation', 'campus', 'keywords',
        'institution_user_id', 'scopus_id', 'orcid_id', 'joined_timestamp', 'cwl', 'vpp', 'pending', 'approved'
    ]
    
    # Convert query results to a list of dictionaries
    users = []
    for result in results:
        user = {columns[i]: result[i] for i in range(len(columns))}
        users.append(user)
    
    return users

def lambda_handler(event, context):
    return getAllUsers(event['arguments'])
