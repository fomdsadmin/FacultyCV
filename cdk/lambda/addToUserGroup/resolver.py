import os
import json
import boto3

def get_sub_by_email(user_pool_id, username):
    client = boto3.client('cognito-idp')
    response = client.list_users(
        UserPoolId=user_pool_id,
        Filter=f'name = "{username}"'
    )
    users = response.get('Users', [])
    # print(users)
    if not users:
        return None
    for attr in users[0]['Attributes']:
        if attr['Name'] == 'sub':
            return attr['Value']
    return None

def addUserToGroup(arguments):
    user_name = arguments['userName']
    user_pool_id = os.environ['USER_POOL_ID']
    user_group = arguments['userGroup']

    sub_id = get_sub_by_email(user_pool_id, user_name)

    try:
        client = boto3.client('cognito-idp')
        response = client.admin_list_groups_for_user(
            UserPoolId=user_pool_id,
            Username=sub_id
        )
        groups = response['Groups']
        group_names = [g['GroupName'] for g in groups]
        # Remove from 'NewlyRegistered' if present
        if 'NewlyRegistered' in group_names:
            client.admin_remove_user_from_group(
                UserPoolId=user_pool_id,
                Username=sub_id,
                GroupName='NewlyRegistered'
            )
        # Check if user is already in the target group
        if user_group in group_names:
            return f'User already in group {user_group}'
        response = client.admin_add_user_to_group(
            UserPoolId=user_pool_id,
            Username=sub_id,
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
