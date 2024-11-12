import boto3
import os
import psycopg2
from databaseConnect import get_connection

DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def filterKeysByDepartment(items, department):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    cursor.execute('SELECT user_id FROM users WHERE primary_department = %s OR secondary_department = %s', (department, department))
    results = cursor.fetchall()
    department_set = set()
    for result in results:
        department_set.add(result[0])
    filtered_results = []
    for item in items:
        key = item['Key']
        [cognition_id, user_id, template_id, file_name] = key.split('/')
        if user_id in department_set:
            filtered_results.append(item)
    return filtered_results

def getNumberOfGeneratedCVs(arguments):
    client = boto3.client('s3')
    response = client.list_objects_v2(Bucket=os.environ['BUCKET_NAME'])
    usersWithCvs = set()
    department = arguments['department'] if 'department' in arguments else None
    filtered_results = response['Contents'] if department == None else filterKeysByDepartment(response['Contents'], department)
    for item in filtered_results:
        if item['Key'].endswith('.pdf'):
            usersWithCvs.add(item['Key'][0:item['Key'].index('/')])
    return len(usersWithCvs)

def lambda_handler(event, context):
    return getNumberOfGeneratedCVs(event['arguments'])