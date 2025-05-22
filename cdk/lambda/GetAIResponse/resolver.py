import json
import boto3
import time
from openai import AzureOpenAI

def getCredentials():
    sm_client = boto3.client('secretsmanager')
    credentials = {}
    try:
        secret_api_key = sm_client.get_secret_value(SecretId='azure-openai')
        secret_dict = json.loads(secret_api_key['SecretString'])
        credentials['endpoint'] = secret_dict['openai_endpoint']
        credentials['api_key'] = secret_dict['openai_api_key']
        credentials['model_name'] = secret_dict['openai_model_name']
        credentials['api_version'] = secret_dict['openai_api_version']
        return credentials
    except Exception as e:
        raise Exception(f"Failed to retrieve credentials: {str(e)}")

def getChatGPTResponse(prompt):
    try:
        secret_info = getCredentials()
        client = AzureOpenAI(
            azure_endpoint = secret_info['endpoint'],
            api_key = secret_info['api_key'],
            api_version = secret_info['api_version'],
        )

        chat_prompt = [
            {
                "role": "system",
                "content": "You are a research assistant. Give me a top, unique research keywords used in my publications keyword list and Return JSON in this format: [{\"category\": \"Category Name\", \"keywords\": [\"keyword1\", \"keyword2\"]}]"
            },
            {
                "role": "user",
                "content": prompt
            }
        ]

        start = time.time()

        completion = client.chat.completions.create(
            model=secret_info['model_name'],
            messages=chat_prompt,
            max_tokens=500,
            temperature=0.7,
            top_p=0.3,
            frequency_penalty=0,
            presence_penalty=0,
            stop=None,
            stream=False
        )

        result = json.loads(completion.to_json())
        reply_message = result['choices'][0]['message']['content']
        if reply_message.startswith("```json"):
            reply_message = reply_message.strip("` \n").replace("json", "", 1).strip()

        try:
            parsed_json = json.loads(reply_message)
        except json.JSONDecodeError:
            parsed_json = {
                "error": "Model did not return valid JSON",
                "raw": reply_message
            }

        response_time = round(time.time() - start, 2)

        return {
            "answer": parsed_json if isinstance(parsed_json, list) else None,
            "response_time_seconds": response_time,
            "error": parsed_json.get("error") if isinstance(parsed_json, dict) else None
        }
    except Exception as e:
        return {
            "answer": None,
            "response_time_seconds": 0.0,
            "error": str(e)
        }

def validate_event(event):
    if 'user_input' not in event:
        raise ValueError("Missing 'user_input' in event payload")
    return event['user_input']

def lambda_handler(event, context):
    try:
        prompt = validate_event(event)
        return getChatGPTResponse(prompt)
    except Exception as e:
        return {
            "answer": None,
            "response_time_seconds": 0.0,
            "error": str(e)
        }