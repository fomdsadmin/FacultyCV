import os
import json
import boto3

s3_client = boto3.client("s3")
BUCKET_NAME = os.environ["BUCKET_NAME"]  # "gotenberg-cv"

def lambda_handler(event, context):
    try:
        print("Event:", json.dumps(event))

        # Get GraphQL arguments
        key = event["variables"]["key"]
        method = event["variables"]["method"].upper()

        if method == "GET_TAGS":
            # Pull tags from the object
            response = s3_client.get_object_tagging(
                Bucket=BUCKET_NAME,
                Key=key
            )
            return response["TagSet"]

        if method not in ["GET", "PUT"]:
            return "Invalid method. Use GET, PUT, or GET_TAGS."

        # Choose correct S3 command for presigned URL
        if method == "GET":
            operation = "get_object"
        else:
            operation = "put_object"

        url = s3_client.generate_presigned_url(
            ClientMethod=operation,
            Params={"Bucket": BUCKET_NAME, "Key": key},
            ExpiresIn=3600
        )

        return url

    except Exception as e:
        print("Error:", str(e))
        return None
