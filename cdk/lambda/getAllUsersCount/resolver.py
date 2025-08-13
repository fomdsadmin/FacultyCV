import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def getAllUsersCount(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    cursor = connection.cursor()
    
    # Simple approach - just use standard SQL with conditional WHERE clauses
    query = """
        SELECT 
            COUNT(*) as total_count,
            COUNT(CASE WHEN role = 'Faculty' THEN 1 END) as faculty_count,
            COUNT(CASE WHEN role = 'Assistant' THEN 1 END) as assistant_count,
            COUNT(CASE WHEN role LIKE 'Admin-%' THEN 1 END) as dept_admin_count,
            COUNT(CASE WHEN role = 'Admin' THEN 1 END) as admin_count,
            COUNT(CASE WHEN role LIKE 'FacultyAdmin-%' THEN 1 END) as faculty_admin_count
        FROM users
    """
    
    # Extract parameters
    department = arguments.get('department', '') if arguments else ''
    faculty = arguments.get('faculty', '') if arguments else ''
    
    # Add WHERE clause if needed - using direct string formatting as seen in other resolvers
    if department and department != "All":
        query += f" WHERE primary_department = '{department}'"
    elif faculty and faculty != "All":
        query += f" WHERE primary_faculty = '{faculty}'"
    
    # Execute without parameters - similar to how other resolvers are doing it
    cursor.execute(query)
    counts = cursor.fetchone()
    
    cursor.close()
    connection.close()
    
    # Handle None values
    if counts is None:
        print("No data found, returning zero counts")
        return {
            "total_count": 0,
            "faculty_count": 0,
            "assistant_count": 0,
            "dept_admin_count": 0,
            "admin_count": 0,
            "faculty_admin_count": 0
        }
    
    # Map results to output structure
    result = {
        "total_count": counts[0] or 0,
        "faculty_count": counts[1] or 0,
        "assistant_count": counts[2] or 0,
        "dept_admin_count": counts[3] or 0,
        "admin_count": counts[4] or 0,
        "faculty_admin_count": counts[5] or 0
    }
    
    print("SUCCESS")
    return result

def lambda_handler(event, context):
    return getAllUsersCount(event['arguments'])
