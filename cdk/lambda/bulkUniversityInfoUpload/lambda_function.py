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
    cursor.execute("SELECT 1 FROM university_info WHERE type = %s AND value = %s", (row[0], row[1]))
    existing_row = cursor.fetchone()
    if existing_row:
        return 0
    query = """
    INSERT INTO university_info (type, value) VALUES (%s, %s)
    """
    values = (row[0], row[1])
    cursor.execute(query, values)
    conn.commit()
    return 1

def lambda_handler(event, context):
    bucket_name = os.environ.get('S3_BUCKET_NAME')
    key = 'user_data/university_info.csv' 
    data = s3_client.get_object(Bucket=bucket_name, Key=key)
    table_rows = list(csv.reader(codecs.getreader("utf-8-sig")(data["Body"])))
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