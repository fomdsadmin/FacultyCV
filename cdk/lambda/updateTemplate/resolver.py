import boto3
import json
import psycopg2
import os
import time

sm_client = boto3.client('secretsmanager')
dynamodb = boto3.client('dynamodb')

def getCredentials():
    credentials = {}

    response = sm_client.get_secret_value(SecretId='facultyCV/credentials/dbCredentials')
    secrets = json.loads(response['SecretString'])
    credentials['username'] = secrets['username']
    credentials['password'] = secrets['password']
    credentials['host'] = secrets['host']
    credentials['db'] = secrets['dbname']
    return credentials

def updateDynamoDBKeys(template_id):
    # First fetch all the keys that contain the template_id
    response = dynamodb.scan(TableName=os.environ['TABLE_NAME'], FilterExpression='contains(#keyName, :substr)', ExpressionAttributeNames={'#keyName': 'logEntryId'}, ExpressionAttributeValues={':substr': {'S': template_id}})
    items = response['Items']
    all_items = []
    for item in items:
        all_items.append(item)
    while 'LastEvaluatedKey' in response:
        response = dynamodb.scan(TableName=os.environ['TABLE_NAME'], FilterExpression='contains(#keyName, :substr)', ExpressionAttributeNames={'#keyName': 'logEntryId'}, ExpressionAttributeValues={':substr': {'S': template_id}}, ExclusiveStartKey=response['LastEvaluatedKey'])
        items = response.get('Items')
        for item in items:
            all_items.append(item)

    # Then update each item with containing template_id to the current timestamp
    for item in all_items:
        key = item['logEntryId']['S']
        user_logs = {
            'logEntryId': {'S': key},
            'timestamp': {'N': f"{int(time.time())}"}
        }
        dynamodb.put_item(TableName=os.environ['TABLE_NAME'], Item=user_logs)

def updateTemplate(arguments):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    print("Connected to database")
    cursor = connection.cursor()

    # Prepare the UPDATE query
    query = """
    UPDATE templates SET 
        title = %s,
        data_section_ids = %s,
        start_year = %s,
        end_year = %s
    WHERE template_id = %s
    """

    # Execute the query with the provided arguments
    cursor.execute(query, (
        arguments['title'] if 'title' in arguments else '',
        arguments['data_section_ids'] if 'data_section_ids' in arguments else '',
        arguments['start_year'] if 'start_year' in arguments else '',
        arguments['end_year'] if 'end_year' in arguments else '',
        arguments['template_id']
    ))

    cursor.close()
    connection.commit()
    connection.close()
    updateDynamoDBKeys(arguments['template_id'])
    return "SUCCESS"

def lambda_handler(event, context):
    return updateTemplate(event['arguments'])
