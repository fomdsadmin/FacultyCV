import json
import urllib.parse
import urllib.request
import boto3
import os

def getCredentials():
    sm_client = boto3.client('secretsmanager')
    credentials = {}

    secret_api_key = sm_client.get_secret_value(SecretId='REDCap-API-key')
    secret_dict = json.loads(secret_api_key['SecretString'])  # Parses the JSON string
    credentials['redcap-api-key'] = secret_dict['token']      # Use the 'token' field
    return credentials

def lambda_handler(event, context):
    try:
        credentials = getCredentials()
        API_KEY = credentials['redcap-api-key']
        redcap_url = os.environ.get('REDCAP_API_URL', 'https://rc.med.ubc.ca/redcap/api/')
        payload = {
            'token': API_KEY,
            'content': 'record',
            'format': 'json',
            'type': 'flat',
            'filterLogic': '[archive] = ""'
        }

        data = urllib.parse.urlencode(payload).encode('utf-8')
        req = urllib.request.Request(redcap_url, data=data, method='POST')
        req.add_header('Content-Type', 'application/x-www-form-urlencoded')

        with urllib.request.urlopen(req) as response:
            result = response.read().decode('utf-8')
            return {
                'statusCode': 200,
                'headers': { 'Content-Type': 'application/json' },
                'body': result
            }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({ 'error': str(e) })
        }
