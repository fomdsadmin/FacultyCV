import json
import boto3
import psycopg2

def updateUser(arguments):
    # TODO
    return

def lambda_handler(event, context):
    arguments = event['arguments']
    updateUser(arguments=arguments)
    return "SUCCESS"