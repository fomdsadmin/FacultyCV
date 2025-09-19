import pandas as pd
import numpy as np
import boto3
import os
import psycopg2
import json
import io
from databaseConnect import get_connection

s3_client = boto3.client("s3")
sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ.get('DB_PROXY_ENDPOINT')

def cleanData(df):
    """
    Cleans the input DataFrame by performing various transformations for course catalog data.
    """
    # Ensure relevant columns are string type before using .str methods
    for col in ["Course", "Course Subject", "Course Number", "Academic Level", "Title", "Description", "Course Tags"]:
        if col in df.columns:
            df[col] = df[col].astype(str)

    # Clean and standardize column data
    df["course"] = df["Course"].fillna('').str.strip()
    df["course_subject"] = df["Course Subject"].fillna('').str.strip()
    df["course_number"] = df["Course Number"].fillna('').str.strip()
    df["academic_level"] = df["Academic Level"].fillna('').str.strip()
    df["course_title"] = df["Title"].fillna('').str.strip()
    df["course_description"] = df["Description"].fillna('').str.strip()
    df["course_tags"] = df["Course Tags"].fillna('').str.strip()

    # Filter out rows with missing essential data
    df = df[
        (df["course"] != '') & 
        (df["course"] != 'nan') &
        (df["course_subject"] != '') & 
        (df["course_subject"] != 'nan') &
        (df["course_number"] != '') & 
        (df["course_number"] != 'nan')
    ]

    # Keep only the cleaned columns
    df = df[["course", "course_subject", "course_number", "academic_level", "course_title", "course_description", "course_tags"]]

    # Replace NaN with empty string for all columns
    df = df.replace({np.nan: ''})
    
    return df

def storeData(df, connection, cursor, errors, rows_processed, rows_added_to_db):
    """
    Store the cleaned DataFrame into the course_catalog table.
    Returns updated rows_processed and rows_added_to_db.
    """
    for i, row in df.iterrows():
        try:
            # Check for duplicates based on course, subject, and number
            cursor.execute(
                "SELECT 1 FROM course_catalog WHERE course = %s AND course_subject = %s AND course_number = %s", 
                (row['course'], row['course_subject'], row['course_number'])
            )
            existing_row = cursor.fetchone()
            
            if existing_row:
                print(f"Duplicate found for: {row['course']} {row['course_subject']} {row['course_number']}")
                rows_processed += 1
                continue
            
            # Insert new course
            cursor.execute(
                """
                INSERT INTO course_catalog (
                    course, 
                    course_subject, 
                    course_number, 
                    academic_level,
                    course_title, 
                    course_description,
                    course_tags
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    row['course'],
                    row['course_subject'], 
                    row['course_number'],
                    row['academic_level'],
                    row['course_title'],
                    row['course_description'],
                    row['course_tags']
                )
            )
            rows_added_to_db += 1
            
        except Exception as e:
            errors.append(f"Error inserting row {i}: {str(e)}")
        finally:
            rows_processed += 1
            
    connection.commit()
    return rows_processed, rows_added_to_db

def lambda_handler(event, context):
    """
    Processes course catalog CSV file uploaded to S3
    Reads file with pandas, transforms with cleanData, and adds to database
    """
    try:
        bucket_name = os.environ.get('S3_BUCKET_NAME')
        key = 'user_data/course_catalog.csv'
        
        print(f"Processing course catalog file: {key} from bucket: {bucket_name}")
        
        # Get CSV data from S3
        data = s3_client.get_object(Bucket=bucket_name, Key=key)
        csv_content = data['Body'].read().decode('utf-8-sig')
        
        # Read CSV into pandas DataFrame
        df = pd.read_csv(io.StringIO(csv_content))
        print("Data loaded successfully.")
        
        # Clean column names (remove extra spaces, standardize)
        df.columns = df.columns.str.strip()
        
        # Log available columns for debugging
        print(f"Available columns: {list(df.columns)}")
        
        # Clean the DataFrame
        df = cleanData(df)
        print("Data cleaned successfully.")
        
        if df.empty:
            return {
                'statusCode': 200,
                'status': 'COMPLETED',
                'message': 'No valid data rows found after cleaning',
                'total_rows': 0,
                'rows_processed': 0,
                'rows_added_to_database': 0
            }
        
        # Connect to database
        connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
        cursor = connection.cursor()
        print("Connected to database")
        
        rows_processed = 0
        rows_added_to_db = 0
        errors = []
        
        # Store data using the cleaned DataFrame
        rows_processed, rows_added_to_db = storeData(df, connection, cursor, errors, rows_processed, rows_added_to_db)
        print("Data stored successfully.")
        
        cursor.close()
        connection.close()
        
        result = {
            'statusCode': 200,
            'status': 'COMPLETED',
            'total_rows': len(df),
            'rows_processed': rows_processed,
            'rows_added_to_database': rows_added_to_db,
            'errors': errors[:10] if errors else [],  # Limit to first 10 errors
            'columns_processed': list(df.columns)
        }
        
        print(f"Course catalog upload completed: {result}")
        return result
        
    except Exception as e:
        print(f"Error processing course catalog upload: {str(e)}")
        return {
            'statusCode': 500,
            'status': 'FAILED',
            'error': str(e)
        }