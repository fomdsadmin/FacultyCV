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
    
    # Simple filtering logic - handle undefined/null values
    department = arguments.get('department', '')
    faculty = arguments.get('faculty', '')

    print("Received department:", department)
    print("Received faculty:", faculty)

    params = []
    
    # Only filter if department is provided and not "All"
    if department and department != "All":
        query = f"""
            SELECT 
                COUNT(*) as total_count,
                COUNT(CASE WHEN role = 'Faculty' THEN 1 END) as faculty_count,
                COUNT(CASE WHEN role = 'Assistant' THEN 1 END) as assistant_count,
                COUNT(CASE WHEN role LIKE 'Admin-%' THEN 1 END) as dept_admin_count,
                COUNT(CASE WHEN role = 'Admin' THEN 1 END) as admin_count,
                COUNT(CASE WHEN role LIKE 'FacultyAdmin-%' THEN 1 END) as faculty_admin_count
            FROM users WHERE primary_department = %s
        """
        params.append(department)
        cursor.execute(query, params)
    elif faculty and faculty != "All":
        query = f"""
            SELECT 
                COUNT(*) as total_count,
                COUNT(CASE WHEN role = 'Faculty' THEN 1 END) as faculty_count,
                COUNT(CASE WHEN role = 'Assistant' THEN 1 END) as assistant_count,
                COUNT(CASE WHEN role LIKE 'Admin-%' THEN 1 END) as dept_admin_count,
                COUNT(CASE WHEN role = 'Admin' THEN 1 END) as admin_count,
                COUNT(CASE WHEN role LIKE 'FacultyAdmin-%' THEN 1 END) as faculty_admin_count
            FROM users WHERE primary_faculty = %s
        """
        params.append(faculty)
        cursor.execute(query, params)
    else:
        # Single query to get all counts
        query = f"""
            SELECT 
                COUNT(*) as total_count,
                COUNT(CASE WHEN role = 'Faculty' THEN 1 END) as faculty_count,
                COUNT(CASE WHEN role = 'Assistant' THEN 1 END) as assistant_count,
                COUNT(CASE WHEN role LIKE 'Admin-%' THEN 1 END) as dept_admin_count,
                COUNT(CASE WHEN role = 'Admin' THEN 1 END) as admin_count,
                COUNT(CASE WHEN role LIKE 'FacultyAdmin-%' THEN 1 END) as faculty_admin_count
            FROM users 
        """

    cursor.execute(query)
    counts = cursor.fetchall()[0]
    
    cursor.close()
    connection.close()
    
    # Convert to safe values (handle None)
    counts = [count if count is not None else 0 for count in counts]
    
    result = {
        "total_count": counts[0],
        "faculty_count": counts[1],
        "assistant_count": counts[2],
        "dept_admin_count": counts[3],
        "admin_count": counts[4],
        "faculty_admin_count": counts[5]
    }
    
    return result

def lambda_handler(event, context):
    return getAllUsersCount(event['arguments'])
