import csv
import codecs
import boto3
import os
import psycopg2
import json

s3_client = boto3.client("s3")
sm_client = boto3.client('secretsmanager')


'''
This function retrieves the database credentials from AWS Secrets Manager using the secret ID 'facultyCV/credentials/dbCredentials'.
It then returns a dictionary containing the username, password, host, and database name.
'''
def getCredentials():
    credentials = {}

    response = sm_client.get_secret_value(SecretId='facultyCV/credentials/dbCredentials')
    secrets = json.loads(response['SecretString'])
    credentials['username'] = secrets['username']
    credentials['password'] = secrets['password']
    credentials['host'] = secrets['host']
    credentials['db'] = secrets['dbname']
    return credentials

def writeRowToDB(row, conn, cursor):
    cursor.execute("SELECT 1 FROM data_sections WHERE title = %s AND description = %s AND data_type = %s", (row[0], row[1], row[2]))
    existing_row = cursor.fetchone()
    if existing_row:
        return 0
    query = """
    INSERT INTO data_sections (
        title, 
        description, 
        data_type, 
        attributes
    ) VALUES (%s, %s, %s, %s)
    """
    values = (row[0], row[1], row[2], row[3])
    cursor.execute(query, values)
    conn.commit()
    return 1

def lambda_handler(event, context):
    bucket_name = os.environ.get('S3_BUCKET_NAME')
    key = 'user_data/data_sections.csv' 
    data = s3_client.get_object(Bucket=bucket_name, Key=key)
    table_rows = list(csv.reader(codecs.getreader("utf-8-sig")(data["Body"])))
    table_rows = table_rows[1:]  # Skip the first row
    credentials = getCredentials()
    rows_written = 0
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
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