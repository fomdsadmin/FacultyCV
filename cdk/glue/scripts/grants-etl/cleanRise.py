import sys
import json
import io
import pandas as pd
import numpy as np
import boto3
from awsglue.utils import getResolvedOptions

# # TESTING PURPOSES
# session = boto3.Session(profile_name='abhi')
# BUCKET_NAME = 'grant-data-test-bucket'
# FILENAME_RAW = 'raw/CFI.csv'
# FILENAME_CLEAN = 'clean/CFI-clean.csv'

# define job parameters
args = getResolvedOptions(
    sys.argv, ["BUCKET_NAME", "FILENAME_RAW", "FILENAME_CLEAN"])
BUCKET_NAME = args["BUCKET_NAME"]
FILENAME_RAW = args["FILENAME_RAW"]
FILENAME_CLEAN = args["FILENAME_CLEAN"]

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

    # return io.StringIO(raw_data_from_s3.read().decode("utf-8"))
    return io.StringIO(raw_data_from_s3.read().decode("utf-8-sig"))  # Handles BOM issues and extended chars

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
    #df.to_csv(csv_buffer, index=False)
    df.to_csv(csv_buffer, index=False, encoding="utf-8")  # Preserve extended characters

    # put buffered data into the clean S3 bucket
    s3_bucket_clean = boto3.resource('s3')
    response = s3_bucket_clean.Object(
        bucket, key).put(Body=csv_buffer.getvalue())

    status = response.get("ResponseMetadata", {}).get("HTTPStatusCode")

    if status == 200:
        print(f"Successful S3 put_object response. Status - {status}")
    else:
        print(f"Unsuccessful S3 put_object response. Status - {status}")


"""
This function will clean the CFI data by splitting column Name into First Name and 
Last Name, modify the name of other columns, drop unused(duplicate) columns and 
write the final csv file to a destination s3 bucket location.

:param bucket: the name of the target bucket
:param key_raw: the key (path) to the raw csv file
:param key_clean: the key(path) to a clean csv file after transformation
:return: none
"""

def cleanRise(bucket, key_raw, key_clean):

    raw_data = fetchFromS3(bucket=bucket, key=key_raw)

    # read raw data into a pandas DataFrame
    df = pd.read_csv(raw_data, skiprows=0, header=0)

    # Split "Researcher Name" into "First Name" and "Last Name"
    first_name_last_name = df["Researcher Name"].str.split(",", expand=True)
    df["First Name"] = first_name_last_name[1].str.strip()
    df["Last Name"] = first_name_last_name[0].str.strip()
    
    # add Keywords column
    df["Keywords"] = np.nan

    # add Department column
    df["Department"] = df["Researcher Home Department"]

    # add Agency column with string Rise
    df["Agency"] = "Rise"

    # Program column
    df["Program"] = df["Program Name"]

    # Amount column
    df["Award Amount"] = df["Award Amount"].str.replace(",", "")
    df["Award Amount"] = df["Award Amount"].str.replace("$", "", regex=False)
    df["Amount"] = pd.to_numeric(df["Award Amount"]).astype(int)

    # Title column
    df["Title"] = df["Project Title"]

    # Extract year from "From Year" column
    funding_decision_year = df["From Year"].astype(str)

    # Create "Dates" column
    df["Dates"] = funding_decision_year + "-"

    # Drop redundant columns
    df = df.drop(columns=[
        "From Year", "Application Number", "Researcher Name", "PI Rank", 
        "Award Type", "Project Title", "Award Amount", "Sector", 
        "Sponsor Type", "Sponsor Name", "Government", "Tri-Council Code", 
        "Program Name", "CFI BCKDF", "Faculty", "Researcher Home Faculty", 
        "FoM Department", "Researcher Home Department", "FoM Research Institute", 
        "Institution Name", "FoM Research Centre Name "])

    putToS3(df, bucket, key=key_clean)


# function call
cleanRise(BUCKET_NAME, FILENAME_RAW, FILENAME_CLEAN)