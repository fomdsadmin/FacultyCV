import boto3
import os
import json

s3 = boto3.client('s3')

CONFIG_FILE_KEY = 'config.json'

def lambda_handler(event, context):
    arguments = event['arguments']
    vspace = arguments['vspace']
    margin = arguments['margin']
    font = arguments['font']

    obj = {
        'vspace': vspace,
        'margin': margin,
        'font': font
    }

    s_obj = json.dumps(obj)

    with open(f"/tmp/{CONFIG_FILE_KEY}", "w") as outfile:
        outfile.write(s_obj)

    s3.upload_file(f"/tmp/{CONFIG_FILE_KEY}", os.environ['BUCKET_NAME'], CONFIG_FILE_KEY)

    return "SUCCESS"