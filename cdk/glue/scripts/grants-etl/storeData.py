import sys
import json
import io
import pandas as pd
import numpy as np
import psycopg2
import psycopg2.extras as extras
import boto3
from datetime import datetime
from awsglue.utils import getResolvedOptions

s3_client = boto3.client("s3")
sm_client = boto3.client('secretsmanager')

# get environment variable for this Glue job
args = getResolvedOptions(
    sys.argv, ["BUCKET_NAME", "FILENAME_CLEAN", "SECRET_NAME"])
BUCKET_NAME = args["BUCKET_NAME"]
FILENAME_CLEAN = args["FILENAME_CLEAN"]
SECRET_NAME = args["SECRET_NAME"]

def getCredentials():
    credentials = {}

    response = sm_client.get_secret_value(SecretId=SECRET_NAME)
    secrets = json.loads(response['SecretString'])
    credentials['username'] = secrets['username']
    credentials['password'] = secrets['password']
    credentials['host'] = secrets['host']
    credentials['db'] = 'postgres'
    return credentials

def storeData():

    global FILENAME_INSERT

    s3_client = boto3.resource('s3')
    response = s3_client.Object(BUCKET_NAME, FILENAME_CLEAN).get()
    
    data_types = {
        'First Name': str,
        'Last Name': str,
        'Department': str, 
        'Agency': str,
        'Program': str, 
        'Amount': int, 
        'Title': str,
        'Keywords': str, 
        'Dates': str, 
    }
    
    df_id = pd.read_csv(io.StringIO(response["Body"].read().decode(
        "utf-8")), header=0, keep_default_na=False, dtype=data_types)

    df_id = df_id.drop_duplicates()

    # rearrange columns order
    columns_order = ['First Name', 'Last Name', 'Keywords', 'Agency', 'Department',
                     'Program', 'Title', 'Amount', 'Dates']
    df_id = df_id[columns_order]

    # convert the entire DataFrame into a list of tuples (rows)
    cleanData = list(df_id.itertuples(index=False, name=None))

    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    cursor = connection.cursor()
    print("Successfully connected to database")

    # Check the first value in the Agency column to determine the table
    target_table = "grants"
    if df_id['Agency'].iloc[0] == 'Rise':
        target_table = "rise_data"

    # Check for duplicate insertion
    query = f"SELECT first_name, last_name, keywords, agency, department, program, title, amount, dates FROM {target_table}"
    cursor.execute(query)
    tableData = list(map(lambda tup: tuple("" if x == None else x for x in tup), cursor.fetchall()))
    
    # The difference between the two sets is the data that are unique and can be inserted into the database
    listOfValuesToInsert = list(set(cleanData) - set(tableData))

    # Inserting to db
    query = f"INSERT INTO {target_table} (first_name, last_name, keywords, agency, department, program, title, amount, dates) VALUES %s"
    extras.execute_values(cursor, query, listOfValuesToInsert)

    connection.commit()
    print(f"Inserted {len(listOfValuesToInsert)} more rows into {target_table}!")

    # # For testing purposes
    # query = "SELECT * FROM public.grant_data LIMIT 1"
    # cursor.execute(query)
    # print(cursor.fetchall())
    # query = "SELECT COUNT(*) FROM public.grant_data"
    # cursor.execute(query)
    # print("# of rows right now: " + str(cursor.fetchall()))

    cursor.close()
    connection.close()

    print("Successfully inserted data into database")

def main(argv):
    storeData()

if __name__ == "__main__":
    main(sys.argv)
