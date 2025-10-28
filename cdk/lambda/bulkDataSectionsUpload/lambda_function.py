import csv
import codecs
import boto3
import os
import psycopg2
import json
from databaseConnect import get_connection

s3_client = boto3.client("s3")
sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ.get('DB_PROXY_ENDPOINT')

def writeRowToDB(row, conn, cursor):
    cursor.execute("SELECT 1 FROM data_sections WHERE title = %s AND description = %s AND data_type = %s", (row['title'], row['description'], row['data_type']))
    existing_row = cursor.fetchone()
    if existing_row:
        return 0
    
    # Convert attributes and attributes_type to proper JSON format
    def ensure_json(value):
        if not value or value == '':
            return json.dumps({})
        try:
            # Try to parse as JSON first
            json.loads(value)
            return value  # Already valid JSON
        except (json.JSONDecodeError, ValueError):
            # Not valid JSON, wrap it as a JSON string
            return json.dumps(value)
    
    query = """
    INSERT INTO data_sections (
        title, 
        description, 
        data_type, 
        attributes,
        archive, 
        attributes_type,
        info
    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    
    # Handle archive as boolean
    archive_val = row.get('archive', 'false')
    if isinstance(archive_val, str):
        archive_bool = archive_val.lower() in ['true', 't', '1', 'yes']
    else:
        archive_bool = bool(archive_val)
    
    values = (
        row['title'], 
        row['description'], 
        row['data_type'], 
        ensure_json(row.get('attributes', '')),
        archive_bool,
        ensure_json(row.get('attributes_type', '')),
        row.get('info', '')
    )
    cursor.execute(query, values)
    conn.commit()
    return 1

def lambda_handler(event, context):
    bucket_name = os.environ.get('S3_BUCKET_NAME')
    key = 'user_data/data_sections.csv' 
    data = s3_client.get_object(Bucket=bucket_name, Key=key)
    # Use DictReader to handle column names
    table_rows = list(csv.DictReader(codecs.getreader("utf-8-sig")(data["Body"])))
    rows_written = 0
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    cursor = connection.cursor()
    for row in table_rows:
        rows_written += writeRowToDB(row, connection, cursor)
    
    cursor.close()
    connection.close()
    
    return {
        'status': 'SUCCEEDED',
        'rows_read': len(table_rows),
        'new_rows_written': rows_written,
        'invalid_rows': len(table_rows) - rows_written
    }