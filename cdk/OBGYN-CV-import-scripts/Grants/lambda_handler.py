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

SECTION_TITLE = "9[b-c]. Research or Equivalent Grants and Contracts"

def cleanData(df):
    """
    Cleans the input DataFrame by performing various transformations:
    """
    # Ensure relevant columns are string type before using .str methods
    for col in ["PhysicianID", "Granting Agency", "Under Review", "Details", "Funding Details", "COMP", "Amount", "Principal Investigator",
                "CoInvestigators", "Type", "Notes", "Footnote", "Highlight", "ShowFN", "TDate", "TDateEnd"]:
        if col in df.columns:
            df[col] = df[col].astype(str)
        else:
            print(f"Warning: Column '{col}' not found in DataFrame")

    df["user_id"] = df["PhysicianID"].fillna('').str.strip()

    # Handle Agency field 
    if "Granting Agency" in df.columns:
        df["agency"] = df["Granting Agency"].fillna('').str.strip()
        df["agency_raw"] = df["Granting Agency"].fillna('').str.strip()
        # Map agency - only do for non empty val
        def map_agency(agency_val):
            agency_original = agency_val
            agency_val = agency_val.lower().strip()
            if agency_val.strip() == '':
                return ''
            elif 'rise' in agency_val:
                return 'Rise'
            elif 'cfi' in agency_val or 'canadian foundation of innovation' in agency_val or 'canadian foundation for innovation' in agency_val:
                return 'CFI'
            elif 'cihr' in agency_val or 'canadian institutes of health research' in agency_val or 'canadian institute of health research' in agency_val:
                return 'CIHR'
            elif 'nserc' in agency_val or 'natural sciences and engineering research council' in agency_val or 'natural sciences and engineering research council of canada' in agency_val:
                return 'NSERC'
            elif 'sshrc' in agency_val or 'social sciences and humanities research council' in agency_val or 'social sciences and humanities research council of canada' in agency_val:
                return 'SSHRC'
            else:
                return 'Other (' + agency_original + ')'
        df["agency"] = df["agency_raw"].apply(map_agency)
    else:
        df["agency"] = ''  # Default to empty string

    df["title"] = df["Details"].fillna('').str.strip()
    
    # Handle comp field - only allow C or NC values
    df["comp_raw"] = df["COMP"].fillna('').str.strip()
    def map_comp(comp_val):
        comp_val = comp_val.upper().strip()
        if comp_val == 'C':
            return 'C'
        elif comp_val == 'NC':
            return 'NC'
        else:
            return ''  # Return empty string for invalid or empty values
    df["comp"] = df["comp_raw"].apply(map_comp)
    
    # Handle amount field - convert 0 values to empty string
    df["amount"] = df["Amount"].fillna('').str.strip()
    df["amount"] = df["amount"].apply(lambda x: '' if str(x).strip() == '0' or str(x).strip() == '0.0' else x)
    
    df["principal_investigator"] = df["Principal Investigator"].fillna('').str.strip()
    df["co-investigator"] = df["CoInvestigators"].fillna('').str.strip()
    
    if "Highlight" in df.columns:
        df["highlight"] = df["Highlight"].fillna('').astype(str).str.upper().str.strip() == 'TRUE'
    else:
        df["highlight"] = False
    df["highlight_-_notes"] = df["Funding Details"].fillna('').str.strip()
    
    if "ShowFN" in df.columns:
        df["footnote"] = df["ShowFN"].fillna('').astype(str).str.upper().str.strip() == 'TRUE'
    else:
        df["footnote"] = False
    df["footnote_-_notes"] = df["Footnote"].fillna('').str.strip()

    # Handle Type field - map to grant or contract (MUST come before status processing)
    if "Type" in df.columns:
        df["type_raw"] = df["Type"].fillna('').str.strip()
        # Map types to grant or contract
        def map_agency_type(type_val):
            type_val = type_val.lower().strip()
            if type_val.strip() == '':
                return ''
            if 'grant' in type_val:
                return 'Grant'
            elif 'contract' in type_val:
                return 'All Types Contract'
            else:
                return ''  # Default to empty string if unclear

        df["type"] = df["type_raw"].apply(map_agency_type)
    else:
        df["type"] = ''
        
    # Handle Status field - Only for Grants (from Under Review column) - MUST come after type processing
    if "Under Review" in df.columns:
        # Convert Under Review to boolean and map to status
        df["under_review_bool"] = df["Under Review"].fillna('').astype(str).str.upper().str.strip() == 'TRUE'
        df["status_-_only_for_grants"] = df["under_review_bool"].apply(lambda x: "Under Review" if x else "Approved")
        # Only keep status for grants, clear it for contracts
        df.loc[df["type"] == 'All Types Contract', "status_-_only_for_grants"] = ''
    else:
        df["status_-_only_for_grants"] = ''

    
    # Handle Dates field - convert Unix timestamps to date strings
    if "TDate" in df.columns:
        # Handle zero and negative timestamps - set as blank for invalid values
        df["TDate_clean"] = pd.to_numeric(df["TDate"], errors='coerce')
        df["start_date"] = df["TDate_clean"].apply(lambda x: 
            '' if pd.isna(x) or x <= 0 else 
            pd.to_datetime(x, unit='s', errors='coerce').strftime('%B, %Y') if not pd.isna(pd.to_datetime(x, unit='s', errors='coerce')) else ''
        )
        df["start_date"] = df["start_date"].fillna('').str.strip()
    else:
        df["start_date"] = ''
        
    if "TDateEnd" in df.columns:
        # Handle zero and negative timestamps - set as blank for invalid values (including zero)
        df["TDateEnd_clean"] = pd.to_numeric(df["TDateEnd"], errors='coerce')
        df["end_date"] = df["TDateEnd_clean"].apply(lambda x: 
            '' if pd.isna(x) or x <= 0 else  # Zero and negative are blank
            pd.to_datetime(x, unit='s', errors='coerce').strftime('%B, %Y') if not pd.isna(pd.to_datetime(x, unit='s', errors='coerce')) else ''
        )
        df["end_date"] = df["end_date"].fillna('').str.strip()
    else:
        df["end_date"] = ''

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
    df["dates"] = df.apply(combine_dates, axis=1)

    # Keep only the cleaned columns
    df = df[["user_id", "agency", "title", "comp", "amount", "principal_investigator", 
             "co-investigator", "type", "status_-_only_for_grants", "highlight", "highlight_-_notes", 
             "footnote", "footnote_-_notes", "dates"]]

    # Replace NaN with empty string for all columns
    df = df.replace({np.nan: ''})
    return df


def storeData(df, connection, cursor, errors, rows_processed, rows_added_to_db):
    """
    Store the cleaned DataFrame into the database.
    Returns updated rows_processed and rows_added_to_db.
    """
    # Query for the data_section_id where title contains SECTION_TITLE (case insensitive)
    try:
        cursor.execute(
            """
            SELECT data_section_id FROM data_sections
            WHERE title = %s
            LIMIT 1
            """,
            (SECTION_TITLE,)
        )
        result = cursor.fetchone()
        if result:
            data_section_id = result[0]
        else:
            errors.append(f"No data_section_id found for '{SECTION_TITLE}'")
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

        # Clean the DataFrame
        df = cleanData(df)
        print("Data cleaned successfully.")

        # Connect to database
        connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
        cursor = connection.cursor()
        print("Connected to database")

        rows_processed = 0
        rows_added_to_db = 0
        errors = []

        rows_processed, rows_added_to_db = storeData(df, connection, cursor, errors, rows_processed, rows_added_to_db)
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

