import requests
import boto3

URL = 'https://pub.orcid.org/v3.0'

def getPotentialMatches(arguments):
    last_name = arguments['last_name']
    first_name = arguments['first_name']
    institution = arguments['institution_name'] if 'institution_name' in arguments else None
    
    MAX_RESULTS = 10

    headers = {
        'Accept': 'application/orcid+json',
    }

    # Query for ORCID id's based on name and institution
    param1 = 'University of British Columbia'
    param2 = 'UBC'
    param3 = 'The University of British Columbia'
    param4 = 'BCCHR'
    param5 = 'BC Children\'s Hospital Research Institute'
    
    # First try with affiliation filter
    request_url = f"{URL}/search/?q=given-names:{first_name}+AND+family-name:{last_name}"
    request_url += f"+AND+affiliation-org-name:{param1}+OR+affiliation-org-name:{param2}+OR+affiliation-org-name:{param3}+OR+affiliation-org-name:{param4}+OR+affiliation-org-name:{param5}"
    
    response = requests.get(request_url, headers=headers).json()
    num_results = response['num-found']
    
    # If no results with affiliation filter, try without it
    if num_results == 0:
        request_url = f"{URL}/search/?q=given-names:{first_name}+AND+family-name:{last_name}"
        response = requests.get(request_url, headers=headers).json()
        num_results = response['num-found']
        if num_results == 0:
            return []
        
        # return []
    
    results = response['result']
    orcid_ids = []
    for result in results[:MAX_RESULTS]:
        orcid_ids.append(result['orcid-identifier']['path'])

    # Query ORCID ID for more info (capped by MAX_RESULTS)
    orcid_info = []
    for orcid_id in orcid_ids:
        info = {'orcid_id': orcid_id}
        response = requests.get(f"{URL}/{orcid_id}", headers=headers).json()
        info['first_name'] = response['person']['name']['given-names']['value']
        info['last_name'] = response['person']['name']['family-name']['value']
        info['credit_name'] = response['person']['name']['credit-name']['value'] if response['person']['name']['credit-name'] else None
        info['name_variants'] = [ item['content'] for  item in response['person']['other-names']['other-name'] ]
        info['keywords'] = [ item['content'] for item in response['person']['keywords']['keyword'] ]
        info['researcher_urls'] = [ item['url']['value'] for item in response['person']['researcher-urls']['researcher-url'] ]
        orcid_info.append(info)

    return orcid_info 

def lambda_handler(event, context):
    return getPotentialMatches(event['arguments'])