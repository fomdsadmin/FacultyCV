import json
import boto3
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
            azure_endpoint=secret_info['endpoint'],
            api_key=secret_info['api_key'],
            api_version=secret_info['api_version'],
        )

        chat_prompt = [
            {
                "role": "system",
                "content": "Please generate a professional short bio (approximately 100 words) for a professor affiliated with the University of British Columbia (UBC), Canada, using the provided Areas of Focus, Affiliations, and Awards. The bio should maintain a formal tone and exclude any personal or sensitive information. If no relevant individual affiliated with UBC can be identified based on the given information, simply respond with: No UBC-affiliated individual found"
            },
            {
                "role": "user",
                "content": prompt
            }
        ]

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

        return {
            "answer": reply_message.strip(),
            "error": None
        }

    except Exception as e:
        return {
            "answer": None,
            "error": str(e)
        }

def validate_event(event):
    if 'user_input' in event:
        return event['user_input']
    else:
        raise ValueError("Missing 'user_input' in event payload")


def lambda_handler(event, context):
    try:
        prompt = validate_event(event)
        return getChatGPTResponse(prompt)
    except Exception as e:
        return {
            "answer": None,
            "error": str(e)
        }