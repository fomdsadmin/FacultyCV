import boto3
import os
import json

s3 = boto3.client('s3')

CONFIG_FILE_KEY = 'config.json'

def lambda_handler(event, context):
    # First check if object exists in the bucket
    try:
        response = s3.get_object(Bucket=os.environ['BUCKET_NAME'], Key=CONFIG_FILE_KEY)
        config = response['Body'].read().decode('utf-8')
        return config
    except Exception as e:
        # If config object does not exist
        default_config = {
            'vspace': -0.5,
            'font': '',
            'margin': 1.25
        }
        return json.dumps(default_config)


    