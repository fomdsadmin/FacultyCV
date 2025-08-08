import requests
import boto3
import math
from datetime import datetime
import re

URL = 'https://api.elsevier.com/content/search/scopus'

def parse_cover_display_date(date_str):
    """
    Parse various date formats and return 'Month Year' format.
    Handles formats like:
    - "1 October 2025" -> "October 2025"
    - "October 2025" -> "October 2025" 
    - "2025" -> "2025"
    - Other edge cases
    """
    if not date_str or date_str.strip() == '':
        return ''
    
    date_str = date_str.strip()
    
    # Try to extract year first (4 digits)
    year_match = re.search(r'\b(19|20)\d{2}\b', date_str)
    year = year_match.group() if year_match else ''
    
    # Try to extract month name
    month_match = re.search(r'\b(January|February|March|April|May|June|July|August|September|October|November|December)\b', date_str, re.IGNORECASE)
    if month_match:
        month = month_match.group().title()
        return f"{month} {year}" if year else month
    
    # Try to extract numeric month (handle formats like "10/2025" or "2025-10")
    numeric_month_match = re.search(r'\b(0?[1-9]|1[0-2])\b', date_str)
    if numeric_month_match and year:
        try:
            month_num = int(numeric_month_match.group())
            month_name = datetime(2000, month_num, 1).strftime('%B')
            return f"{month_name} {year}"
        except:
            pass
    
    # If only year is found, return just the year
    if year:
        return year
    
    # If nothing else works, return the original string
    return date_str

def getCredentials():
    sm_client = boto3.client('secretsmanager')
    credentials = {}

    secret_api_key = sm_client.get_secret_value(SecretId='elsevier-API-key')
    secret_inst_token = sm_client.get_secret_value(SecretId='elsevier-inst-token')
    credentials['api-key'] = secret_api_key['SecretString']
    credentials['inst-token'] = secret_inst_token['SecretString']
    return credentials 

# updated function
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
    total_results = 0  # Initialize total_results
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
            journal_title = ''
            cited_by = None
            end_date = ''
            link = ''
            volume = ''
            article_number = ''

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
                    journal_title = result['prism:publicationName']
                if (list(keys).count('citedby-count')):
                    cited_by = int(result['citedby-count'])
                if (list(keys).count('prism:coverDate')):
                    year_published = result['prism:coverDate'][1:4]
                if (list(keys).count('author')):
                    scopus_authors = result['author']
                    for author in scopus_authors:
                        author_ids.append(author['authid'])
                        author_names.append(author['authname'])
                if (list(keys).count('link')):
                    link = result['link'][2]['@href']
                if (list(keys).count('prism:volume')):
                    volume = result['prism:volume']
                if (list(keys).count('prism:coverDisplayDate')):
                    raw_end_date = result['prism:coverDisplayDate']
                    # Parse the date to extract month and year only
                    end_date = parse_cover_display_date(raw_end_date)
                if (list(keys).count('article-number')):
                    article_number = result['article-number']
                publications.append({'doi': doi, 'publication_id': id, 'title': title, 
                    'keywords': keywords, 'journal_title': journal_title, 'cited_by': cited_by, 'author_ids': author_ids, 
                    'author_names': author_names, 'link': link, 
                    'volume': volume, 'end_date': end_date, 
                    'article_number': article_number})
    
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
    elif 'start_index' in args and 'batch_size' in args:
        return getBatchedPublicationMatches(
            args['scopus_id'],
            args['start_index'],
            args['batch_size']
        )
    else:
        return getBatchedPublicationMatches(
            args['scopus_id'],
            args.get('start_index', 0),
            args.get('batch_size', 250)
        )