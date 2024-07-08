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
    last_name = arguments['last_name']
    first_name = arguments['first_name']
    inst = arguments['institution_name'] if 'institution_name' in arguments else None
    potential_match_list = []
    query = []
    if last_name:
        query.append(f"authlast({last_name})")
    if first_name:
        query.append(f"authfirst({first_name})")
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

    num_results = int(results['search-results']['opensearch:totalResults'])
    entries = results['search-results']['entry']
    if num_results == 0:
        return results
    else:
        for entry in entries:
            # NAME
            last_name = entry['preferred-name']['surname'] if 'surname' in entry['preferred-name'] else ''
            first_name = entry['preferred-name']['given-name'] if 'given-name' in entry['preferred-name'] else ''

            # NAME VARIANTS
            name_variants_list = []
            if 'name-variant' in entry:
                for name_variant in entry['name-variant']:
                    name_variants_list.append(name_variant['given-name'] + " " + name_variant['surname'])
            name_variants = ''
            for name_variant in name_variants_list:
                name_variants += name_variant + ", "

            # SCOPUS
            scopus_id = entry['dc:identifier'].split(':')[1] if 'dc:identifier' in entry else ''

            # ORCID
            orcid = ''
            if 'orcid' in entry:
                orcid = entry['orcid']

            # SUBJECTS
            subject_list = []
            if 'subject-area' in entry:
                subject_list = [ entry['subject-area'] ] if type(entry['subject-area']) is not list else entry['subject-area']
            subjects = ""
            for subject in subject_list:
                subjects = subjects + subject['$'] + ", "

            # AFFILIATIONS
            curr_affil = ""
            if 'affiliation-current' in entry:
                curr_affil = f"{entry['affiliation-current']['affiliation-name']}, {entry['affiliation-current']['affiliation-city']}"  

            result_object = {}
            result_object['last_name'] = last_name
            result_object['first_name'] = first_name
            if name_variants != '':
                result_object['name_variants'] = name_variants[:-2]
            if subjects != '':
                result_object['subjects'] = subjects[:-2]
            if curr_affil != '':
                result_object['current_affiliation'] = curr_affil
            result_object['scopus_id'] = scopus_id
            if orcid != '':
                result_object['orcid'] = orcid

            potential_match_list.append(result_object)
        return potential_match_list


def lambda_handler(event, context):
    return getPotentialMatches(event['arguments'])