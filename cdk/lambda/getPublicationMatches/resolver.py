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


def lambda_handler(event, context):
    return getPublicationMatches(event['arguments']['scopus_id'], event['arguments']['page_number'], event['arguments']['results_per_page'])