import boto3

def lambda_handler(event, context):
    client = boto3.client('cognito-idp')

    try:
        response = client.admin_add_user_to_group(
            UserPoolId=event['userPoolId'],
            Username=event['userName'],
            GroupName='NewlyRegistered'
        )
        print(f"User {event['userName']} added to group 'NewlyRegistered'")
    except Exception as e:
        print(f"Error adding user to group: {str(e)}")

    return event
