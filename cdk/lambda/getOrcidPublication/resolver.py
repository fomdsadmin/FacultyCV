import requests
import boto3
import json

def get_secret():
    client = boto3.client("secretsmanager")
    response = client.get_secret_value(SecretId="orcid-access-token") 
    return response['SecretString']

def parse_publication(data):
    # Safely handle DOI extraction when external-ids is None
    doi = None
    external_ids = data.get('external-ids')
    if external_ids is not None:  # Check if external-ids exists at all
        external_id_list = external_ids.get('external-id', []) or []
        for ext_id in external_id_list:
            if isinstance(ext_id, dict) and ext_id.get('external-id-type') == 'doi':
                doi = ext_id.get('external-id-value')
                break
    
    publication = {
        "publication_id": str(data.get('put-code', '')) if data.get('put-code') else '',
        "title": data.get('title', {}).get('title', {}).get('value', '') if data.get('title') else '',
        "cited_by": None,  # Assuming no cited_by data in the api response for ORCID
        "keywords": [],  # Assuming no keywords in the api response for ORCID
        "journal": data.get('journal-title', {}).get('value', '') if data.get('journal-title') else '',
        "link": (data.get('url', {}) or {}).get('value', '') if data.get('url') else '',
        "doi": doi,
        "year_published": data.get('publication-date', {}).get('year', {}).get('value', '') if data.get('publication-date') else '',
        "author_names": [
            contributor.get('credit-name', {}).get('value', '') 
            for contributor in data.get('contributors', {}).get('contributor', []) or []
            if contributor.get('credit-name', {}) and contributor.get('credit-name', {}).get('value')
        ] if data.get('contributors') else [],
        "author_ids": [
            contributor.get('contributor-orcid', {}).get('path', '')
            for contributor in data.get('contributors', {}).get('contributor', []) or []
            if contributor.get('contributor-orcid') and contributor.get('contributor-orcid', {}).get('path')
        ] if data.get('contributors') else [],
    }
    return publication


def getOrcidPublication(arguments):
    """
    Fetch a specific section of the ORCID record based on arguments.
    Arguments should include:
    - 'orcid_d': The ORCID ID
    - 'put_codes': List of 100 put-codes to fetch publications
    """
    orcid_id = arguments.get("orcid_id")
    put_codes = arguments.get("put_codes")

    # Validate inputs
    if not orcid_id or not put_codes:
        return {"error": "Missing required parameters: orcidId or put_codes"}

    # Fetch the access token dynamically from Secrets Manager
    access_token = get_secret()

    # Construct the API URL
    base_url = "https://pub.orcid.org/v3.0"

    # Make the API call
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json"
    }

    # Join put codes with commas
    put_codes_str = ",".join(str(code) for code in put_codes)
    url = f"{base_url}/{orcid_id}/works/{put_codes_str}"

    response = requests.get(url, headers=headers)
    publications = []

    try:
        full_data = response.json()
        for data in full_data.get('bulk', []):
            work = data.get('work')
            if work:
                try:
                    each_publication = parse_publication(work)
                    publications.append(each_publication)
                except Exception as e:
                    print(e)
                    print("Work: ", work)
    except Exception as e:
        print(e)
        return {
            'bio': "err",
            'keywords': "",
            'publications': [],
            'other_data': {},
            'error': 'Failed to parse publications'
        }

    return {
        'bio': "",
        'keywords': "",
        'publications': publications,
        'other_data': {}
    }

def lambda_handler(event, context):
    """
    Lambda handler to fetch ORCID sections.
    Expects the event to include an 'arguments' key with:
    - 'orcidId': The ORCID ID
    - 'section': The section to fetch
    """
    return getOrcidPublication(event["arguments"])
