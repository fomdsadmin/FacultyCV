import requests
import boto3

URL = 'https://api.elsevier.com/content/search/author'

def getCredentials():
    sm_client = boto3.client('secretsmanager')
    credentials = {}

    secret_api_key = sm_client.get_secret_value(SecretId='elsevier-API-key')
    secret_inst_token = sm_client.get_secret_value(SecretId='elsevier-inst-token')
    credentials['api-key'] = secret_api_key['SecretString']
    credentials['inst-token'] = secret_inst_token['SecretString']
    return credentials

def getPotentialMatches(arguments):
    credentials = getCredentials()
    last_name_arg = arguments['last_name']
    first_name_arg = arguments.get('first_name', None)
    inst = arguments.get('institution_name', None)

    potential_match_list = []
    query = []

    # Build query string for Scopus API
    if last_name_arg:
        query.append(f"authlast({last_name_arg})")
    if first_name_arg:
        query.append(f"authfirst({first_name_arg})")
    if inst:
        query.append(f"affil({inst})")

    queryString = " and ".join(query)

    params = {
        'query': queryString
    }

    headers = {
        'X-ELS-APIKey': credentials['api-key'],
        'X-ELS-Insttoken': credentials['inst-token']
    }

    results = requests.get(url=URL, params=params, headers=headers).json()

    num_results = int(results['search-results'].get('opensearch:totalResults', 0))
    entries = results['search-results'].get('entry', [])

    if num_results == 0 or not entries:
        return potential_match_list

    for entry in entries:
        # Preferred name
        last_name_result = entry['preferred-name'].get('surname', '')
        first_name_result = entry['preferred-name'].get('given-name', '')

        # Strict filter: last name
        if last_name_arg.lower() != last_name_result.lower():
            continue

        # Strict filter: first name
        if first_name_arg:
         arg_norm = first_name_arg.replace(".", "").replace(" ", "").lower()
         given_norm = first_name_result.replace(".", "").replace(" ", "").lower()
         if not given_norm.startswith(arg_norm):
            continue

        # SCOPUS ID
        scopus_id = entry.get('dc:identifier', '').split(':')[1] if 'dc:identifier' in entry else ''

        # ORCID
        orcid = entry.get('orcid', '')

        # SUBJECTS
        subject_list = entry.get('subject-area', [])
        if type(subject_list) is dict:
            subject_list = [subject_list]
        subjects = ", ".join([s['$'] for s in subject_list]) if subject_list else ''

        # CURRENT AFFILIATION
        curr_affil_data = entry.get('affiliation-current', {})
        curr_affil = ""
        if curr_affil_data:
            curr_affil = f"{curr_affil_data.get('affiliation-name','')}, {curr_affil_data.get('affiliation-city','')}"

        # Build result object
        result_object = {
            'last_name': last_name_result,
            'first_name': first_name_result,
            'scopus_id': scopus_id
        }
        if subjects:
            result_object['subjects'] = subjects
        if curr_affil:
            result_object['current_affiliation'] = curr_affil
        if orcid:
            result_object['orcid'] = orcid

        potential_match_list.append(result_object)

    return potential_match_list

def lambda_handler(event, context):
    return getPotentialMatches(event['arguments'])