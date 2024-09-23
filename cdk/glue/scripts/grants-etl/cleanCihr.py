import sys
import json
import io
import pandas as pd
import numpy as np
import boto3
from awsglue.utils import getResolvedOptions

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

"""
This function will fetch the raw CIHR data from the raw S3 bucket, clean it, and put the clean data
into the corresponding clean S3 bucket
:param bucket: the name of the target bucket
:param key_raw: the key (path) to the raw csv file
:param key_clean: the key(path) to a clean csv file after transformation
"""
def cleanCihr(bucket, key_raw, key_clean):

    raw_data = fetchFromS3(bucket=bucket, key=key_raw)

    # read raw data into a pandas DataFrame
    df = pd.read_csv(raw_data, skiprows=0, header=0)

    # Handle multiple names separated by semicolon
    first_name_last_name = df["Name"].str.split(";").str[0].str.split(",", expand=True)
    df["First Name"] = first_name_last_name[1].str.strip()
    df["Last Name"] = first_name_last_name[0].str.strip()

    # add Department column
    df["Department"] = np.nan

    # add Agency column with string CIHR
    df["Agency"] = "CIHR"

    # rename Program_Name column to Program
    df["Program"] = df["Program_Name"]

    # rename Project_Title column to Title
    df["Title"] = df["Project_Title"]

    # remove comma and convert Amount to integer
    df["CIHR_Contribution"] = df["CIHR_Contribution"].str.replace(",", "")
    df["CIHR_Contribution"] = df["CIHR_Contribution"].str.replace("$", "", regex=False)
    df["Amount"] = pd.to_numeric(df["CIHR_Contribution"]).astype(int)

    # add Keywords column
    df["Keywords"] = np.nan

    # Extract start year and month from Competition_CD column
    df["Start Year"] = df["Competition_CD"].str[:4].astype(int)
    df["Start Month"] = df["Competition_CD"].str[4:6].astype(int)

    # Extract years and months from Term_Years_Months column
    term_years_months = df["Term_Years_Months"].str.extract(r'(?P<Years>\d+)\s*yrs\s*(?P<Months>\d+)\s*mths')
    
    # Fill NaN values with zeros and convert to int
    term_years_months = term_years_months.fillna(0).astype(int)

    df["Term Years"] = term_years_months["Years"]
    df["Term Months"] = term_years_months["Months"]

    # Calculate end year and month
    df["End Year"] = df["Start Year"] + df["Term Years"] + ((df["Start Month"] + df["Term Months"]) // 12)
    df["End Month"] = (df["Start Month"] + df["Term Months"]) % 12
    df["End Month"] = df["End Month"].replace(0, 12)  # Fix for December being represented as 0 month

    # Create Dates column in the format <start year>-<end year>
    df["Dates"] = df["Start Year"].astype(str) + '-' + df["End Year"].astype(str)

    # Drop redundant columns
    df = df.drop(columns=["Start Year", "Start Month", "Term Years", "Term Months", "End Year", "End Month", "Program_Name", "Term_Years_Months", "CIHR_Contribution", "CIHR_Equipment", "Project_Title", "PRC_Name", "Institution_Paid", "Competition_CD", "Name"])

    putToS3(df=df, key=key_clean, bucket=bucket)

# function call
cleanCihr(BUCKET_NAME, FILENAME_RAW, FILENAME_CLEAN)
