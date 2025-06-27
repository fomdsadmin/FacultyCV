import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ.get('DB_PROXY_ENDPOINT')

def getPatentMatches(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()

    # Retrieve results with the same last name
    #cursor.execute('SELECT * FROM patents WHERE last_name = %s', (arguments['last_name'],))
    # cursor.execute('SELECT * FROM patents WHERE first_name = %s AND last_name = %s', (arguments['first_name'], arguments['last_name'],))
    cursor.execute('''
        SELECT * FROM patents 
        WHERE split_part(first_name, ' ', 1) = %s 
        AND split_part(last_name, ' ', 1) = %s
    ''', (arguments['first_name'].split()[0], arguments['last_name'].split()[0]))
    results_same_last = cursor.fetchall()
    cursor.execute('SELECT COUNT(*) FROM patents')
    count = cursor.fetchall()

    # Retrieve results with the same first name
    # cursor.execute('SELECT * FROM patents WHERE first_name = %s', (arguments['first_name'],))
    # print(arguments['first_name'])
    # results_same_first = cursor.fetchall()
    # print(results_same_first)
    # cursor.execute('SELECT * FROM patents')
    # column_names = [desc[0] for desc in cursor.description]
    # trying = cursor.fetchall()
    # print("Field Names:", column_names)
    # print(trying)
    # cursor.close()
    # connection.close()

    # Combine results in the specified order
    matches = []
    if len(results_same_last) > 0:
        for result in results_same_last:
            matches.append({
                'patent_id': result[0],
                'first_name': result[2],
                'last_name': result[3],
                'data_details': {
                    'title': result[1],
                    'first_name': result[2],
                    'last_name': result[3],
                    'publication_number': result[4],
                    'publication_date': result[5],
                    'family_number': result[6],
                    'country_code': result[7],
                    'kind_code': result[8],
                    'classification': result[9]
                }
            })

    # if len(results_same_first) > 0:
    #     for result in results_same_first:
    #         matches.append({
    #             'patent_id': result[0],
    #             'first_name': result[2],
    #             'last_name': result[3],
    #             'data_details': {
    #                 'title': result[1],
    #                 'first_name': result[2],
    #                 'last_name': result[3],
    #                 'publication_number': result[4],
    #                 'publication_date': result[5],
    #                 'family_number': result[6],
    #                 'country_code': result[7],
    #                 'kind_code': result[8],
    #                 'classification': result[9]
    #             }
    #         })

    return matches

def lambda_handler(event, context):
    return getPatentMatches(event['arguments'])
