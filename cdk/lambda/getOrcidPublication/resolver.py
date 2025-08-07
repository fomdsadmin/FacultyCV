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
        "journal_title": data.get('journal-title', {}).get('value', '') if data.get('journal-title') else '',
        "link": (data.get('url', {}) or {}).get('value', '') if data.get('url') else '',
        "doi": doi,
        "end_date": data.get('publication-date', {}).get('year', {}).get('value', '') if data.get('publication-date') else '',
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
    - 'orcid_id': The ORCID ID
    - 'put_codes': List of put-codes to fetch publications
    - 'get_put_codes_only': Bool to only return put codes without publications
    """
    
    orcid_id = arguments.get("orcid_id")
    put_codes = arguments.get("put_codes", [])
    get_put_codes_only = arguments.get("get_put_codes_only", False)

    # Validate inputs
    if not orcid_id:
        return {"error": "Missing required parameters: orcid_id"}

    # Fetch the access token dynamically from Secrets Manager
    access_token = get_secret()

    # Construct the API URL
    base_url = "https://pub.orcid.org/v3.0"

    # Make the API call
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json"
    }

    # First get all put codes if we don't have them or if specifically requested
    if not put_codes or get_put_codes_only:
        url = f"{base_url}/{orcid_id}/works"
        response = requests.get(url, headers=headers)
        all_put_codes = []
        
        if response.status_code == 200:
            data = response.json()
            for group in data.get('group', []):
                work_summaries = group.get('work-summary', [])
                for summary in work_summaries:
                    put_code = summary.get('put-code')
                    if put_code:
                        all_put_codes.append(put_code)
                        
        # If we only need put codes, return them now
        if get_put_codes_only:
            return {
                'put_codes': all_put_codes,
                'publications': []
            }
        
        # Otherwise use these put codes if none were provided
        if not put_codes:
            put_codes = all_put_codes

    # Join put codes with commas
    publications = []
    batch_size = 100 # API endpoint /works only supports a max of 100 in one request. 
    for i in range(0, len(put_codes), batch_size):
        batch = put_codes[i:i+batch_size]
        put_codes_str = ",".join(str(code) for code in batch)
        url = f"{base_url}/{orcid_id}/works/{put_codes_str}"

        response = requests.get(url, headers=headers)
        try:
            full_data = response.json()
            print(full_data)
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
            continue

    return {
        'publications': publications,
        'put_codes': put_codes if get_put_codes_only else []
    }

def lambda_handler(event, context):
    """
    Lambda handler to fetch ORCID sections.
    Expects the event to include an 'arguments' key with:
    - 'orcidId': The ORCID ID
    - 'section': The section to fetch
    """
    return getOrcidPublication(event["arguments"])
