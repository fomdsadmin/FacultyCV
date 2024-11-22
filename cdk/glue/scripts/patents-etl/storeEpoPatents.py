import sys
import json
import io
import pandas as pd
import numpy as np
import boto3
import requests
import urllib
import base64
import math
import time
import ast
import re
import psycopg2
from psycopg2 import extras
from datetime import datetime
from awsglue.utils import getResolvedOptions


# define job parameters
args = getResolvedOptions(
    sys.argv, ["TEMP_BUCKET_NAME", "EPO_INSTITUTION_NAME", "FILE_PATH", "DB_SECRET_NAME", "EQUIVALENT"])
TEMP_BUCKET_NAME = args["TEMP_BUCKET_NAME"]
EPO_INSTITUTION_NAME = args["EPO_INSTITUTION_NAME"]
FILE_PATH = args["FILE_PATH"]
DB_SECRET_NAME = args["DB_SECRET_NAME"]
EQUIVALENT = args["EQUIVALENT"]

"""
Fetch the raw csv data from s3
:param bucket: str, the name of the target bucket
:param key_raw: str, the key (path) to the raw csv file
:return StringIO file-like object
"""
def fetchFromS3(bucket, key):

    # get the raw csv file from S3
    s3 = boto3.resource('s3')
    s3_bucket_raw = s3.Object(bucket, key)
    response = s3_bucket_raw.get()

    # extract the raw data from the response Body
    raw_data_from_s3 = response["Body"]

    return io.StringIO(raw_data_from_s3.read().decode("utf-8"))


"""
Put a Pandas DataFrame to the target S3 bucket & folder as a csv file
:param df: Pandas DataFrame, the clean df
:param bucket: string, the bucket name
:param key: string, the path to the clean file
"""
def putToS3(df, bucket, key):

    # create a buffer to write csv data to
    csv_buffer = io.StringIO()
    # avoid pandas saving an extra index column
    df.to_csv(csv_buffer, index=False)

    # put buffered data into the clean S3 bucket
    s3_bucket_clean = boto3.resource('s3')
    response = s3_bucket_clean.Object(
        bucket, key).put(Body=csv_buffer.getvalue())

    status = response.get("ResponseMetadata", {}).get("HTTPStatusCode")

    if status == 200:
        print(f"Successful S3 put_object response. Status - {status}")
    else:
        print(f"Unsuccessful S3 put_object response. Status - {status}")

def storePatentData():

    global FILE_PATH
    df_id = pd.read_csv(fetchFromS3(TEMP_BUCKET_NAME, FILE_PATH))
        
    # Drop the 'inventors' and 'applicants' columns from df_id
    df_id = df_id.drop(columns=['inventors', 'applicants'])

    # Define the columns order without 'inventors' and 'applicants'
    columns_order = ['title', 'first_name', 'last_name', 'publication_number', 'publication_date', 'family_number', 'country_code', 'kind_code', 'cpc']

    # Rearrange the columns order in df_id
    df_id = df_id[columns_order]
    
    # cast family_number as str
    df_id["family_number"] = df_id["family_number"].astype(str)

    # secretsmanager client to get db credentials
    sm_client = boto3.client("secretsmanager")
    response = sm_client.get_secret_value(SecretId=DB_SECRET_NAME)["SecretString"]
    secret = json.loads(response)

    connection = psycopg2.connect(
        user=secret["username"],
        password=secret["password"],
        host=secret["host"],
        dbname=secret["dbClusterIdentifier"]
    )
    cursor = connection.cursor()
    print("Successfully connected to database")

    # check for duplicate insertion
    schema = """title, first_name, last_name, publication_number, publication_date, family_number, country_code, kind_code, classification"""

    query = f"SELECT {schema} FROM patents"
    cursor.execute(query)
    tableData = cursor.fetchall()
    df_database = pd.DataFrame(tableData, columns=columns_order)

    # combine both dataframe into one, then drop all duplicates column
    df_insert = pd.concat([df_id, df_database], axis=0).drop_duplicates(
        subset=["family_number", "publication_number", "publication_date"], keep=False)

    listOfValuesToInsert = list(df_insert.itertuples(index=False, name=None))
    print(f"inserting {str(len(listOfValuesToInsert))} new entries!")
    # inserting to db
    query = f"INSERT INTO patents ({schema}) VALUES %s"
    extras.execute_values(cursor, query, listOfValuesToInsert)

    connection.commit()
    
    if EQUIVALENT == "true":
        FILE_PATH = f"epo/patent_data_insert/equivalent/patents_equivalent_insert.csv"
    else:
        FILE_PATH = f"epo/patent_data_insert/initial/patents_insert.csv"
    putToS3(df_insert, TEMP_BUCKET_NAME, FILE_PATH)
    print(f"Saved file at {TEMP_BUCKET_NAME}/{FILE_PATH}")

    # For testing purposes
    # query = "SELECT * FROM public.patent_data LIMIT 1"
    # cursor.execute(query)
    # print(cursor.fetchall())
    # query = "SELECT COUNT(*) FROM public.patent_data"
    # cursor.execute(query)
    # print("# of rows right now: " + str(cursor.fetchall()))

    cursor.close()
    connection.close()

    print("Job done!")


def main(argv):

    storePatentData()


if __name__ == "__main__":
    main(sys.argv)
