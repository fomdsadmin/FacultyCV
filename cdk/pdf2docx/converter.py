import boto3
import botocore
import os
from pdf2docx import Converter
from urllib.parse import unquote_plus

s3_client = boto3.client("s3")

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

def handler(event, context):
    try:
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

        # Verify DOCX
        if not os.path.exists(local_docx_path) or os.path.getsize(local_docx_path) == 0:
            raise Exception("DOCX conversion failed")

        # Construct DOCX key: replace 'pdf/' with 'docx/' and .pdf → .docx
        docx_key = pdf_key.replace("pdf/", "docx/").rsplit(".", 1)[0] + ".docx"

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
        return {
            "statusCode": 500,
            "status": "ERROR",
            "error": str(e)
        }
