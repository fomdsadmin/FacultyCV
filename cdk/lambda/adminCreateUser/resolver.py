import os
import json
import boto3
from datetime import datetime
import secrets
import string

def generate_temporary_password(length=12):
    """Generate a secure temporary password"""
    # Password must meet Cognito requirements: uppercase, lowercase, number, special char
    uppercase = string.ascii_uppercase
    lowercase = string.ascii_lowercase
    digits = string.digits
    special_chars = "!@#$%^&*"
    
    # Ensure at least one character from each category
    password = [
        secrets.choice(uppercase),
        secrets.choice(lowercase),
        secrets.choice(digits),
        secrets.choice(special_chars)
    ]
    
    # Fill the rest with random characters
    all_chars = uppercase + lowercase + digits + special_chars
    for _ in range(length - 4):
        password.append(secrets.choice(all_chars))
    
    # Shuffle the password
    secrets.SystemRandom().shuffle(password)
    return ''.join(password)

def adminCreateUser(arguments):
    """Create a user in Cognito using admin APIs with temporary password"""
    email = arguments['email']
    first_name = arguments['first_name']
    last_name = arguments['last_name']
    role = arguments['role']
    
    user_pool_id = os.environ['USER_POOL_ID']
    
    try:
        client = boto3.client('cognito-idp')
        
        # Generate temporary password
        temp_password = generate_temporary_password()
        
        # Create user in Cognito
        response = client.admin_create_user(
            UserPoolId=user_pool_id,
            Username=email,
            UserAttributes=[
                {
                    'Name': 'email',
                    'Value': email
                },
                {
                    'Name': 'email_verified',
                    'Value': 'true'
                },
                {
                    'Name': 'given_name',
                    'Value': first_name
                },
                {
                    'Name': 'family_name',
                    'Value': last_name
                }
            ],
            TemporaryPassword=temp_password,
            MessageAction='SUPPRESS'  # SUPPRESS: Don't send email, remove for default (send cognito email automatically)
        )
        
        # Add user to appropriate group
        if role.startswith("Admin-"):
            # Add to DepartmentAdmin group
            client.admin_add_user_to_group(
                UserPoolId=user_pool_id,
                Username=email,
                GroupName='DepartmentAdmin'
            )
            # Also add to Faculty group for department admins
            client.admin_add_user_to_group(
                UserPoolId=user_pool_id,
                Username=email,
                GroupName='Faculty'
            )
        else:
            # Add to specific role group
            client.admin_add_user_to_group(
                UserPoolId=user_pool_id,
                Username=email,
                GroupName=role
            )
        
        return {
            'statusCode': 200,
            'message': 'User created successfully',
            'username': email,
            'temporaryPassword': temp_password,
            'userStatus': response['User']['UserStatus']
        }
        
    except client.exceptions.UsernameExistsException:
        return {
            'statusCode': 400,
            'error': 'User already exists'
        }
    except Exception as e:
        print(f"Error creating user: {str(e)}")
        return {
            'statusCode': 500,
            'error': str(e)
        }

def lambda_handler(event, context):
    return adminCreateUser(event['arguments'])
