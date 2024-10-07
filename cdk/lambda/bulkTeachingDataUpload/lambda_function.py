import csv
import codecs
import boto3
import os
import psycopg2
import json

s3_client = boto3.client("s3")
sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ.get('DB_PROXY_ENDPOINT')


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
    # Check for duplicates
    cursor.execute("SELECT 1 FROM teaching_data WHERE institution_user_id = %s AND year = %s AND session = %s AND course = %s", (row[10], row[0], row[1], row[2]))
    existing_row = cursor.fetchone()
    if existing_row:
        return 0
    query = """
    INSERT INTO teaching_data (
        year, 
        session, 
        course, 
        description, 
        scheduled_hours,
        class_size,
        lectures, 
        tutorials, 
        labs, 
        other, 
        institution_user_id 
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    cursor.execute(query, (row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9], row[10]))
    conn.commit()
    return 1

'''
Fetches a .csv file of teaching data from S3. Filters out data that already exists in the database.
Puts the filtered data into the DB.
Requires no input
'''
def lambda_handler(event, context):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=DB_PROXY_ENDPOINT, database=credentials['db'])
    cursor = connection.cursor()
    rows_written = 0
    bucket_name = os.environ.get('S3_BUCKET_NAME')
    key = 'user_data/teaching_data.csv'
    data = s3_client.get_object(Bucket=bucket_name, Key=key)
    table_rows = list(csv.DictReader(codecs.getreader("utf-8-sig")(data["Body"]))) 
    for row in table_rows:
        values = []
        for key in row.keys():
            values.append(row[key])
        rows_written += writeRowToDB(values, connection, cursor)    
    cursor.close()
    connection.close()
    
    return {
        'status': 'SUCCEEDED',
        'rows_read': len(table_rows),
        'new_rows_written': rows_written,
        'invalid_rows': len(table_rows) - rows_written
    }