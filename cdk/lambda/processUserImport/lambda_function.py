import csv
import codecs
import boto3
import os
import psycopg2
import json
from datetime import datetime
from databaseConnect import get_connection

s3_client = boto3.client("s3")
sm_client = boto3.client('secretsmanager')
cognito_client = boto3.client('cognito-idp')
DB_PROXY_ENDPOINT = os.environ.get('DB_PROXY_ENDPOINT')
USER_POOL_ID = os.environ.get('USER_POOL_ID')

def addUserToDatabase(row, conn, cursor):
    """
    Returns 1 if user was added, 0 if user already exists or failed
    """
    try:
        # Check if user already exists
        cursor.execute("SELECT user_id FROM users WHERE cwl_username = %s", (row['cwl_username'],))
        existing_user = cursor.fetchone()
        
        if existing_user:
            print(f"User {row['cwl_username']} already exists, skipping")
            return 0

        # Insert new user
        cursor.execute("""
            INSERT INTO users (
                first_name, last_name, email, cwl_username, primary_department, role, primary_faculty, pending, approved
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            row['first_name'], 
            row['last_name'], 
            row['email'], 
            row['cwl_username'],
            row['department'], 
            row['role'], 
            row['faculty'],
            False,  # pending
            True   # approved
        ))
        
        conn.commit()
        print(f"Successfully added user: {row['email']}")
        return 1
        
    except Exception as e:
        print(f"Error adding user {row['email']}: {str(e)}")
        conn.rollback()
        return 0

def validate_row(row):
    """
    Validates that a row has all required fields
    """
    required_fields = ['first_name', 'last_name', 'email', 'department', 'role', 'faculty']
    for field in required_fields:
        if field not in row or not row[field] or row[field].strip() == '':
            return False, f"Missing or empty field: {field}"
    
    # Validate role
    valid_roles = ['Faculty', 'Assistant', 'Admin', 'DepartmentAdmin']
    if row['role'] not in valid_roles:
        return False, f"Invalid role: {row['role']}. Must be one of: {', '.join(valid_roles)}"
    
    # Basic email validation
    if '@' not in row['email']:
        return False, f"Invalid email format: {row['email']}"
        
    return True, ""

def lambda_handler(event, context):
    """
    Processes user import file uploaded to S3
    Expected file format: CSV with columns: first_name, last_name, email, department, role, institution
    """
    try:
        # Parse S3 event
        s3_event = event["Records"][0]["s3"]
        bucket_name = s3_event["bucket"]["name"]
        file_key = s3_event["object"]["key"]
        
        print(f"Processing user import file: {file_key} from bucket: {bucket_name}")
        
        # Download and process the CSV file
        data = s3_client.get_object(Bucket=bucket_name, Key=file_key)
        
        # Determine if it's CSV or Excel based on file extension
        if file_key.lower().endswith('.xlsx'):
            # For Excel files, we'd need pandas or openpyxl
            # For now, return an error asking for CSV format
            return {
                'statusCode': 400,
                'status': 'FAILED',
                'error': 'Excel files not yet supported. Please convert to CSV format.'
            }
        
        # Process CSV file
        table_rows = list(csv.DictReader(codecs.getreader("utf-8-sig")(data["Body"])))
        print(table_rows)
        
        # Connect to database
        connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
        cursor = connection.cursor()
        print("Connected to database")
        
        # Process each row
        rows_processed = 0
        rows_added_to_db = 0
        rows_added_to_cognito = 0
        errors = []
        
        for i, row in enumerate(table_rows):
            # Clean up row data (strip whitespace)
            row = {k: v.strip() if isinstance(v, str) else v for k, v in row.items()}
            
            # Validate row
            is_valid, error_message = validate_row(row)
            if not is_valid:
                errors.append(f"Row {i+2}: {error_message}")
                continue
            rows_processed += 1
            
            # Add to database
            if addUserToDatabase(row, connection, cursor):
                rows_added_to_db += 1
            else:
                errors.append(f"Row {i+2}: Failed to add to database")
        
        cursor.close()
        connection.close()
        
        # Clean up - delete the processed file
        s3_client.delete_object(Bucket=bucket_name, Key=file_key)
        
        result = {
            'statusCode': 200,
            'status': 'COMPLETED',
            'total_rows': len(table_rows),
            'rows_processed': rows_processed,
            'rows_added_to_database': rows_added_to_db,
            'rows_added_to_cognito': rows_added_to_cognito,
            'errors': errors[:10] if errors else []  # Limit to first 10 errors
        }
        
        print(f"User import completed: {result}")
        return result
        
    except Exception as e:
        print(f"Error processing user import: {str(e)}")
        return {
            'statusCode': 500,
            'status': 'FAILED',
            'error': str(e)
        }
