import boto3
import json
import psycopg2
import os
from databaseConnect import get_connection

sm_client = boto3.client('secretsmanager')
DB_PROXY_ENDPOINT = os.environ['DB_PROXY_ENDPOINT']

def getStagingScopusPublications(arguments):
    """
    arguments: {
        'user_id': str (optional - if provided, filters by user_id),
        'is_new': bool (optional - if provided, filters by is_new status),
        'limit': int (optional - limits number of results),
        'offset': int (optional - for pagination)
    }
    """
    user_id = arguments.get('user_id')
    is_new = arguments.get('is_new')
    limit = arguments.get('limit')
    offset = arguments.get('offset', 0)

    connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
    print("Connected to Database")
    cursor = connection.cursor()

    try:
        # Build the query with optional filters
        query = "SELECT id, user_id, data_details, is_new, fetched_at FROM scopus_publications"
        params = []
        conditions = []

        # Add WHERE conditions based on provided arguments
        if user_id is not None:
            conditions.append("user_id = %s")
            params.append(user_id)

        if is_new is not None:
            conditions.append("is_new = %s")
            params.append(is_new)

        # Add WHERE clause if we have conditions
        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        # Add ordering (most recent first)
        query += " ORDER BY fetched_at DESC"

        # Add pagination
        if limit is not None:
            query += " LIMIT %s"
            params.append(limit)

        if offset > 0:
            query += " OFFSET %s"
            params.append(offset)

        print(f"Executing query: {query}")
        print(f"With parameters: {params}")

        cursor.execute(query, params)
        rows = cursor.fetchall()

        # Also get total count for pagination
        count_query = "SELECT COUNT(*) FROM scopus_publications"
        count_params = []
        
        if conditions:
            count_query += " WHERE " + " AND ".join(conditions)
            # Use the same conditions but without limit/offset
            if user_id is not None:
                count_params.append(user_id)
            if is_new is not None:
                count_params.append(is_new)

        cursor.execute(count_query, count_params)
        total_count = cursor.fetchone()[0]

        # Format the results
        publications = []
        for row in rows:
            publication = {
                'id': str(row[0]),
                'user_id': row[1],
                'data_details': row[2],  # This is already a dict from JSONB
                'is_new': row[3],
                'fetched_at': row[4].isoformat() if row[4] else None
            }
            publications.append(publication)

        result = {
            'publications': publications,
            'total_count': total_count,
            'returned_count': len(publications),
            'offset': offset
        }

        cursor.close()
        connection.close()

        print(f"Successfully retrieved {len(publications)} publications (total: {total_count})")
        return result

    except Exception as e:
        print(f"Error in getStagingScopusPublications: {str(e)}")
        cursor.close()
        connection.close()
        return {
            'publications': [],
            'total_count': 0,
            'returned_count': 0,
            'offset': 0,
            'error': str(e)
        }

def lambda_handler(event, context):
    arguments = event['arguments']
    return getStagingScopusPublications(arguments=arguments)