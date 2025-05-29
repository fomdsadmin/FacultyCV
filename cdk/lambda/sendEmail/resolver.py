import json
import boto3
import html

def getCredentials():
    sm_client = boto3.client('secretsmanager')
    credentials = {}
    try:
        secret_api_key = sm_client.get_secret_value(SecretId='support-form-email-config')
        secret_dict = json.loads(secret_api_key['SecretString'])
        credentials['source_email'] = secret_dict['source_email']
        credentials['destination_email'] = secret_dict['destination_email']
        return credentials
    except Exception as e:
        raise Exception(f"Failed to retrieve credentials: {str(e)}")

def format_html_body(user_name, user_email, body_text, image_data_urls=None):
    # Escape text
    safe_text = html.escape(body_text)
    html_text = safe_text.replace('\n', '<br>')
    
    images_html = ""
    if image_data_urls:
        for idx, image_data_url in enumerate(image_data_urls):
            images_html += f'<br><img src="{image_data_url}" alt="User Image {idx+1}" style="max-width:100%; height:auto; margin-top:15px;">'
    
    return f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <p>Username: {user_name}</p>
        <p>User email: {user_email}</p>
        <p></p>
        <p>{html_text}</p>
        <p> Image attachments:</p>
        <p></p>
        {images_html} 
      </body>
    </html>
    """
    
def send_email(user_name, user_email, from_email, to_email, subject, body, image_data_urls=None, reply_to=None):
    ses_client = boto3.client('ses', region_name='ca-central-1')
    html_body = format_html_body(user_name, user_email, body, image_data_urls)

    params = {
        'Source': from_email,
        'Destination': {'ToAddresses': [to_email]},
        'Message': {
            'Subject': {'Data': subject, 'Charset': 'UTF-8'},
            'Body': {
                'Text': {'Data': body, 'Charset': 'UTF-8'},
                'Html': {'Data': html_body, 'Charset': 'UTF-8'}
            }
        }
    }

    if reply_to:
        params['ReplyToAddresses'] = [reply_to]

    response = ses_client.send_email(**params)
    return response


def lambda_handler(event, context):
    credential_info = getCredentials()
    if not credential_info:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Failed to retrieve email configuration'})
        }

    source_email = credential_info['source_email']
    destination_email = credential_info['destination_email']
    
    try:
        user_email = event.get('email')
        user_name = event.get('name')
        user_message = event.get('message')
        image_data_urls = event.get('images', [])

        if not user_email or not user_name:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing name or email'})
            }

        # Send to your inbox
        send_email(
            user_name=user_name,
            user_email=user_email,
            from_email=source_email,
            to_email=destination_email,
            subject=f"Ticket submitted from {user_name}",
            body=user_message,
            image_data_urls=image_data_urls,
            reply_to=user_email
        )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Message sent successfully'})
        }

    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
