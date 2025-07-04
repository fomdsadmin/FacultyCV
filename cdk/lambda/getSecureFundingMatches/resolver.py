import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def getSecureFundingMatches(arguments):
    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()

    # Retrieve results with the same last name
    #cursor.execute('SELECT * FROM grants WHERE last_name = %s', (arguments['last_name'],))
    # cursor.execute('SELECT * FROM grants WHERE first_name = %s AND last_name = %s', (arguments['first_name'], arguments['last_name']))
    cursor.execute('''
        SELECT * FROM grants
        WHERE split_part(first_name, ' ', 1) = %s 
        AND split_part(last_name, ' ', 1) = %s
    ''', (arguments['first_name'].split()[0], arguments['last_name'].split()[0]))
    results_same_last = cursor.fetchall()
    
    # Retrieve results with the same first name
    # cursor.execute('SELECT * FROM grants WHERE first_name = %s', (arguments['first_name'],))
    # results_same_first = cursor.fetchall()

    cursor.close()
    connection.close()

    # Combine results in the specified order
    matches = []

    if len(results_same_last) > 0:
        for result in results_same_last:
            matches.append({
                'secure_funding_id': result[0],
                'first_name': result[1],
                'last_name': result[2],
                'data_details': {
                    'first_name': result[1],
                    'last_name': result[2],
                    'keywords': result[3],
                    'agency': result[4],
                    'department': result[5],
                    'program': result[6],
                    'title': result[7],
                    'amount': result[8],
                    'dates': result[9]
                }
            })

    # if len(results_same_first) > 0:
        # for result in results_same_first:
            # matches.append({
                # 'secure_funding_id': result[0],
                # 'first_name': result[1],
                # 'last_name': result[2],
                # 'data_details': {
                    # 'first_name': result[1],
                    # 'last_name': result[2],
                    # 'keywords': result[3],
                    # 'agency': result[4],
                    # 'department': result[5],
                    # 'program': result[6],
                    # 'title': result[7],
                    # 'amount': result[8],
                    # 'dates': result[9]
                # }
            # })

    return matches

def lambda_handler(event, context):
    return getSecureFundingMatches(event['arguments'])