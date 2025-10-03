import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ.get('DB_PROXY_ENDPOINT')

def getAllCourseCatalogInfo(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()
    cursor.execute('SELECT course, course_title, academic_level, course_description FROM course_catalog')
    results = cursor.fetchall()
    cursor.close()
    connection.close()
    course_catalog_info = []
    for result in results:
        course_catalog_info.append({
            'course': result[0],
            'course_title': result[1],
            'academic_level': result[2],
            'course_description': result[3],
        })
    return course_catalog_info

def lambda_handler(event, context):
    return getAllCourseCatalogInfo(event['arguments'])