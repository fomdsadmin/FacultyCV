import requests
import boto3
import math

URL = 'https://api.elsevier.com/content/search/scopus'

def getCredentials():
    sm_client = boto3.client('secretsmanager')
    credentials = {}

    secret_api_key = sm_client.get_secret_value(SecretId='elsevier-API-key')
    secret_inst_token = sm_client.get_secret_value(SecretId='elsevier-inst-token')
    credentials['api-key'] = secret_api_key['SecretString']
    credentials['inst-token'] = secret_inst_token['SecretString']
    return credentials

def getPublicationMatches(scopus_id, page_number, results_per_page):
    credentials = getCredentials()
    API_KEY = credentials['api-key']
    INST_TOKEN = credentials['inst-token']
    query = {
        'query': 'AU-ID(' + scopus_id + ')',
        'view': 'COMPLETE',
        'count': results_per_page,
        'start': page_number*results_per_page
    }
    headers = {
    'X-ELS-APIKey': API_KEY,
    'X-ELS-Insttoken': INST_TOKEN
    }
    response = requests.get(URL, headers=headers, params=query)

    rjson = response.json()
    publications = []
    if 'search-results' not in rjson:
        print("Did not recieve any publications from API")
        return publications
    total_results = int(rjson['search-results']['opensearch:totalResults'])
    results = rjson['search-results']['entry']
    for result in results:
        keys = result.keys()
        doi = ''
        id = ''
        title = ''
        keywords = []
        journal = ''
        cited_by = None
        year_published = ''
        link = ''
        # This will evaluate to false if the publication no longer exists
        if(list(keys).count('author-count')):
            author_ids = []
            author_names = []
            if(list(keys).count('prism:doi')):
                doi = result['prism:doi']
            if(list(keys).count('dc:identifier')):
                for c in result['dc:identifier']:
                    if c.isdigit():
                        id = id + c
            if(list(keys).count('dc:title')):
                title = result['dc:title']
            if(list(keys).count('authkeywords')):
                keywords_string = result['authkeywords']
                keywords = keywords_string.split('|')
                keywords = [keyword.strip() for keyword in keywords]
            if(list(keys).count('dc:description')):
                description = result['dc:description']
            if (list(keys).count('prism:publicationName')):
                journal = result['prism:publicationName']
            if (list(keys).count('citedby-count')):
                cited_by = int(result['citedby-count'])
            if (list(keys).count('prism:coverDate')):
                year_published = result['prism:coverDate'][0:4]
            if (list(keys).count('author')):
                scopus_authors = result['author']
                for author in scopus_authors:
                    author_ids.append(author['authid'])
                    author_names.append(author['authname'])
            if (list(keys).count('link')):
                link = result['link'][2]['@href']
            publications.append({'doi': doi, 'publication_id': id, 'title': title, 
                'keywords': keywords, 'journal': journal, 'cited_by': cited_by, 
                'year_published': year_published, 'author_ids': author_ids, 
                'author_names': author_names, 'link': link})
    return {
        'publications': publications,
        'total_results': total_results,
        'total_pages': math.floor(total_results/results_per_page),
        'current_page': page_number,
    }   

# Add this updated function
def getBatchedPublicationMatches(scopus_id, start_index=0, batch_size=250, count_only=False):
    credentials = getCredentials()
    API_KEY = credentials['api-key']
    INST_TOKEN = credentials['inst-token']
    
    # If count_only, we just need to get the total count
    if count_only:
        query = {
            'query': 'AU-ID(' + scopus_id + ')',
            'view': 'COMPLETE',
            'count': 1,  # Minimum to get total count
            'start': 0
        }
        headers = {
            'X-ELS-APIKey': API_KEY,
            'X-ELS-Insttoken': INST_TOKEN
        }
        response = requests.get(URL, headers=headers, params=query)
        rjson = response.json()
        
        if 'search-results' not in rjson:
            return {'total_results': 0, 'publications': []}
        
        total_results = int(rjson['search-results']['opensearch:totalResults'])
        return {
            'total_results': total_results,
            'publications': []
        }
    
    # Otherwise, fetch publications in batches of 25
    publications = []
    api_batch_size = 25  # API limit
    
    # Process the larger batch_size in smaller API-compatible chunks
    for offset in range(0, batch_size, api_batch_size):
        current_size = min(api_batch_size, batch_size - offset)
        current_start = start_index + offset
        
        query = {
            'query': 'AU-ID(' + scopus_id + ')',
            'view': 'COMPLETE',
            'count': current_size,
            'start': current_start
        }
        
        headers = {
            'X-ELS-APIKey': API_KEY,
            'X-ELS-Insttoken': INST_TOKEN
        }
        
        response = requests.get(URL, headers=headers, params=query)
        rjson = response.json()
        
        if 'search-results' not in rjson:
            print(f"Did not receive any publications from API for batch starting at {current_start}")
            continue
            
        total_results = int(rjson['search-results']['opensearch:totalResults'])
        results = rjson['search-results']['entry']
        
        # Process publications (same as your existing code)
        for result in results:
            # Your existing publication processing code here
            # ... (keep all the publication processing logic)
            keys = result.keys()
            doi = ''
            id = ''
            title = ''
            keywords = []
            journal = ''
            cited_by = None
            year_published = ''
            link = ''
            # This will evaluate to false if the publication no longer exists
            if(list(keys).count('author-count')):
                author_ids = []
                author_names = []
                if(list(keys).count('prism:doi')):
                    doi = result['prism:doi']
                if(list(keys).count('dc:identifier')):
                    for c in result['dc:identifier']:
                        if c.isdigit():
                            id = id + c
                if(list(keys).count('dc:title')):
                    title = result['dc:title']
                if(list(keys).count('authkeywords')):
                    keywords_string = result['authkeywords']
                    keywords = keywords_string.split('|')
                    keywords = [keyword.strip() for keyword in keywords]
                if(list(keys).count('dc:description')):
                    description = result['dc:description']
                if (list(keys).count('prism:publicationName')):
                    journal = result['prism:publicationName']
                if (list(keys).count('citedby-count')):
                    cited_by = int(result['citedby-count'])
                if (list(keys).count('prism:coverDate')):
                    year_published = result['prism:coverDate'][0:4]
                if (list(keys).count('author')):
                    scopus_authors = result['author']
                    for author in scopus_authors:
                        author_ids.append(author['authid'])
                        author_names.append(author['authname'])
                if (list(keys).count('link')):
                    link = result['link'][2]['@href']
                publications.append({'doi': doi, 'publication_id': id, 'title': title, 
                    'keywords': keywords, 'journal': journal, 'cited_by': cited_by, 
                    'year_published': year_published, 'author_ids': author_ids, 
                    'author_names': author_names, 'link': link})
    
    return {
        'publications': publications,
        'total_results': total_results
    }

# Update the lambda_handler
def lambda_handler(event, context):
    args = event['arguments']
    
    if 'count_only' in args and args['count_only']:
        return getBatchedPublicationMatches(
            args['scopus_id'], 
            count_only=True
        )
    
    if 'start_index' in args and 'batch_size' in args:
        return getBatchedPublicationMatches(
            args['scopus_id'],
            args['start_index'],
            args['batch_size']
        )
    
    # Fallback to original implementation for backward compatibility
    return getPublicationMatches(
        args['scopus_id'], 
        args['page_number'], 
        args['results_per_page']
    )