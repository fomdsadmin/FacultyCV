import boto3
import os

def getNumberOfGeneratedCVs(arguments):
    client = boto3.client('s3')
    response = client.list_objects_v2(Bucket=os.environ['BUCKET_NAME'])
    numCVs = 0
    for item in response['Contents']:
        if item['Key'].endswith('.pdf'):
            numCVs += 1
    return numCVs

def lambda_handler(event, context):
    return getNumberOfGeneratedCVs(event['arguments'])