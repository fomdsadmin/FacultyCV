import json
import boto3
import psycopg2

def addUser(arguments):
    # TODO
    return

def lambda_handler(event, context):
    arguments = event['arguments']
    addUser(arguments=arguments)
    return "SUCCESS"