import requests
import boto3
import json

def get_secret():
    client = boto3.client("secretsmanager")
    response = client.get_secret_value(SecretId="orcid-access-token") 
    return response['SecretString']

def getTotalOrcidPublications(arguments):
    """
    Fetch all publication put-codes for a given ORCID ID.
    Returns a dict with the list of put-codes and the total count.
    """
    access_token = get_secret()
    base_url = "https://pub.orcid.org/v3.0"
    url = f"{base_url}/{arguments['orcid_id']}/works"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json"
    }
    response = requests.get(url, headers=headers)
    put_codes = []
    if response.status_code == 200:
        data = response.json()
        for group in data.get('group', []):
            work_summaries = group.get('work-summary', [])
            for summary in work_summaries:
                put_code = summary.get('put-code')
                if put_code:
                    put_codes.append(put_code)
    return {
        "total_results": len(put_codes),
        "put_codes": put_codes
    }

def lambda_handler(event, context):
    return getTotalOrcidPublications(event["arguments"])
