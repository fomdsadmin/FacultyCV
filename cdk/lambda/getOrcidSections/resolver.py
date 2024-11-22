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
            (id.get('external-id-value') for id in data.get('external-ids', {}).get('external-id', []) or []
             if id.get('external-id-type') == 'doi'),
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


def getOrcidSections(arguments):
    """
    Fetch a specific section of the ORCID record based on arguments.
    Arguments should include:
    - 'orcidId': The ORCID ID
    - 'section': The section to fetch (e.g., 'biography', 'education', etc.)
    """
    orcid_id = arguments.get("orcidId")
    section = arguments.get("section")

    # Validate inputs
    if not orcid_id or not section:
        return {"error": "Missing required parameters: orcidId and section"}

    # Map sections to endpoints
    section_to_endpoint = {
        "biography": f"/person",
        "education": f"/educations",
        "employment": f"/employments",
        "qualifications": f"/qualifications",
        "publications": f"/works",
        "keywords": f"/keywords",
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


        if section == "biography":
            biography = data.get("biography")  # This may be None
            if biography and "content" in biography:
                biography_content = biography["content"]
            else:
                biography_content = "Biography not available on ORCID"
            return {
                'bio': biography_content,
                'keywords': "",
                'publications': [],
                'other_data': {}
                }

        if section == "keywords":
            keywords = data.get("keyword")
            if keywords: 
                keywords_content = ', '.join(keyword['content'] for keyword in data['keyword'])
            else:
                keywords_content = "Keywords not available on ORCID"
            return {
                'bio': "",
                'keywords': keywords_content,
                'publications': [],
                'other_data': {}
                }   
                          

        if section == "publications":
            # Extract and structure publication data
            publications = []
            put_codes = []
            for group in data.get('group', []):
                work_summaries = group.get('work-summary', [])
                for summary in work_summaries:
                    put_code = summary.get('put-code')
                    if put_code:
                        put_codes.append(put_code)
            for put_code in put_codes:
                url = f"{base_url}/{orcid_id}/work/{put_code}"
                response = requests.get(url, headers=headers)
                full_data = response.json()
                each_publication = (parse_publication(full_data)) 
                publications.append(each_publication)
            return {
                'bio': "",
                'keywords': "",
                'publications': publications,
                'other_data': {}
                }   
        
        if section == "education":
            # Extract and structure education data
            education_list = []
            for affiliation_group in data.get("affiliation-group", []):
                for summary in affiliation_group.get("summaries", []):
                    education_summary = summary.get("education-summary", {})
                    role_title = education_summary.get("role-title", "N/A")
                    organization_name = education_summary.get("organization", {}).get("name", "N/A")
                    start_date = education_summary.get("start-date", {})
                    start_year = start_date.get("year", {}).get("value", "N/A")
                    start_month = start_date.get("month", {}).get("value", "N/A")
                    end_date = education_summary.get("end-date", {})
                    end_year = end_date.get("year", {}).get("value", "N/A")
                    end_month = end_date.get("month", {}).get("value", "N/A")

                    education_list.append({
                        "role_title": role_title,
                        "organization_name": organization_name,
                        "start_year": start_year,
                        "start_month": start_month,
                        "end_year": end_year,
                        "end_month": end_month,
                    })
            return {
                'bio': "",
                'keywords': "",
                'publications': [],
                'other_data': {}
                }          
       
def lambda_handler(event, context):
    """
    Lambda handler to fetch ORCID sections.
    Expects the event to include an 'arguments' key with:
    - 'orcidId': The ORCID ID
    - 'section': The section to fetch
    """
    return getOrcidSections(event["arguments"])



