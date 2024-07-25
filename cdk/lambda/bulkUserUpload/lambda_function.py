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
    cursor.execute("SELECT 1 FROM users WHERE institution_user_id = %s", (row[3],))
    existing_row = cursor.fetchone()
    if existing_row:
        return 0
    query = """
    INSERT INTO users (
        first_name, 
        last_name, 
        preferred_name, 
        email, 
        role,
        bio,
        rank, 
        primary_department, 
        secondary_department, 
        primary_faculty, 
        secondary_faculty, 
        campus, 
        keywords, 
        institution_user_id, 
        scopus_id, 
        orcid_id
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    values = (row[0], row[1], row[2], row[4], "", "", row[17], row[6], row[8], row[10], row[12], row[14], "", row[3], "", "")
    cursor.execute(query, values)
    conn.commit()
    return 1

'''
Fetches a .csv file of HR data from S3, removes all researchers with irrelevant ranks and
filters out users that already exist in the database.
Puts the filtered data into the DB.
Requires no input
'''
def lambda_handler(event, context):
    # Researchers with these ranks are kept
    ranks = ['Acting Assistant Professor (tenure-track)', 'Adjunct Professor', 'Affiliate Assistant Professor', 
         'Affiliate Associate Professor', 'Affiliate Instructor', 'Affiliate Professor', 'Affiliate Professor of Teaching', 
         'Affiliate Senior Instructor', 'Assistant Professor', 'Assistant Professor (grant tenure-track)', 
         'Assistant Professor (grant tenure)', 'Assistant Professor (part-time)', 'Assistant Professor (Partner)', 
         'Assistant Professor (tenure-track)', 'Assistant Professor (tenure)', 
         'Assistant Professor of Teaching', 'Assistant Professor of Teaching (grant tenure-track)', 
         'Assistant Professor of Teaching (part-time)', 'Assistant Professor of Teaching (tenure-track)', 
         'Associate Professor', 'Associate Professor (grant tenure)', 
         'Associate Professor (part-time)', 'Associate Professor (Partner)', 'Associate Professor (tenure-track)', 
         'Associate Professor (tenure)', 'Associate Professor of Teaching', 
         'Clinical Assistant Professor', 'Clinical Associate Professor', 'Clinical Professor', 'Lecturer', 
         'Postdoctoral Research Fellow', 'Postdoctoral Teaching Fellow', 'Professor', 'Professor (grant-tenure)', 
         'Professor (part-time)', 'Professor (Partner)', 'Professor (tenure-track)', 
         'Professor (tenure)', 'Professor Emeritus', 'Professor of Teaching', 'Professor without review', 
         'Professor, University Killam', 'Research Associate']
    for i in range (len(ranks)):
        ranks[i] = ranks[i].replace(' ', '')
    bucket_name = os.environ.get('S3_BUCKET_NAME')
    key = 'user_data/institution_data.csv' 
    data = s3_client.get_object(Bucket=bucket_name, Key=key)
    table_rows = list(csv.DictReader(codecs.getreader("utf-8-sig")(data["Body"])))
    credentials = getCredentials()
    rows_written = 0
    for row in table_rows:
        # remove all spaces from the rank
        rank = row['PRIMARY_ACADEMIC_RANK'].replace(' ', '')

        # if the rank is in the list of ranks, write the row to the DB
        if rank in ranks:
            del row['SNAPSHOT_DATE']

            first_name = row['PREFERRED_FIRST_NAME']
            last_name = row['PREFERRED_LAST_NAME']
            keys = list(row.keys())
            values = []
            for key in keys:
                values.append(row[key])
            values.append(first_name)
            values.append(last_name)
            connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
            cursor = connection.cursor()
            rows_written += writeRowToDB(values, connection, cursor)
    
    cursor.close()
    connection.close()
    
    return {
        'status': 'SUCCEEDED',
        'rows_read': len(table_rows),
        'new_rows_written': rows_written,
        'invalid_rows': len(table_rows) - rows_written
    }