import boto3
import base64
import http.client
import traceback
import os
import json
import urllib.request
from urllib.parse import unquote_plus
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
import signal

GOTENBERG_HOST = os.environ.get('GOTENBERG_HOST')
GOTENBERG_PATH = "/forms/chromium/convert/html"
FIXED_BOUNDARY = "----WebKitFormBoundary123456"
APPSYNC_ENDPOINT = os.environ.get('APPSYNC_ENDPOINT')

s3_client = boto3.client("s3")

def notify_generation_complete(pdf_key):
    """Call the GraphQL mutation to notify that generation is complete"""
    try:
        mutation = """
        mutation NotifyComplete($key: String!) {
            notifyGotenbergGenerationComplete(key: $key) {
                key
            }
        }
        """
        
        payload = {
            "query": mutation,
            "variables": {
                "key": pdf_key
            }
        }
        
        # Use IAM authentication instead of API key
        session = boto3.Session()
        credentials = session.get_credentials()
        region = session.region_name or 'ca-central-1'
        
        # Create the request
        data = json.dumps(payload)
        request = AWSRequest(
            method='POST',
            url=APPSYNC_ENDPOINT,
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        
        # Sign the request with IAM credentials
        SigV4Auth(credentials, 'appsync', region).add_auth(request)
        
        # Make the request using urllib
        req = urllib.request.Request(
            APPSYNC_ENDPOINT, 
            data=data.encode('utf-8'), 
            headers=dict(request.headers), 
            method='POST'
        )
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            print(f"Notification sent successfully: {result}")
            
    except Exception as e:
        print(f"Failed to send notification: {str(e)}")
        # Don't fail the entire function if notification fails

def timeout_handler(signum, frame):
    raise TimeoutError("Lambda function timed out")

def lambda_handler(event, context):
    pdf_key = None
    html_key = None
    bucket_name = None
    try:
        print("==== Incoming S3 Event ====")
        print(event)

        remaining_time = context.get_remaining_time_in_millis() / 1000.0
        timeout_buffer = 30  # 30 second buffer

        signal.signal(signal.SIGALRM, timeout_handler)
        signal.alarm(int(remaining_time - timeout_buffer))

        # Get S3 info from the event
        record = event['Records'][0]['s3']
        bucket_name = record['bucket']['name']
        html_key = unquote_plus(record['object']['key'])
        print(f"HTML file uploaded: s3://{bucket_name}/{html_key}")

        s3_client.put_object_tagging(
            Bucket=bucket_name,
            Key=html_key,
            Tagging={
                "TagSet": [
                    {"Key": "isPdfComplete", "Value": "false"}
                ]
            }
        )

        # Read HTML file from S3
        html_obj = s3_client.get_object(Bucket=bucket_name, Key=html_key)
        html_content = html_obj['Body'].read()
        print(f"Read HTML content, size: {len(html_content)} bytes")

        # Prepare multipart/form-data body for Gotenberg
        body = (
            f"--{FIXED_BOUNDARY}\r\n"
            f'Content-Disposition: form-data; name="files"; filename="index.html"\r\n'
            f"Content-Type: text/html\r\n\r\n"
        ).encode("utf-8") + html_content + f"\r\n--{FIXED_BOUNDARY}--\r\n".encode("utf-8")

        headers = {
            "Content-Type": f"multipart/form-data; boundary={FIXED_BOUNDARY}"
        }

        # Construct PDF path using new flat format
        filename = html_key.split("/")[-1].rsplit(".", 1)[0]  # usernameTemplateID
        pdf_key = f"pdf/{filename}.pdf"

        # Send request to Gotenberg
        conn = http.client.HTTPConnection(GOTENBERG_HOST, 80, timeout=60)
        conn.request("POST", GOTENBERG_PATH, body=body, headers=headers)
        response = conn.getresponse()
        pdf_bytes = response.read()

        if response.status != 200:
            print("Gotenberg error body:", pdf_bytes.decode("utf-8", errors="ignore"))
            raise Exception(f"Gotenberg conversion failed: {response.status}")

        print(f"Saving PDF to s3://{bucket_name}/{pdf_key}")

        # Upload PDF back to S3
        s3_client.put_object(Bucket=bucket_name, Key=pdf_key, Body=pdf_bytes, ContentType="application/pdf")
        print("PDF uploaded successfully!")

        # Add Tag to html object
        s3_client.put_object_tagging(
            Bucket=bucket_name,
            Key=html_key,
            Tagging={
                "TagSet": [
                    {"Key": "isPdfComplete", "Value": "true"}
                ]
            }
        )

        # Notify that generation is complete
        notify_generation_complete(pdf_key)

        return {
            "status": "SUCCESS",
            "pdf_key": pdf_key
        }

    except Exception as e:
        print("==== Exception Occurred ====")
        print("Type:", type(e).__name__)
        print("Message:", str(e))
        traceback.print_exc()
                # Add Tag to html object
        s3_client.put_object_tagging(
            Bucket=bucket_name,
            Key=html_key,
            Tagging={
                "TagSet": [
                    {"Key": "isPdfComplete", "Value": "error"}
                ]
            }
        )

        notify_generation_complete(pdf_key)

        return {
            "status": "ERROR",
            "message": str(e)
        }
