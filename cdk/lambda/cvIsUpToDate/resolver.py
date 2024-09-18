import boto3
import psycopg2
import os
from datetime import datetime

dynamodb = boto3.client('dynamodb')
s3 = boto3.client('s3')

def get_last_modified_timestamp(bucket_name, object_key):
    try:
        response = s3.head_object(Bucket=bucket_name, Key=object_key)
        return datetime.timestamp(response['LastModified'])
    except Exception as e:
        print(f"Error getting last modified timestamp: {e}")
        return None
    
def get_dynamodb_item(cognito_user_id, template_id=None):
    try:
        response = None
        if template_id is not None:
            response = dynamodb.get_item(Key={"logEntryId": {"S": f"{cognito_user_id}/{template_id}"}}, TableName=os.environ['TABLE_NAME'])
        else:
            response = dynamodb.get_item(Key={"logEntryId": {"S": f"{cognito_user_id}"}}, TableName=os.environ['TABLE_NAME'])
        item = response.get('Item')
        return item
    except Exception as e:
        print(f"Error getting item from DynamoDB: {e}")
        return None
  
def lambda_handler(event, context):
    template_id = event['arguments']['template_id']
    cognito_user_id = event['arguments']['cognito_user_id']
    # First get the timestamp of when the last PDF was generated
    last_modified_timestamp = get_last_modified_timestamp(os.environ['BUCKET_NAME'], f"{cognito_user_id}/{template_id}/resume.pdf")
    if last_modified_timestamp is None:
        return False
    # Then get the timestamp of last update from DynamoDB
    # First check the key cognito_user_id (for changes to the CV headers)
    dynamodb_item_user = get_dynamodb_item(cognito_user_id)
    if dynamodb_item_user is None:
        # If last_modified_timestamp is None, then the PDF has not been generated yet, so we can generate it
        if last_modified_timestamp is None:
            return False
        else:
            # In this case, the PDF has been generated for the first time, there is no dynamoDB log yet, so there have been no updates
            return True
    dynamodb_timestamp = int(dynamodb_item_user["timestamp"]['N'])
    if dynamodb_timestamp > last_modified_timestamp:
        return False
    
    dynamodb_item_template = get_dynamodb_item(cognito_user_id, template_id)
    if dynamodb_item_template is None:
        # If last_modified_timestamp is None, then the PDF has not been generated yet, so we can generate it
        if last_modified_timestamp is None:
            return False
        else:
            # In this case, the PDF has been generated for the first time, there is no dynamoDB log yet, so there have been no updates
            return True
    dynamodb_timestamp = int(dynamodb_item_template["timestamp"]['N'])
    print(f"Comparing: {dynamodb_timestamp} and {last_modified_timestamp}")
    # Compare the two timestamps
    if dynamodb_timestamp <= last_modified_timestamp:
        return True
    else:
        return False
