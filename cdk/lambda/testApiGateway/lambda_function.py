import json
import os
import boto3
from datetime import datetime

def lambda_handler(event, context):
    """
    Simple test endpoint for API Gateway
    Returns information about the request and environment
    """
    
    try:
        # Parse the incoming event
        http_method = event.get('httpMethod', 'UNKNOWN')
        path = event.get('path', 'UNKNOWN')
        headers = event.get('headers', {})
        body = event.get('body')
        
        # Get query string parameters
        query_params = event.get('queryStringParameters') or {}
        
        # Get request context
        request_context = event.get('requestContext', {})
        source_ip = request_context.get('identity', {}).get('sourceIp', 'unknown')
        user_agent = request_context.get('identity', {}).get('userAgent', 'unknown')
        
        # Parse body if it exists
        parsed_body = None
        if body:
            try:
                parsed_body = json.loads(body)
            except json.JSONDecodeError:
                parsed_body = {"raw_body": body}
        
        # Prepare response data
        response_data = {
            "message": "API Gateway test endpoint working!",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "request_info": {
                "method": http_method,
                "path": path,
                "source_ip": source_ip,
                "user_agent": user_agent[:100] if len(user_agent) > 100 else user_agent  # Truncate long user agents
            },
            "query_parameters": query_params,
            "body": parsed_body,
            "environment": {
                "aws_region": os.environ.get('AWS_REGION', 'unknown'),
                "function_name": os.environ.get('AWS_LAMBDA_FUNCTION_NAME', 'unknown'),
                "function_version": os.environ.get('AWS_LAMBDA_FUNCTION_VERSION', 'unknown')
            }
        }
        
        # Return successful response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
            },
            'body': json.dumps(response_data, indent=2)
        }
        
    except Exception as e:
        # Error handling
        error_response = {
            "error": "Internal server error",
            "message": str(e),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(error_response)
        }
