import requests
import boto3

URL = 'https://api.elsevier.com/content/search/scopus'

def getCredentials():
    sm_client = boto3.client('secretsmanager')
    credentials = {}

    secret_api_key = sm_client.get_secret_value(SecretId='elsevier-API-key')
    secret_inst_token = sm_client.get_secret_value(SecretId='elsevier-inst-token')
    credentials['api-key'] = secret_api_key['SecretString']
    credentials['inst-token'] = secret_inst_token['SecretString']
    return credentials

def getTotalScopusPublications(scopus_id):
    """
    Efficiently retrieves only the total publication count for a Scopus ID.
    Optimized to minimize data transfer and processing.
    """
    credentials = getCredentials()
    API_KEY = credentials['api-key']
    INST_TOKEN = credentials['inst-token']
    
    # Optimize query for count-only operation
    query = {
        'query': 'AU-ID(' + scopus_id + ')',
        'view': 'STANDARD',  # Use STANDARD instead of COMPLETE for less data
        'count': 1,          # Request minimal results
        'start': 0,
        'field': 'dc:identifier' # Only retrieve essential field
    }
    
    headers = {
        'X-ELS-APIKey': API_KEY,
        'X-ELS-Insttoken': INST_TOKEN
    }
    
    try:
        response = requests.get(URL, headers=headers, params=query)
        rjson = response.json()
        
        if 'search-results' not in rjson:
            print(f"No search results for Scopus ID: {scopus_id}")
            return {'total_results': 0}
        
        total_results = int(rjson['search-results']['opensearch:totalResults'])
        print(f"Found {total_results} publications for Scopus ID: {scopus_id}")
        
        return {
            'total_results': total_results
        }
    except Exception as e:
        print(f"Error retrieving publication count: {str(e)}")
        return {'total_results': 0, 'error': str(e)}

def lambda_handler(event, context):
    """
    Lambda handler specifically for getting publication counts.
    """
    try:
        args = event['arguments']
        scopus_id = args.get('scopus_id')
        
        if not scopus_id:
            return {'error': 'Missing required parameter: scopus_id'}
            
        return getTotalScopusPublications(scopus_id)
    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        return {'error': str(e), 'total_results': 0}