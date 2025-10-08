import pandas as pd
import numpy as np
import io
import boto3
import os
import psycopg2
import json
from datetime import datetime
import re
import html
from databaseConnect import get_connection

s3_client = boto3.client("s3")
sm_client = boto3.client("secretsmanager")
cognito_client = boto3.client("cognito-idp")
DB_PROXY_ENDPOINT = os.environ.get("DB_PROXY_ENDPOINT")
USER_POOL_ID = os.environ.get("USER_POOL_ID")

SECTION_TITLE_A = "9a. Areas of Special Interest and Accomplishments"
SECTION_TITLE_B = "9d. Invited Presentations"
SECTION_TITLE_C = "9e. Invited Participation"
SECTION_TITLE_D = "9f. Conference Participation"
SECTION_TITLE_E = "9g. Other Presentations"
SECTION_TITLE_F = "9h. Indigenous Scholarly Activity"
SECTION_TITLE_G = "9i. Scholarship of Education Activities"
SECTION_TITLE_H = "9j. Professional Contributions"

SECTION_TITLE_I = "9a. Areas of Special Interest and Accomplishments"
SECTION_TITLE_J = "9a. Areas of Special Interest and Accomplishments"
SECTION_TITLE_K = "13[a-d]. Awards and Distinctions"

SECTION_TITLE_L = "10a. Areas of Special Interest and Accomplishments"
SECTION_TITLE_M = "10[c-e]. Memberships on Committees, Faculty Mentoring, and Other Service"

SECTION_TITLE_N = "11a. Areas of Special Interest and Accomplishments"
SECTION_TITLE_O = "11[c-d]. Memberships on Hospital Committees, and Other Service"

SECTION_TITLE_P = "12a. Areas of Special Interest and Accomplishments"
SECTION_TITLE_Q = "12[c-f]. Memberships on Scholarly and Other Committees and Societies"
SECTION_TITLE_R = "12[g-k]. Other Community Service"

SECTION_TITLE_S = "14a. Other Relevant Information"


def prepare9aSpecialInterestsDF(df):
    a = df.copy()
    # Clean up html description to english details
    a["details"] = a["description"]
    a["type"] = "Areas of Special Interest and Accomplishment"
    a = a[["user_id", "dates", "type", "details"]]
    return a


def prepare9dInvPresentationsDF(df):
    a = df.copy()
    # Clean up html description to english details
    a["details"] = a["description"]

    def map_scale(row):
        scale_type = str(row.get("region", "")).strip()
        type_mapping = {
            "3. Local": "Local",
            "2. national": "National",
            "1. international": "International",
        }

        # Get the mapped value or use role as fallback
        if scale_type in type_mapping:
            mapped_value = type_mapping[scale_type]
            return mapped_value
        else:
            return ""

    a["scale"] = a.apply(map_scale, axis=1)

    a = a[["user_id", "dates", "scale", "details"]]
    return a


def prepare9eInvParticipationDF(df):
    a = df.copy()
    # Clean up html description to english details
    a["details"] = a["description"]
    a["type"] = "Invited Participation"
    a = a[["user_id", "dates", "type", "details"]]
    return a


def prepare9fConfParticipationDF(df):
    a = df.copy()
    # Clean up html description to english details
    a["details"] = a["description"]
    a = a[["user_id", "dates", "details"]]
    return a


def prepare9gOtherPresentationsDF(df):
    a = df.copy()
    # Clean up html description to english details
    a["details"] = a["description"]
    a["type_of_presentation"] = "Other presentation"
    a = a[["user_id", "dates", "type_of_presentation", "details"]]
    return a


def prepare9hIndigenousActivityDF(df):
    a = df.copy()
    # Clean up html description to english details
    a["details"] = a["description"]
    a = a[["user_id", "dates", "details"]]
    return a


def prepare9iScholarshipEducationActivityDF(df):
    a = df.copy()
    # Clean up html description to english details
    a["details"] = a["description"]
    a = a[["user_id", "dates", "details"]]
    return a


def prepare9jProfessionalContributionsDF(df):
    a = df.copy()
    # Clean up html description to english details
    a["description_of_contribution_and_impact"] = a["description"]
    a["type"] = "Professional Accomplishments and Scholarly Leadership"
    a = a[["user_id", "dates", "description_of_contribution_and_impact", "type"]]
    return a

# ----------------------------------------------------------------------------------------------------

def preparePublicationsDF(df):
    a = df.copy()
    # Clean up html description to english details
    a["details"] = a["description"]
    a["type"] = "Areas of Special Interest and Accomplishment"
    a = a[["user_id", "dates", "type", "details"]]
    return a


def preparePatentsDF(df):
    a = df.copy()
    # Clean up html description to english details
    a["details"] = a["description"]
    a["type"] = "Areas of Special Interest and Accomplishment"
    a = a[["user_id", "dates", "type", "details"]]
    return a


def prepareAwardsDF(df):
    a = df.copy()
    # Clean up html description to english details
    a["award"] = a["description"]
    
    # Map category_id to type
    def map_category_to_type(row):
        category_id = str(row.get('category_id', '')).strip()
        if category_id == '9201':
            return 'a. Teaching'
        elif category_id == '9202':
            return 'b. Scholarship'
        elif category_id == '9203':
            return 'c. Service'
        elif category_id == '9205':
            return 'd. Research'
        elif category_id == '9204':
            return 'd. Other'
        elif category_id == '9206':
            return 'd. Other (Mentoring Received)'
        elif category_id == '9207':
            return 'd. Other (Equity, Diversity, and Inclusion)'
        elif category_id == '9208':
            return 'd. Other (Appointment Context)'
        else:
            return ''
    
    a["type"] = a.apply(map_category_to_type, axis=1)

    a = a[["user_id", "dates", "type", "award"]]
    return a

# ----------------------------------------------------------------------------------------------------

def prepare10aSpecialInterestsDF(df):
    a = df.copy()
    # Clean up html description to english details
    a["details"] = a["description"]
    a["type"] = "Areas of Special Interest and Accomplishment"
    a = a[["user_id", "dates", "type", "details"]]
    return a

def prepare10cUniMembershipsDF(df):
    a = df.copy()
    # Clean up html description to english details
    a["details"] = a["description"]
    
    # Map category_id to type
    def map_category_to_type(row):
        category_id = str(row.get('category_id', '')).strip()
        if category_id == '9102':
            return 'c. Memberships on University Committee'
        elif category_id == '9103':
            return 'd. University Faculty Mentoring'
        elif category_id == '9106':
            return 'e. Other'
        else:
            return ''
    
    # Map university_committee_type for category 9102 only
    def map_university_committee_type(row):
        category_id = str(row.get('category_id', '')).strip()
        if category_id == '9102':
            committee_type = str(row.get('university_committee_type', '')).strip()
            # Custom mapping for university committee types
            committee_mapping = {
                '1. Department': 'Department',
                '2. Faculty of Medicine': 'Faculty of Medicine',
                '3. University': 'UBC',
            }
            
            # Get the mapped value or return original value
            if committee_type in committee_mapping:
                return committee_mapping[committee_type]
            else:
                return committee_type if committee_type else ''
        else:
            return ''
    
    a["type"] = a.apply(map_category_to_type, axis=1)
    a["publication_type"] = a.apply(map_university_committee_type, axis=1)
    
    a = a[["user_id", "dates", "type", "publication_type", "details"]]
    return a

# ----------------------------------------------------------------------------------------------------

def prepare11aSpecialInterestsDF(df):
    a = df.copy()
    # Clean up html description to english details
    a["details"] = a["description"]
    a["type"] = "Areas of Special Interest and Accomplishment"
    a = a[["user_id", "dates", "type", "details"]]
    return a

def prepare11cHospitalMembershipsDF(df):
    a = df.copy()
    # Clean up html description to english details
    a["details"] = a["description"]
    
    # Map category_id to type
    def map_category_to_type(row):
        category_id = str(row.get('category_id', '')).strip()
        if category_id == '9122':
            return 'c. Memberships on Hospital Committees'
        elif category_id == '9126':
            return 'd. Other'
        else:
            return ''
    
    # Map university_committee_type for category 9102 only
    def map_community_service_type(row):
        category_id = str(row.get('category_id', '')).strip()
        if category_id == '9122':
            committee_type = str(row.get('community_service_type', '')).strip()
            # Custom mapping for university committee types
            committee_mapping = {
                '1. Local': 'Local',
                '2. Provincial': 'Provincial',
                '3. National': 'National',
                '4. International': 'International',
            }
            
            # Get the mapped value or return original value
            if committee_type in committee_mapping:
                return committee_mapping[committee_type]
            else:
                return committee_type if committee_type else ''
        else:
            return ''
    
    a["type"] = a.apply(map_category_to_type, axis=1)
    a["scale"] = a.apply(map_community_service_type, axis=1)

    a = a[["user_id", "dates", "type", "scale", "details"]]
    return a

# ----------------------------------------------------------------------------------------------------

def prepare12aSpecialInterestsDF(df):
    a = df.copy()
    # Clean up html description to english details
    a["details"] = a["description"]
    a["type"] = "Areas of Special Interest and Accomplishment"
    a = a[["user_id", "dates", "type", "details"]]
    return a

def prepare12cCommunityMembershipsDF(df):
    a = df.copy()
    # Clean up html description to english details
    a["details"] = a["description"]
    
    # Map category_id to type
    def map_category_to_type(row):
        category_id = str(row.get('category_id', '')).strip()
        if category_id == '9142':
            return 'c. Memberships on Scholarly Societies'
        elif category_id == '9143':
            return 'd. Memberships on Other Societies'
        elif category_id == '9144':
            return 'e. Memberships on Scholarly Committees'
        elif category_id == '9145':
            return 'f. Memberships on Other Committees'
        else:
            return ''
    
    a["type"] = a.apply(map_category_to_type, axis=1)

    a = a[["user_id", "dates", "type", "details"]]
    return a

def prepare12gOtherMembershipsDF(df):
    a = df.copy()
    # Clean up html description to english details
    a["details"] = a["description"]
    
    # Map category_id to type
    def map_category_to_type(row):
        category_id = str(row.get('category_id', '')).strip()
        if category_id == '9146':
            return 'g. Editorship (list Journal)'
        elif category_id == '9147':
            return 'h. Reviewer (list Journal / Agency)'
        elif category_id == '9148':
            return 'i. External Examiner (indicate University)'
        elif category_id == '9149':
            return 'j. Consultant (indicate Organization)'
        elif category_id == '9150':
            return 'm. Other'
        else:
            return ''
    
    a["type"] = a.apply(map_category_to_type, axis=1)

    a = a[["user_id", "dates", "type", "details"]]
    return a

# ----------------------------------------------------------------------------------------------------

def prepare14aOtherInfoDF(df):
    a = df.copy()
    # Clean up html description to english details
    a["details"] = a["description"]
    a = a[["user_id", "dates", "details"]]
    return a


def cleanData(df):
    """
    Cleans the input DataFrame by performing various transformations for grants and contracts data.
    Returns cleaned DataFrame with processed grant/contract information.
    """
    # Ensure relevant columns are string type before using .str methods
    for col in [
        "user_id",
        "category_id",
        "description",
        "publication_type",
        "publication_type_other",
        "region",
        "community_service_type",
        "university_committee_type",
    ]:
        if col in df.columns:
            df[col] = df[col].astype(str)

    df = cleanOriginalData(df)

    # Extract new dataframe where category_id = 9001
    df_9001 = (
        df[df["category_id"] == "9001"].copy()
        if "category_id" in df.columns
        else pd.DataFrame()
    )
    df_9a_special_interests = prepare9aSpecialInterestsDF(df_9001)

    # Extract new dataframe where category_id = 9002
    df_9002 = (
        df[df["category_id"] == "9002"].copy()
        if "category_id" in df.columns
        else pd.DataFrame()
    )
    df_9d_inv_presentations = prepare9dInvPresentationsDF(df_9002)

    # Extract new dataframe where category_id = 9003
    df_9003 = (
        df[df["category_id"] == "9003"].copy()
        if "category_id" in df.columns
        else pd.DataFrame()
    )
    df_9e_inv_participation = prepare9eInvParticipationDF(df_9003)

    # Extract new dataframe where category_id = 9004
    df_9004 = (
        df[df["category_id"] == "9004"].copy()
        if "category_id" in df.columns
        else pd.DataFrame()
    )
    df_9f_conf_participation = prepare9fConfParticipationDF(df_9004)

    # Extract new dataframe where category_id = 9005
    df_9005 = (
        df[df["category_id"] == "9005"].copy()
        if "category_id" in df.columns
        else pd.DataFrame()
    )
    df_9g_other_presentations = prepare9gOtherPresentationsDF(df_9005)

    # Extract new dataframe where category_id = 9006
    df_9008 = (
        df[df["category_id"] == "9008"].copy()
        if "category_id" in df.columns
        else pd.DataFrame()
    )
    df_9h_indigenous_activity = prepare9hIndigenousActivityDF(df_9008)

    # Extract new dataframe where category_id = 9006
    df_9006 = (
        df[df["category_id"] == "9006"].copy()
        if "category_id" in df.columns
        else pd.DataFrame()
    )
    df_9i_scholarship_education_activity = prepare9iScholarshipEducationActivityDF(
        df_9006
    )

    # Extract new dataframe where category_id = 9007
    df_9007 = (
        df[df["category_id"] == "9007"].copy()
        if "category_id" in df.columns
        else pd.DataFrame()
    )
    df_9j_professional_contributions = prepare9jProfessionalContributionsDF(df_9007)
    
    # ------------------------------------------------------------------------------------------
    
    # Extract dataframe for multiple category IDs: 9905, 9903, 9901, 9910, 9906, 9907, 9908, 9909, 9904, 9902
    category_ids_list = [
        "9905",
        "9903",
        "9901",
        "9910",
        "9906",
        "9907",
        "9908",
        "9909",
        "9902",
    ]
    df_multiple_categories = (
        df[df["category_id"].isin(category_ids_list)].copy()
        if "category_id" in df.columns
        else pd.DataFrame()
    )
    df_publications = preparePublicationsDF(df_multiple_categories)

    df_9904 = (
        df[df["category_id"] == "9904"].copy()
        if "category_id" in df.columns
        else pd.DataFrame()
    )
    df_patents = preparePatentsDF(df_9904)

    # Extract dataframe for multiple category IDs: 9905, 9903, 9901, 9910, 9906, 9907, 9908, 9909, 9904, 9902
    category_ids_list = ["9205", "9201", "9202", "9203", "9204", "9206", "9207", "9208"]
    df_multiple = (
        df[df["category_id"].isin(category_ids_list)].copy()
        if "category_id" in df.columns
        else pd.DataFrame()
    )
    df_awards = prepareAwardsDF(df_multiple)
    
    # ------------------------------------------------------------------------------------------
    
    # Extract new dataframe where category_id = 9101
    df_9101 = (
        df[df["category_id"] == "9101"].copy()
        if "category_id" in df.columns
        else pd.DataFrame()
    )
    df_10a_special_interests = prepare10aSpecialInterestsDF(df_9101)
    
    # Extract dataframe for multiple category IDs: 9102, 9103, 9106
    category_ids_list = ["9102", "9103", "9106"]
    df_multiple = (
        df[df["category_id"].isin(category_ids_list)].copy()
        if "category_id" in df.columns
        else pd.DataFrame()
    )
    df_10c_uni_memberships = prepare10cUniMembershipsDF(df_multiple)
    
    # ------------------------------------------------------------------------------------------
    
    # Extract new dataframe where category_id = 9121
    df_9121 = (
        df[df["category_id"] == "9121"].copy()
        if "category_id" in df.columns
        else pd.DataFrame()
    )
    df_11a_special_interests = prepare11aSpecialInterestsDF(df_9121)
    
    # Extract dataframe for multiple category IDs: 9122, 9126
    category_ids_list = ["9122", "9126"]
    df_multiple = (
        df[df["category_id"].isin(category_ids_list)].copy()
        if "category_id" in df.columns
        else pd.DataFrame()
    )
    df_11c_hospital_memberships = prepare11cHospitalMembershipsDF(df_multiple)
    
    # ------------------------------------------------------------------------------------------
    
    # Extract new dataframe where category_id = 9141
    df_9141 = (
        df[df["category_id"] == "9141"].copy()
        if "category_id" in df.columns
        else pd.DataFrame()
    )
    df_12a_special_interests = prepare12aSpecialInterestsDF(df_9141)

    # Extract dataframe for multiple category IDs: 9142, 9143, 9144, 9145
    category_ids_list = ["9142", "9143", "9144", "9145"]
    df_multiple = (
        df[df["category_id"].isin(category_ids_list)].copy()
        if "category_id" in df.columns
        else pd.DataFrame()
    )
    df_12c_hospital_memberships = prepare12cCommunityMembershipsDF(df_multiple)
    
    # Extract dataframe for multiple category IDs: 9146, 9147, 9148, 9149, 9150
    category_ids_list = ["9146", "9147", "9148", "9149", "9150"]
    df_multiple = (
        df[df["category_id"].isin(category_ids_list)].copy()
        if "category_id" in df.columns
        else pd.DataFrame()
    )
    df_12g_other_memberships = prepare12gOtherMembershipsDF(df_multiple)
    
    # ------------------------------------------------------------------------------------------

    # Extract new dataframe where category_id = 9211
    df_9211 = (
        df[df["category_id"] == "9211"].copy()
        if "category_id" in df.columns
        else pd.DataFrame()
    )
    df_14a_other_info = prepare14aOtherInfoDF(df_9211)

    return (
        df_9a_special_interests,
        df_9d_inv_presentations,
        df_9e_inv_participation,
        df_9f_conf_participation,
        df_9g_other_presentations,
        df_9h_indigenous_activity,
        df_9i_scholarship_education_activity,
        df_9j_professional_contributions,
        df_publications,
        df_patents,
        df_awards,
        df_10a_special_interests,
        df_10c_uni_memberships,
        df_11a_special_interests,
        df_11c_hospital_memberships,
        df_12a_special_interests,
        df_12c_hospital_memberships,
        df_12g_other_memberships,
        df_14a_other_info,
    )


def cleanOriginalData(df):
    # Helper function to safely clean string columns
    def safe_string_clean(series):
        """Safely clean a pandas series, handling NaN, None, and string representations"""
        return (
            series.fillna("")
            .astype(str)
            .replace(["nan", "None", "null", "NULL"], "")
            .str.strip()
        )

    # Helper function to process user_id with unique transformation
    def process_user_id(x):
        """Apply transformation to make user IDs unique - add 10000 to avoid conflicts"""
        if pd.isna(x) or x == "" or str(x).strip() == "" or str(x) == "nan":
            return ""
        try:
            original_id = int(float(x))  # Handle cases like "123.0"
            # Apply transformation to make unique - add 534234 to avoid conflicts with existing IDs
            unique_id = original_id + 534234
            return str(unique_id)
        except (ValueError, TypeError):
            return str(x).strip()  # If conversion fails, return as string

    # Process dataframe A (Grants and Contracts)
    df["user_id"] = df["user_id"].apply(process_user_id)
    df["user_id"] = df["user_id"].astype("Int64")

    df["category_id"] = (
        safe_string_clean(df["category_id"]) if "category_id" in df.columns else ""
    )

    def clean_html_description(text):
        """Clean HTML tags and decode entities from description text"""
        if pd.isna(text) or text == "" or str(text).strip() == "":
            return ""

        text = str(text)
        text = re.sub(r"<[^>]+>", "", text)

        # Decode HTML entities
        text = html.unescape(text)
        # Clean up extra whitespace
        text = re.sub(r"\s+", " ", text).strip()

        return text

    # Clean up html description to english details
    df["description"] = (
        safe_string_clean(df["description"]) if "description" in df.columns else ""
    )
    df["description"] = (
        df["description"].apply(clean_html_description)
        if "description" in df.columns
        else ""
    )

    df["publication_type"] = (
        safe_string_clean(df["publication_type"])
        if "publication_type" in df.columns
        else ""
    )
    df["publication_type_other"] = (
        safe_string_clean(df["publication_type_other"])
        if "publication_type_other" in df.columns
        else ""
    )
    df["region"] = safe_string_clean(df["region"]) if "region" in df.columns else ""
    df["community_service_type"] = (
        safe_string_clean(df["community_service_type"])
        if "community_service_type" in df.columns
        else ""
    )
    df["university_committee_type"] = (
        safe_string_clean(df["university_committee_type"])
        if "university_committee_type" in df.columns
        else ""
    )

    # start_date will be taken from year ('2013' , 'Present' (Should map to 'Current')) + month ('01 (should map to 'January')',  'id' (skip))
    def format_date(year, month):
        """
        Format year and month into a readable date string.
        Returns empty string if year is 'id' (skip), NaN, null, or empty.
        """
        # Handle year - check for NaN, None, empty, or 'id'
        if (
            pd.isna(year)
            or year is None
            or str(year).strip().lower() in ["", "nan", "none", "null", "id"]
        ):
            return ""

        year_str = str(year).strip()
        if year_str.lower() == "present":
            year_str = "Current"
            return year_str

        # Handle month - check for NaN, None, empty, or 'id'
        if (
            pd.isna(month)
            or month is None
            or str(month).strip().lower() in ["", "nan", "none", "null", "id"]
        ):
            return year_str

        month_str = str(month).strip()
        # Map month numbers to month names
        month_mapping = {
            "01": "January",
            "02": "February",
            "03": "March",
            "04": "April",
            "05": "May",
            "06": "June",
            "07": "July",
            "08": "August",
            "09": "September",
            "10": "October",
            "11": "November",
            "12": "December",
            "1": "January",
            "2": "February",
            "3": "March",
            "4": "April",
            "5": "May",
            "6": "June",
            "7": "July",
            "8": "August",
            "9": "September",
        }

        if month_str in month_mapping:
            return f"{month_mapping[month_str]} {year_str}"
        elif month_str.lower() not in ["", "nan", "none", "null", "id"]:
            # If month is already a name or other format, use as is
            return f"{month_str} {year_str}"
        else:
            return year_str

    # Process start_date and end_date for dataframe A
    if "start_year" in df.columns and "start_month" in df.columns:
        df["start_date"] = df.apply(
            lambda row: format_date(row["start_year"], row["start_month"]), axis=1
        )
    elif "start_date" not in df.columns:
        df["start_date"] = ""

    if "end_year" in df.columns and "end_month" in df.columns:
        df["end_date"] = df.apply(
            lambda row: format_date(row["end_year"], row["end_month"]), axis=1
        )
    elif "end_date" not in df.columns:
        df["end_date"] = ""

    # Ensure start_date and end_date are strings for dataframe A
    df["start_date"] = df["start_date"].astype(str).fillna("").str.strip()
    df["end_date"] = df["end_date"].astype(str).fillna("").str.strip()

    # Combine start and end dates into a single 'dates' column
    # Only show ranges when both dates exist, avoid empty dashes
    def combine_dates(row):
        # Safely get start and end dates, handling NaN/None
        start = str(row["start_date"]) if pd.notna(row["start_date"]) else ""
        end = str(row["end_date"]) if pd.notna(row["end_date"]) else ""

        # Clean the strings
        start = start.strip() if start not in ["nan", "None", "null", "NULL"] else ""
        end = end.strip() if end not in ["nan", "None", "null", "NULL"] else ""

        if start and end:
            return f"{start} - {end}"
        elif start:
            return start
        elif end:
            return end
        else:
            return ""

    df["dates"] = df.apply(combine_dates, axis=1)

    # Comprehensive replacement of NaN, None, and string representations with empty strings
    df = df.fillna("").replace(["nan", "None", "null", "NULL", np.nan, None], "")
    return df


def storeData(
    df, connection, cursor, errors, rows_processed, rows_added_to_db, section_title
):
    """
    Store the cleaned DataFrame into the database.
    Returns updated rows_processed and rows_added_to_db.
    """
    # Query for the data_section_id where title contains section_title (case insensitive)
    try:
        cursor.execute(
            """
            SELECT data_section_id FROM data_sections
            WHERE title = %s
            LIMIT 1
            """,
            (section_title,),
        )
        result = cursor.fetchone()
        if result:
            data_section_id = result[0]
        else:
            errors.append(f"No data_section_id found for '{section_title}'")
            data_section_id = None
    except Exception as e:
        errors.append(f"Error fetching data_section_id: {str(e)}")
        data_section_id = None

    if not data_section_id:
        errors.append("Skipping insert: data_section_id not found.")
        return rows_processed, rows_added_to_db

    for i, row in df.iterrows():
        row_dict = row.to_dict()
        # Remove user_id from data_details
        row_dict.pop("user_id", None)

        # Ensure all values are clean strings, not NaN or None
        clean_row_dict = {}
        for key, value in row_dict.items():
            if pd.isna(value) or value is None:
                clean_row_dict[key] = ""
            elif str(value).lower() in ["nan", "none", "null"]:
                clean_row_dict[key] = ""
            else:
                clean_row_dict[key] = str(value).strip()

        data_details_JSON = json.dumps(clean_row_dict)
        try:
            cursor.execute(
                """
                INSERT INTO user_cv_data (user_id, data_section_id, data_details, editable)
                VALUES (%s, %s, %s, %s)
                """,
                (row["user_id"], data_section_id, data_details_JSON, True),
            )
            rows_added_to_db += 1
        except Exception as e:
            errors.append(f"Error inserting row {i}: {str(e)}")
        finally:
            rows_processed += 1
    connection.commit()
    return rows_processed, rows_added_to_db


"""
Fetch the raw csv data from s3
:param bucket: str, the name of the target bucket
:param key_raw: str, the key (path) to the raw csv file
:return StringIO file-like object
"""


def fetchFromS3(bucket, key):
    s3 = boto3.resource("s3")
    s3_bucket_raw = s3.Object(bucket, key)
    response = s3_bucket_raw.get()
    file_bytes = response["Body"].read()
    return file_bytes


def loadData(file_bytes, file_key):
    """
    Loads a DataFrame from file bytes based on file extension (.csv or .xlsx).
    Handles CSV, JSON lines, and JSON array files.
    """
    if file_key.lower().endswith(".xlsx"):
        return pd.read_excel(io.BytesIO(file_bytes))
    elif file_key.lower().endswith(".csv"):
        # Try reading as regular CSV first
        try:
            df = pd.read_csv(
                io.StringIO(file_bytes.decode("utf-8")), skiprows=0, header=0
            )

            # Check if the first column name starts with '[{' - indicates JSON data in CSV
            if len(df.columns) > 0 and df.columns[0].startswith("[{"):
                print("Detected JSON data in CSV format, attempting to parse as JSON")
                # Read the entire file content as text and try to parse as JSON
                file_content = file_bytes.decode("utf-8").strip()

                # Try to parse as JSON array directly
                try:
                    import json

                    json_data = json.loads(file_content)
                    return pd.DataFrame(json_data)
                except json.JSONDecodeError:
                    # If that fails, try reading as JSON lines
                    try:
                        return pd.read_json(io.StringIO(file_content), lines=True)
                    except:
                        # Last resort - reconstruct the JSON from the broken CSV
                        # Combine all columns back into a single JSON string
                        combined_json = "".join(df.columns.tolist())
                        if len(df) > 0:
                            # Add the data rows
                            for _, row in df.iterrows():
                                row_data = " ".join(
                                    [str(val) for val in row.values if pd.notna(val)]
                                )
                                combined_json += " " + row_data

                        try:
                            json_data = json.loads(combined_json)
                            return pd.DataFrame(json_data)
                        except:
                            raise ValueError(
                                "Could not parse malformed JSON in CSV file"
                            )

            return df

        except Exception as csv_exc:
            print(f"Failed to read as CSV: {csv_exc}")
            # Try reading as JSON lines (NDJSON)
            try:
                return pd.read_json(io.StringIO(file_bytes.decode("utf-8")), lines=True)
            except Exception as jsonl_exc:
                print(f"Failed to read as JSON lines: {jsonl_exc}")
                # Try reading as JSON array
                try:
                    return pd.read_json(io.StringIO(file_bytes.decode("utf-8")))
                except Exception as json_exc:
                    print(f"Failed to read as JSON array: {json_exc}")
                    raise ValueError(
                        f"Could not parse file as CSV, JSON lines, or JSON array. "
                        f"CSV error: {csv_exc}, JSON lines error: {jsonl_exc}, JSON array error: {json_exc}"
                    )
    else:
        raise ValueError("Unsupported file type. Only CSV and XLSX are supported.")


def lambda_handler(event, context):
    """
    Processes manual upload file (CSV or Excel) uploaded to S3
    Reads file with pandas, transforms, and adds to database (like grants flow)
    """
    try:
        # Parse S3 event
        s3_event = event["Records"][0]["s3"]
        bucket_name = s3_event["bucket"]["name"]
        file_key = s3_event["object"]["key"]

        print(f"Processing manual upload file: {file_key} from bucket: {bucket_name}")

        # Fetch file from S3 (as bytes)
        file_bytes = fetchFromS3(bucket=bucket_name, key=file_key)
        print("Data fetched successfully.")

        # Load data into DataFrame
        try:
            df = loadData(file_bytes, file_key)
            print("Data loaded successfully.")
        except ValueError as e:
            print(f"Error loading data: {str(e)}")
            return {"statusCode": 400, "status": "FAILED", "error": str(e)}

        # Clean the DataFrame
        dfA, dfB, dfC, dfD, dfE, dfF, dfG, dfH, dfI, dfJ, dfK, dfL, dfM, dfN, dfO, dfP, dfQ, dfR, dfS = cleanData(df)
        print("Data cleaned successfully.")

        # Connect to database
        connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
        cursor = connection.cursor()
        print("Connected to database")

        rows_processed = 0
        rows_added_to_db = 0
        errors = []

        # rows_processed, rows_added_to_db = storeData(dfA, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_A)
        # rows_processed, rows_added_to_db = storeData(dfB, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_B)
        # rows_processed, rows_added_to_db = storeData(dfC, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_C)
        # rows_processed, rows_added_to_db = storeData(dfD, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_D)
        # rows_processed, rows_added_to_db = storeData(dfE, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_E)
        # rows_processed, rows_added_to_db = storeData(dfF, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_F)
        # rows_processed, rows_added_to_db = storeData(dfG, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_G)
        # rows_processed, rows_added_to_db = storeData(dfH, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_H)

        # rows_processed, rows_added_to_db = storeData(dfI, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_I)
        # rows_processed, rows_added_to_db = storeData(dfJ, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_J)
        # rows_processed, rows_added_to_db = storeData(dfK, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_K)
        
        # rows_processed, rows_added_to_db = storeData(dfL, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_L)
        # rows_processed, rows_added_to_db = storeData(dfM, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_M)
        
        # rows_processed, rows_added_to_db = storeData(dfN, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_N)
        # rows_processed, rows_added_to_db = storeData(dfO, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_O)
        
        # rows_processed, rows_added_to_db = storeData(dfP, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_P)
        # rows_processed, rows_added_to_db = storeData(dfQ, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_Q)
        # rows_processed, rows_added_to_db = storeData(dfR, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_R)
        
        rows_processed, rows_added_to_db = storeData(dfS, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_S)

        print("Data stored successfully.")
        cursor.close()
        connection.close()

        # Clean up - delete the processed file
        s3_client.delete_object(Bucket=bucket_name, Key=file_key)
        print(f"Processed file {file_key}, and deleted from bucket {bucket_name}")

        result = {
            "statusCode": 200,
            "status": "COMPLETED",
            "total_rows": len(df),
            "rows_processed": rows_processed,
            "rows_added_to_database": rows_added_to_db,
            "errors": errors[:10] if errors else [],
        }

        print(f"Manual upload completed: {result}")
        return result

    except Exception as e:
        print(f"Error processing manual upload: {str(e)}")
        return {"statusCode": 500, "status": "FAILED", "error": str(e)}
