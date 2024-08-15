import os
import json
import boto3

def addUserToGroup(arguments):
    user_name = arguments['userName']
    user_pool_id = os.environ['USER_POOL_ID']
    user_group = arguments['userGroup']

    try:
        client = boto3.client('cognito-idp')
        response = client.admin_add_user_to_group(
            UserPoolId=user_pool_id,
            Username=user_name,
            GroupName=user_group
        )
        return response
    except Exception as e:
        return {
            'statusCode': 500,
            'error': str(e)
        }

def lambda_handler(event, context):
    return addUserToGroup(event['arguments'])
