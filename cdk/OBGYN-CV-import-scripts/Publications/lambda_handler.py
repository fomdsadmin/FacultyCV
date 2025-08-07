import pandas as pd
import numpy as np
import io
import boto3
import os
import psycopg2
import json
from datetime import datetime
from databaseConnect import get_connection

s3_client = boto3.client("s3")
sm_client = boto3.client('secretsmanager')
cognito_client = boto3.client('cognito-idp')
DB_PROXY_ENDPOINT = os.environ.get('DB_PROXY_ENDPOINT')
USER_POOL_ID = os.environ.get('USER_POOL_ID')

SECTION_TITLE_OTHER = "Other Publications"
SECTION_TITLE_PATENTS = "Patents"

# Combine start and end dates into a single 'dates' column
# Only show ranges when both dates exist, avoid empty dashes
def combine_dates(row):
    start = row["start_date"].strip()
    end = row["end_date"].strip()
        
    if start and end:
        return f"{start} - {end}"
    elif start:
        return start
    elif end:
        return end
    else:
        return ""

def cleanData(df):
    """
    Cleans the input DataFrame by performing various transformations:
    Returns two DataFrames: other_pubs_df for publications section, patents_df for patents section
    """
    # Ensure relevant columns are string type before using .str methods
    for col in ["PhysicianID", "Authors", "Title", "Citation", "Peer Reviewed", "Publication Status", "Role", "RoleOther",
                "Type", "TypeOther", "Notes"]:
        if col in df.columns:
            df[col] = df[col].astype(str)

    # --- Other Publications ---
    other_pubs_df = df.copy()
    other_pubs_df["user_id"] = other_pubs_df["PhysicianID"].fillna('').str.strip()
    other_pubs_df["authors"] = other_pubs_df["Authors"].fillna('').str.strip()
    other_pubs_df["title"] = other_pubs_df["Title"].fillna('').str.strip()
    other_pubs_df["citation"] = other_pubs_df["Citation"].fillna('').str.strip()
    other_pubs_df["publication_status"] = other_pubs_df["Publication Status"].fillna('').str.strip()
    
    # Handle Role and RoleOther logic - if Role is "Other:", set role to "Other ({role_other})"
    other_pubs_df["role_raw"] = other_pubs_df["Role"].fillna('').str.strip()
    other_pubs_df["role"] = other_pubs_df["role_raw"]
    if "RoleOther" in other_pubs_df.columns:
        other_pubs_df["role_other"] = other_pubs_df["RoleOther"].fillna('').str.strip()
        mask_other = other_pubs_df["role_raw"] == "Other:"
        other_pubs_df.loc[mask_other, "role"] = "Other (" + other_pubs_df.loc[mask_other, "role_other"] + ")"

    # Handle boolean peer reviewed
    if "Peer Reviewed" in other_pubs_df.columns:
        other_pubs_df["peer_reviewed"] = other_pubs_df["Peer Reviewed"].fillna('').str.strip().str.upper() == 'TRUE'
    else:
        other_pubs_df["peer_reviewed"] = False

    # Map publication types to match frontend dropdown expectations
    pub_type_map = {
        "Journals": "Journals",
        "Conference Proceedings": "Conference Proceedings", 
        "Abstracts": "Abstract",
        "Books": "Books",
        "Chapters": "Chapters",
        "Special Copyrights": "Special Copyrights",
        "Artistic Work:": "Artistic Work",
        "Other Publication:": "Other",
        "Other Work:": "Other",
        "Patents": "Patents",
    }
    
    def map_publication_type(type_value):
        if type_value.strip() == '':
            return ''
        
        type_clean = type_value.strip()
                
        # Check exact match first
        if type_clean in pub_type_map:
            return pub_type_map[type_clean]
                                
        # If no match found, treat as other
        return f"Other ({type_clean})"
    
    # Handle Type and TypeOther logic - map from "Type" column
    if "Type" in other_pubs_df.columns:
        other_pubs_df["publication_type"] = other_pubs_df["Type"].apply(map_publication_type)
    else:
        other_pubs_df["publication_type"] = ''
    
    print(f"Publication types before filtering: {other_pubs_df['publication_type'].value_counts()}")
    
    # Remove entries from df where Type is "Patents"
    initial_count = len(other_pubs_df)
    other_pubs_df = other_pubs_df[other_pubs_df["publication_type"] != "Patents"].reset_index(drop=True)
    final_count = len(other_pubs_df)
    print(f"Filtered out {initial_count - final_count} patents. Remaining other publications: {final_count}")
    
    other_pubs_df["highlight_-_notes"] = other_pubs_df["Notes"].fillna('').str.strip()        

    # Handle Dates field - convert Unix timestamps to date strings
    if "TDate" in other_pubs_df.columns:
        # Handle zero and negative timestamps - set as blank for invalid values
        other_pubs_df["TDate_clean"] = pd.to_numeric(other_pubs_df["TDate"], errors='coerce')
        other_pubs_df["start_date"] = other_pubs_df["TDate_clean"].apply(lambda x: 
            '' if pd.isna(x) or x <= 0 else 
            pd.to_datetime(x, unit='s', errors='coerce').strftime('%B, %Y') if not pd.isna(pd.to_datetime(x, unit='s', errors='coerce')) else ''
        )
        other_pubs_df["start_date"] = other_pubs_df["start_date"].fillna('').str.strip()
    else:
        other_pubs_df["start_date"] = ''
    if "TDateEnd" in other_pubs_df.columns:
        # Handle zero and negative timestamps - set as blank for invalid values (including zero)
        other_pubs_df["TDateEnd_clean"] = pd.to_numeric(other_pubs_df["TDateEnd"], errors='coerce')
        other_pubs_df["end_date"] = other_pubs_df["TDateEnd_clean"].apply(lambda x: 
            '' if pd.isna(x) or x <= 0 else  # Zero and negative are blank
            pd.to_datetime(x, unit='s', errors='coerce').strftime('%B, %Y') if not pd.isna(pd.to_datetime(x, unit='s', errors='coerce')) else ''
        )
        other_pubs_df["end_date"] = other_pubs_df["end_date"].fillna('').str.strip()
    else:
        other_pubs_df["end_date"] = ''

    other_pubs_df["dates"] = other_pubs_df.apply(combine_dates, axis=1)

    # Keep only the cleaned columns for other publications
    other_pubs_df = other_pubs_df[["user_id", "title", "citation", "role", "publication_type", "authors", 
                                   "peer_reviewed", "publication_status", "highlight_-_notes", "dates"]]

    # Replace NaN with empty string for all columns
    other_pubs_df = other_pubs_df.replace({np.nan: ''}).reset_index(drop=True)
    

    # --- Patents  ---
    patents = df.copy()
    # Filter to only include patents
    if "Type" in patents.columns:
        patents_initial_count = len(patents)
        patents = patents[patents["Type"].fillna('').str.strip() == "Patents"].reset_index(drop=True)
        patents_final_count = len(patents)
        print(f"Found {patents_final_count} patents out of {patents_initial_count} total records")
        
    patents["user_id"] = patents["PhysicianID"].fillna('').str.strip()
    patents["applicants"] = patents["Authors"].fillna('').str.strip()
    patents["title"] = patents["Title"].fillna('').str.strip()
    patents["citation"] = patents["Citation"].fillna('').str.strip()
    
    # Handle boolean peer reviewed
    if "Peer Reviewed" in patents.columns:
        patents["peer_reviewed"] = patents["Peer Reviewed"].fillna('').str.strip().str.upper() == 'TRUE'
    else:
        patents["peer_reviewed"] = False

    
    # Handle Dates field - convert Unix timestamps to date strings
    if "TDate" in patents.columns:
        # Handle zero and negative timestamps - set as blank for invalid values
        patents["TDate_clean"] = pd.to_numeric(patents["TDate"], errors='coerce')
        patents["year"] = patents["TDate_clean"].apply(lambda x: 
            '' if pd.isna(x) or x <= 0 else 
            pd.to_datetime(x, unit='s', errors='coerce').strftime('%Y') if not pd.isna(pd.to_datetime(x, unit='s', errors='coerce')) else ''
        )
        patents["year"] = patents["year"].fillna('').str.strip()
    else:
        patents["year"] = ''

    # Keep only the cleaned columns for patents
    patents = patents[["user_id", "title", "citation", "applicants", "peer_reviewed", "year"]]
    patents = patents.replace({np.nan: ''}).reset_index(drop=True)
    
    return other_pubs_df, patents


def storeData(df, connection, cursor, errors, rows_processed, rows_added_to_db, section_title):
    """
    Store the cleaned DataFrame into the database for a given section title.
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
            (section_title,)
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
        errors.append(f"Skipping insert: data_section_id not found for {section_title}.")
        return rows_processed, rows_added_to_db

    for i, row in df.iterrows():
        row_dict = row.to_dict()
        row_dict.pop('user_id', None)
        data_details_JSON = json.dumps(row_dict)
        try:
            cursor.execute(
                """
                INSERT INTO user_cv_data (user_id, data_section_id, data_details, editable)
                VALUES (%s, %s, %s, %s)
                """,
                (row['user_id'], data_section_id, data_details_JSON, True)
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
    s3 = boto3.resource('s3')
    s3_bucket_raw = s3.Object(bucket, key)
    response = s3_bucket_raw.get()
    file_bytes = response["Body"].read()
    return file_bytes

def loadData(file_bytes, file_key):
    """
    Loads a DataFrame from file bytes based on file extension (.csv or .xlsx).
    Handles CSV, JSON lines, and JSON array files.
    """
    if file_key.lower().endswith('.xlsx'):
        return pd.read_excel(io.BytesIO(file_bytes))
    elif file_key.lower().endswith('.csv'):
        # Try reading as regular CSV first
        try:
            df = pd.read_csv(io.StringIO(file_bytes.decode('utf-8')), skiprows=0, header=0)
            
            # Check if the first column name starts with '[{' - indicates JSON data in CSV
            if len(df.columns) > 0 and df.columns[0].startswith('[{'):
                print("Detected JSON data in CSV format, attempting to parse as JSON")
                # Read the entire file content as text and try to parse as JSON
                file_content = file_bytes.decode('utf-8').strip()
                
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
                        combined_json = ''.join(df.columns.tolist())
                        if len(df) > 0:
                            # Add the data rows
                            for _, row in df.iterrows():
                                row_data = ' '.join([str(val) for val in row.values if pd.notna(val)])
                                combined_json += ' ' + row_data
                        
                        try:
                            json_data = json.loads(combined_json)
                            return pd.DataFrame(json_data)
                        except:
                            raise ValueError("Could not parse malformed JSON in CSV file")
            
            return df
            
        except Exception as csv_exc:
            print(f"Failed to read as CSV: {csv_exc}")
            # Try reading as JSON lines (NDJSON)
            try:
                return pd.read_json(io.StringIO(file_bytes.decode('utf-8')), lines=True)
            except Exception as jsonl_exc:
                print(f"Failed to read as JSON lines: {jsonl_exc}")
                # Try reading as JSON array
                try:
                    return pd.read_json(io.StringIO(file_bytes.decode('utf-8')))
                except Exception as json_exc:
                    print(f"Failed to read as JSON array: {json_exc}")
                    raise ValueError(
                        f"Could not parse file as CSV, JSON lines, or JSON array. "
                        f"CSV error: {csv_exc}, JSON lines error: {jsonl_exc}, JSON array error: {json_exc}"
                    )
    else:
        raise ValueError('Unsupported file type. Only CSV and XLSX are supported.')

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
            return {
                'statusCode': 400,
                'status': 'FAILED',
                'error': str(e)
            }

        # Clean the DataFrame (returns two DataFrames)
        other_pubs_df, patents_df = cleanData(df)
        print("Data cleaned successfully.")

        # Connect to database
        connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
        cursor = connection.cursor()
        print("Connected to database")

        rows_processed = 0
        rows_added_to_db = 0
        errors = []

        # Store other publications data
        if not other_pubs_df.empty:
            rows_processed, rows_added_to_db = storeData(
                other_pubs_df, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_OTHER
            )
        
        # Store patents data (as separate section)
        if not patents_df.empty:
            rows_processed, rows_added_to_db = storeData(
                patents_df, connection, cursor, errors, rows_processed, rows_added_to_db, SECTION_TITLE_PATENTS
            )
        print("Data stored successfully.")
        cursor.close()
        connection.close()

        # Clean up - delete the processed file
        s3_client.delete_object(Bucket=bucket_name, Key=file_key)
        print(f"Processed file {file_key}, and deleted from bucket {bucket_name}")


        result = {
            'statusCode': 200,
            'status': 'COMPLETED',
            'total_rows': len(df),
            'rows_processed': rows_processed,
            'rows_added_to_database': rows_added_to_db,
            'errors': errors[:10] if errors else []
        }

        print(f"Manual upload completed: {result}")
        return result

    except Exception as e:
        print(f"Error processing manual upload: {str(e)}")
        return {
            'statusCode': 500,
            'status': 'FAILED',
            'error': str(e)
        }

