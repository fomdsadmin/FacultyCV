import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def getUserProfileMatches(event):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    cursor = connection.cursor()
    
    arguments = event['arguments']

    # Get search parameters
    first_name = arguments.get('first_name', '')
    last_name = arguments.get('last_name', '')
    
    print(f'Searching for users with first_name like: {first_name}, last_name like: {last_name}')
    
    # Build query with ILIKE for case-insensitive partial matching
    query = """
    SELECT * FROM users 
    """
    
    # Only add conditions for non-empty search terms
    if first_name:
        query += f"WHERE first_name ILIKE '%{first_name}%'"
    if last_name:
        query += f" AND last_name ILIKE '%{last_name}%' AND pending = false AND approved = true"

    cursor.execute(query)
    
    # Fetch all matching results
    results = cursor.fetchall()
    print(f'Found {len(results)} matching users')
    
    # Convert results to list of user objects
    user_matches = []
    for result in results:
        user = {
            'user_id': result[0],
            'first_name': result[1],
            'last_name': result[2],
            'email': result[4],
            'role': result[5],
            'primary_department': result[9],
            'primary_faculty': result[11],
            'pending': result[21],
            'approved': result[22],
            'username': result[23],
            
        }
        user_matches.append(user)
    
    cursor.close()
    connection.close()
    
    return user_matches

def lambda_handler(event, context):
    return getUserProfileMatches(event)