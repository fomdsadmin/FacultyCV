import boto3
import botocore
import subprocess
import sys
import os

def download_file_from_s3(bucket_name, s3_file_key, local_file_path):
    # Create a session using your AWS credentials
    session = boto3.Session()
    
    # Create an S3 resource
    s3 = session.resource('s3')

    try:
        # Download the file from S3
        s3.Bucket(bucket_name).download_file(s3_file_key, local_file_path)
        print(f"File downloaded successfully from S3 bucket '{bucket_name}' to '{local_file_path}'")
    except botocore.exceptions.ClientError as e:
        print(f"Error downloading file: {e}")

def runPdfLatex(file_name):
    try:
        subprocess.run(["pdflatex", file_name])
    except Exception as e:
        print(f"Error running pdflatex: {e}")

def upload_file_to_s3(file_name, bucket_name, s3_file_key):
    # Create a session using your AWS credentials
    session = boto3.Session()

    # Create an S3 resource
    s3 = session.resource('s3')

    try:
        # Upload the file to S3
        s3.Bucket(bucket_name).upload_file(file_name, s3_file_key)
        print(f"File uploaded successfully to S3 bucket '{bucket_name}' with key '{s3_file_key}'")
    except botocore.exceptions.ClientError as e:
        print(f"Error uploading file: {e}")


def handler(event, context):

    os.chdir('/tmp/')

    bucket_name = event['Records'][0]['s3']['bucket']['name']
    s3_file_key = event['Records'][0]['s3']['object']['key']
    local_file_path = 'resume.tex'

    download_file_from_s3(bucket_name, s3_file_key, local_file_path)
    runPdfLatex(local_file_path)

    upload_file_to_s3(local_file_path.replace('tex', 'pdf'), bucket_name, s3_file_key.replace('tex', 'pdf'))

    return {
        'status': 'SUCCEEDED'
    }



