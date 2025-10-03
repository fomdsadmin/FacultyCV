import boto3
import botocore
import os
import json
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
from pdf2docx import Converter
from urllib.parse import unquote_plus
import multiprocessing

s3_client = boto3.client("s3")

# Environment variables for AppSync
APPSYNC_ENDPOINT = os.environ.get('APPSYNC_ENDPOINT')

def notify_docx_complete(docx_key):
    """Call the GraphQL mutation to notify that DOCX conversion is complete"""
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
                "key": docx_key
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
        import urllib.request
        req = urllib.request.Request(
            APPSYNC_ENDPOINT, 
            data=data.encode('utf-8'), 
            headers=dict(request.headers), 
            method='POST'
        )
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            print(f"DOCX notification sent successfully: {result}")
            
    except Exception as e:
        print(f"Failed to send DOCX notification: {str(e)}")
        # Don't fail the entire function if notification fails

def download_file_from_s3(bucket_name, s3_file_key, local_file_path):
    try:
        s3_client.download_file(bucket_name, s3_file_key, local_file_path)
        print(f"Downloaded {s3_file_key} from {bucket_name} to {local_file_path}")
    except botocore.exceptions.ClientError as e:
        print(f"Error downloading file: {e}")
        raise e

def convert_pdf_to_docx(input_pdf, output_docx):
    try:
        cv = Converter(input_pdf)
        cv.convert(output_docx)
        cv.close()
        print(f"Converted {input_pdf} to {output_docx}")
    except Exception as e:
        print(f"Error converting PDF to DOCX: {e}")
        raise e

def upload_file_to_s3(file_name, bucket_name, s3_file_key):
    try:
        s3_client.upload_file(file_name, bucket_name, s3_file_key)
        print(f"Uploaded {file_name} to s3://{bucket_name}/{s3_file_key}")
    except botocore.exceptions.ClientError as e:
        print(f"Error uploading file: {e}")
        raise e

def alarm_process(timeout_seconds, bucket_name, pdf_key, docx_key):
    """Run alarm in separate process and send timeout notification"""
    import time
    import boto3
    import json
    from botocore.auth import SigV4Auth
    from botocore.awsrequest import AWSRequest
    import urllib.request
    
    time.sleep(timeout_seconds)
    
    print(f"TIMEOUT ALARM: Sending timeout notification after {timeout_seconds} seconds")
    
    try:
        # Tag as error
        s3_client = boto3.client("s3")
        s3_client.put_object_tagging(
            Bucket=bucket_name,
            Key=pdf_key,
            Tagging={'TagSet': [{'Key': 'isDocxComplete', 'Value': 'error'}]}
        )
        print(f"TIMEOUT ALARM: Tagged PDF with timeout error: {pdf_key}")
        
        # Send notification
        APPSYNC_ENDPOINT = os.environ.get('APPSYNC_ENDPOINT')
        mutation = """
        mutation NotifyComplete($key: String!) {
            notifyGotenbergGenerationComplete(key: $key) {
                key
            }
        }
        """
        
        payload = {
            "query": mutation,
            "variables": {"key": docx_key}
        }
        
        session = boto3.Session()
        credentials = session.get_credentials()
        region = session.region_name or 'ca-central-1'
        
        data = json.dumps(payload)
        request = AWSRequest(
            method='POST',
            url=APPSYNC_ENDPOINT,
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        
        SigV4Auth(credentials, 'appsync', region).add_auth(request)
        
        req = urllib.request.Request(
            APPSYNC_ENDPOINT, 
            data=data.encode('utf-8'), 
            headers=dict(request.headers), 
            method='POST'
        )
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            print(f"TIMEOUT ALARM: Notification sent successfully: {result}")
            
    except Exception as e:
        print(f"TIMEOUT ALARM: Failed to send notification: {str(e)}")

def handler(event, context):
    bucket_name = None
    pdf_key = None
    docx_key = None
    alarm_proc = None
    
    try:
        remaining_time = context.get_remaining_time_in_millis() / 1000.0
        timeout_buffer = 30  # 30 second buffer
        alarm_timeout = remaining_time - timeout_buffer

        # Use /tmp/ as writable directory
        os.chdir("/tmp/")
        
        # Clean up previous temp files
        for file in ["input.pdf", "output.docx"]:
            if os.path.exists(file):
                os.remove(file)
                print(f"Removed existing {file}")

        # Get bucket and key from S3 event
        record = event['Records'][0]['s3']
        bucket_name = record['bucket']['name']
        pdf_key = unquote_plus(record['object']['key'])

        # Construct DOCX key: replace 'pdf/' with 'docx/' and .pdf → .docx
        docx_key = pdf_key.replace("pdf/", "docx/").rsplit(".", 1)[0] + ".docx"

        # Start alarm process that will send timeout notification
        alarm_proc = multiprocessing.Process(
            target=alarm_process, 
            args=(alarm_timeout, bucket_name, pdf_key, docx_key)
        )
        alarm_proc.start()

        try:
            s3_client.put_object_tagging(
                Bucket=bucket_name,
                Key=pdf_key,
                Tagging={
                    'TagSet': [
                        {'Key': 'isDocxComplete', 'Value': 'false'}
                    ]
                }
            )
            print(f"Tagged original PDF {pdf_key} with isDocxComplete:false")
        except botocore.exceptions.ClientError as tag_error:
            print(f"Failed to tag PDF: {tag_error}")
        
        print(f"Processing PDF: s3://{bucket_name}/{pdf_key}")

        # Only process files under 'pdf/' folder
        if not pdf_key.startswith("pdf/") or not pdf_key.endswith(".pdf"):
            raise Exception("File is not under 'pdf/' folder or not a PDF")

        # Local paths
        local_pdf_path = "input.pdf"
        local_docx_path = "output.docx"

        # Download PDF
        download_file_from_s3(bucket_name, pdf_key, local_pdf_path)

        # Verify PDF
        if not os.path.exists(local_pdf_path) or os.path.getsize(local_pdf_path) == 0:
            raise Exception("Downloaded PDF file is empty or missing")

        # Convert PDF -> DOCX
        convert_pdf_to_docx(local_pdf_path, local_docx_path)

        # If we got here, conversion succeeded - kill the alarm
        alarm_proc.terminate()
        alarm_proc.join()

        # Verify DOCX
        if not os.path.exists(local_docx_path) or os.path.getsize(local_docx_path) == 0:
            raise Exception("DOCX conversion failed")

        # Upload DOCX to S3
        upload_file_to_s3(local_docx_path, bucket_name, docx_key)

        try:
            s3_client.put_object_tagging(
                Bucket=bucket_name,
                Key=pdf_key,
                Tagging={
                    'TagSet': [
                        {'Key': 'isDocxComplete', 'Value': 'true'}
                    ]
                }
            )
            print(f"Tagged original PDF {pdf_key} with isDocxComplete:true")
        except botocore.exceptions.ClientError as tag_error:
            print(f"Failed to tag PDF: {tag_error}")

        # Notify that DOCX conversion is complete using the same mutation as PDF
        notify_docx_complete(docx_key)

        print(f"Successfully converted PDF to DOCX: {docx_key}")

        return {
            "statusCode": 200,
            "status": "SUCCESS",
            "input_key": pdf_key,
            "output_key": docx_key,
            "bucket": bucket_name
        }

    except Exception as e:
        print(f"Error in handler: {str(e)}")
        
        # Kill alarm process
        alarm_proc.terminate()
        alarm_proc.join()
        
        try:
            s3_client.put_object_tagging(
                Bucket=bucket_name,
                Key=pdf_key,
                Tagging={
                    'TagSet': [
                        {'Key': 'isDocxComplete', 'Value': 'error'}
                    ]
                }
            )
            print(f"Tagged original PDF {pdf_key} with isDocxComplete:true")
        except botocore.exceptions.ClientError as tag_error:
            print(f"Failed to tag PDF: {tag_error}")
        
        notify_docx_complete(docx_key)

        return {
            "statusCode": 500,
            "status": "ERROR",
            "error": str(e)
        }
