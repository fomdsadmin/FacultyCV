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
    print(users)
    # print(users)
    if not users:
        return None
    return users[0]['Username']

def addUserToGroup(arguments):
    user_name = arguments['userName']
    user_pool_id = os.environ['USER_POOL_ID']
    user_group = arguments['userGroup']
    print(f"Username: {user_name}, User Pool ID: {user_pool_id}, User Group: {user_group}")

    cognito_username = get_sub_by_email(user_pool_id, user_name)
    # print(f"Cognito Username: {cognito_username}")

    try:
        client = boto3.client('cognito-idp')
        response = client.admin_list_groups_for_user(
            UserPoolId=user_pool_id,
            Username=cognito_username
        )
        groups = response['Groups']
        group_names = [g['GroupName'] for g in groups]

        # Remove from 'NewlyRegistered' if present
        if 'NewlyRegistered' in group_names:
            remove_resp = client.admin_remove_user_from_group(
                UserPoolId=user_pool_id,
                Username=cognito_username,
                GroupName='NewlyRegistered'
            )
            status = remove_resp.get('ResponseMetadata', {}).get('HTTPStatusCode', 500)
            if status != 200:
                print(f"Failed to remove from NewlyRegistered: {remove_resp}")
                return "FAILURE"
            print("Removed User from NewlyRegistered Group")

        # Check if user is already in the target group
        if user_group in group_names:
            return f'User already in group: {user_group}'

        add_resp = client.admin_add_user_to_group(
            UserPoolId=user_pool_id,
            Username=cognito_username,
            GroupName=user_group
        )
        status = add_resp.get('ResponseMetadata', {}).get('HTTPStatusCode', 500)
        if status == 200:
            print(add_resp)
            return "SUCCESS"
        else:
            print(f"Failed to add user to group: {add_resp}")
            return "FAILURE"
    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'error': str(e)
        }

def lambda_handler(event, context):
    return addUserToGroup(event['arguments'])
