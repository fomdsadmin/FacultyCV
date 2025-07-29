import json
import os
import boto3

# create the folder structure on S3 bucket for maual uploads
def lambda_handler(event, context):
    s3 = boto3.client("s3")
    bucket = os.environ.get("BUCKET_NAME")
    s3.put_object(Bucket=bucket, Key='manual/')
    print(f"Created 'manual/' folder in {bucket}")
