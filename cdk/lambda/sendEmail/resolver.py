import json
import boto3
from datetime import datetime
import base64
import html
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication

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

def send_raw_email(from_email, to_email, subject, body_text, body_html, attachments, reply_to=None):
    msg = MIMEMultipart("mixed")
    msg['Subject'] = subject
    msg['From'] = from_email
    msg['To'] = to_email
    if reply_to:
        msg.add_header('Reply-To', reply_to)

    alt_part = MIMEMultipart("alternative")
    alt_part.attach(MIMEText(body_text, 'plain', 'utf-8'))
    alt_part.attach(MIMEText(body_html, 'html', 'utf-8'))
    msg.attach(alt_part)

    for att in attachments:
        name = att.get("name")
        base64_data = att.get("content", "")
        file_bytes = base64.b64decode(base64_data)
        mime_type = att.get("type", "application/octet-stream")
        maintype, subtype = mime_type.split("/", 1)
        part = MIMEApplication(file_bytes, _subtype=subtype)
        part.add_header('Content-Disposition', 'attachment', filename=name)
        msg.attach(part)

    ses = boto3.client('ses', region_name='ca-central-1')
    response = ses.send_raw_email(
        Source=from_email,
        Destinations=[to_email],
        RawMessage={'Data': msg.as_string()}
    )
    return response

def format_html_body(user_name, user_email, user_subject, user_problemType, message):
    safe_text = html.escape(message).replace("\n", "<br>")
    return f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <p><strong>Name:</strong> {html.escape(user_name)}</p>
        <p><strong>Email:</strong> {html.escape(user_email)}</p>
        <p><strong>Problem Type:</strong> {html.escape(user_problemType)}</p>
        <p><strong>Message:</strong><br>{safe_text}</p>
      </body>
    </html>
    """

# CORS headers to include in every response
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'OPTIONS,POST'
}

def lambda_handler(event, context):
    creds = getCredentials()
    from_email = creds['source_email']
    to_email = creds['destination_email']
    print(event)

    try:
        body = json.loads(event['body'])

        user_name = body.get('name')
        user_email = body.get('email')
        user_message = body.get('message')
        user_subject = body.get('subject')
        user_problem_type = body.get('problemType')
        attachments = body.get('attachments', [])

        if not user_name or not user_email:
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'Missing name or email'})
            }

        html_body = format_html_body(user_name, user_email, user_subject, user_problem_type, user_message)
        today_str = datetime.today().strftime("%B %d, %Y")

        send_raw_email(
            from_email=from_email,
            to_email=to_email,
            subject=f"Faculty 360 Query: From {user_name} - Date {today_str}",
            body_text=user_message,
            body_html=html_body,
            attachments=attachments,
            reply_to=user_email
        )

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({'message': 'Message sent with attachments'})
        }

    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
