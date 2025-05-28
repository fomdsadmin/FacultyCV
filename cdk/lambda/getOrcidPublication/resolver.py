import requests
import boto3
import json

def get_secret():
    client = boto3.client("secretsmanager")
    response = client.get_secret_value(SecretId="orcid-access-token") 
    return response['SecretString']

def parse_publication(data):
    publication = {
        "publication_id": str(data.get('put-code', '')) if data.get('put-code') else '',
        "title": data.get('title', {}).get('title', {}).get('value', '') if data.get('title') else '',
        "cited_by": None,  # Assuming no cited_by data in the api response for ORCID
        "keywords": [],  # Assuming no keywords in the api response for ORCID
        "journal": data.get('journal-title', {}).get('value', '') if data.get('journal-title') else '',
        "link": data.get('url', {}).get('value', '') if data.get('url') else '',
        "doi": next(
            (
                ext_id.get('external-id-value') 
                for ext_id in data.get('external-ids', {}).get('external-id', []) or []
                if isinstance(ext_id, dict) and ext_id.get('external-id-type') == 'doi'
            ),
            None
        ),
        "year_published": data.get('publication-date', {}).get('year', {}).get('value', '') if data.get('publication-date') else '',
        "author_names": [
            contributor.get('credit-name', {}).get('value', '') 
            for contributor in data.get('contributors', {}).get('contributor', []) 
            if contributor.get('credit-name', {}).get('value')
        ] if data.get('contributors') else [],
        "author_ids": [
            contributor['contributor-orcid']['path']
            for contributor in data.get('contributors', {}).get('contributor', []) 
            if contributor.get('contributor-orcid') and contributor['contributor-orcid'].get('path')
        ] if data.get('contributors') else [],
    }
    return publication


def getOrcidPublication(arguments):
    """
    Fetch a specific section of the ORCID record based on arguments.
    Arguments should include:
    - 'orcid_d': The ORCID ID
    - 'put_codes': List of <= 25 put-codes to fetch publications
    """
    orcid_id = arguments.get("orcid_id")
    put_codes = arguments.get("put_codes")
    section = "publications"  # Default section to fetch

    # Validate inputs
    if not orcid_id or not put_codes:
        return {"error": "Missing required parameters: orcidId and put_codes"}

    section_to_endpoint = {
        "publications": f"/works",
    }

    # Get the endpoint for the requested section
    endpoint = section_to_endpoint.get(section)
    if not endpoint:
        return {"error": f"Invalid section: {section}"}

    # Fetch the access token dynamically from Secrets Manager
    access_token = get_secret()

    # Construct the API URL
    base_url = "https://pub.orcid.org/v3.0"
    url = f"{base_url}/{orcid_id}{endpoint}"

    # Make the API call
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json"
    }

    response = requests.get(url, headers=headers)

    # Handle the response

    if response.status_code == 200:
        data = response.json()               

        if section == "publications":
            # Extract and structure publication data
            publications = []
            for put_code in put_codes:
                url = f"{base_url}/{orcid_id}/work/{put_code}"
                response2 = requests.get(url, headers=headers)
                try:
                    full_data = response2.json()
                except Exception as e:
                    continue  # Skip if JSON parsing fails
                if not full_data:
                    continue  # Skip if response is empty
                try:
                    each_publication = parse_publication(full_data)
                except Exception as e:
                    continue  # Skip if JSON parsing fails
                publications.append(each_publication)
    
            return {
                'bio': "",
                'keywords': "",
                'publications': publications,
                'other_data': {}
                }   

        # If we reach here, something went wrong
    return {
        'bio': "",
        'keywords': "",
        'publications': [],
        'other_data': {},
        'error': 'Failed to fetch publications or invalid request'
    }

def lambda_handler(event, context):
    """
    Lambda handler to fetch ORCID sections.
    Expects the event to include an 'arguments' key with:
    - 'orcidId': The ORCID ID
    - 'section': The section to fetch
    """
    return getOrcidPublication(event["arguments"])
