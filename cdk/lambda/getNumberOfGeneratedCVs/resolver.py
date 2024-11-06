import boto3
import os

def getNumberOfGeneratedCVs(arguments):
    client = boto3.client('s3')
    response = client.list_objects_v2(Bucket=os.environ['BUCKET_NAME'])
    usersWithCvs = set()
    for item in response['Contents']:
        if item['Key'].endswith('.pdf'):
            usersWithCvs.add(item['Key'][0:item['Key'].index('/')])
    return len(usersWithCvs)

def lambda_handler(event, context):
    return getNumberOfGeneratedCVs(event['arguments'])