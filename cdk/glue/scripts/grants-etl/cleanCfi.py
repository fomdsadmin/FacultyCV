import sys
import json
import io
import pandas as pd
import numpy as np
import boto3
from custom_utils.utils import fetchFromS3, putToS3
from awsglue.utils import getResolvedOptions

# TESTING PURPOSES
# session = boto3.Session(profile_name='abhi')
# BUCKET_NAME = 'grant-data-test-bucket'
# FILENAME_RAW = 'CFI.csv'
# FILENAME_CLEAN = 'CFI-clean.csv'

# define job parameters
args = getResolvedOptions(
    sys.argv, ["BUCKET_NAME", "FILENAME_RAW", "FILENAME_CLEAN"])
BUCKET_NAME = args["BUCKET_NAME"]
FILENAME_RAW = args["FILENAME_RAW"]
FILENAME_CLEAN = args["FILENAME_CLEAN"]

"""
This function will clean the CFI data by splitting column Name into First Name and 
Last Name, modify the name of other columns, drop unused(duplicate) columns and 
write the final csv file to a destination s3 bucket location.

:param bucket: the name of the target bucket
:param key_raw: the key (path) to the raw csv file
:param key_clean: the key(path) to a clean csv file after transformation
:return: none
"""
def split_name(full_name):
    names = full_name.split()
    first_name = names[0]
    last_name = ' '.join(names[1:]) if len(names) > 1 else ''
    return pd.Series([first_name, last_name], index=['First Name', 'Last Name'])

def cleanCfi(bucket, key_raw, key_clean):

    raw_data = fetchFromS3(bucket=bucket, key=key_raw)

    # read raw data into a pandas DataFrame
    df = pd.read_csv(raw_data, skiprows=0, header=0)

    # split Name into fname and lname
    df[['First Name', 'Last Name']] = df['Team Leader(s)'].apply(split_name)
    
    # add Department column
    df["Department"] = np.nan

    # add Agency column with string CFI
    df["Agency"] = "CFI"

    # Grant Program column
    df["Grant Program"] = df["Fund"]

    # Amount column
    df["CFI Contribution"] = df["CFI Contribution"].str.replace(",", "")
    df["CFI Contribution"] = df["CFI Contribution"].str.replace("$", "", regex=False)
    df["Amount"] = pd.to_numeric(df["CFI Contribution"]).astype(int)

    # Project Title column
    df["Project Title"] = df["Project title"]

    # Extract year from "Funding decision year" column
    funding_decision_year = df["Funding decision year"].astype(str)

    # # Concatenate year with day and month from "Decision date" column to create "Start Date"
    # df["Start Date"] = df.apply(lambda row: row["Decision date"][:-2] + str(row["Funding decision year"]), axis=1)
    # df["End Date"] = np.nan

    # Create "Dates" column
    df["Dates"] = funding_decision_year + "-"

    # Create "Faculty Member ID" column
    df["Faculty Member ID"] = np.nan

    # Drop redundant columns
    df = df.drop(columns=["Project Number", "Project title", "Fund Type", "Fund", "Team Leader(s)", "Team Member(s)", "Province", "Municipality", "Institution type", "Lead Institution", "Collaborating Institutions", "Field of research", "Funding decision year", "Decision date", "CFI Contribution"])

    putToS3(df, bucket, key=key_clean)


# function call
cleanCfi(BUCKET_NAME, FILENAME_RAW, FILENAME_CLEAN)