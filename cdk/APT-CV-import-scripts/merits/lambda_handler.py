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

def cleanData(df):
    """
    Cleans the input DataFrame for declarations data and maps CSV columns to database structure.
    Expected CSV columns:
    - user_id
    - reporting_year
    - considered_for_merit 
    - considered_for_psa
    - considered_for_promotion
    - conflict_of_commitment_declaration 
    - fom_chair_professorship_impact_report
    - created (date format: YYYY-MM-DD HH:MM:SS, e.g., 2022-06-07 21:54:33)
    """
    declarations = df.copy()
    
    # Helper function to process user_id with unique transformation
    def process_user_id(x):
        """Apply transformation to make user IDs unique - add 534234 to avoid conflicts"""
        if pd.isna(x) or x == '' or str(x).strip() == '' or str(x) == 'nan':
            return ""
        try:
            original_id = int(float(x))  # Handle cases like "123.0"
            # Apply transformation to make unique - add 534234 to avoid conflicts with existing IDs
            unique_id = original_id + 534234
            return str(unique_id)
        except (ValueError, TypeError):
            return str(x).strip()  # If conversion fails, return as string
    
    # Process user_id - keep as string since declarations table expects string
    declarations["user_id"] = declarations["user_id"].apply(process_user_id)
    
    # Helper function to safely clean string columns
    def safe_string_clean(series):
        """Safely clean a pandas series, handling NaN, None, and string representations"""
        return series.fillna('').astype(str).replace(['nan', 'None', 'null', 'NULL'], '').str.strip()
    
    # Parse the created date for all submission dates
    def parse_created_date(created_str):
        """Parse created date (2021-12-15 23:26:59) and return YYYY-MM-DD format"""
        if pd.isna(created_str) or str(created_str).strip() in ['', 'nan', 'None', 'null', 'NULL']:
            return ""
        try:
            # Parse datetime and return just the date part
            dt = datetime.strptime(str(created_str).strip(), "%Y-%m-%d %H:%M:%S")
            return dt.strftime("%Y-%m-%d")
        except (ValueError, TypeError):
            try:
                # Try alternative format without time
                dt = datetime.strptime(str(created_str).strip(), "%Y-%m-%d")
                return dt.strftime("%Y-%m-%d")
            except:
                return ""
    
    # We'll parse the created date for each row individually
    
    # Map considered_for_merit values to YES/NO
    def map_merit_values(value):
        if pd.isna(value) or str(value).strip() in ['', 'nan', 'None', 'null', 'NULL']:
            return "YES"  # Default to YES as per frontend
        value_str = str(value).strip().lower()
        if "do not wish" in value_str or "do not" in value_str:
            return "NO"
        else:
            return "YES"
    
    # Map considered_for_psa values to YES/NO  
    def map_psa_values(value):
        if pd.isna(value) or str(value).strip() in ['', 'nan', 'None', 'null', 'NULL']:
            return "YES"  # Default to YES as per frontend
        value_str = str(value).strip().lower()
        if "do not wish" in value_str or "do not" in value_str:
            return "NO"
        else:
            return "YES"
    
    # Map considered_for_promotion values to YES/NO
    def map_promotion_values(value):
        if pd.isna(value) or str(value).strip() in ['', 'nan', 'None', 'null', 'NULL']:
            return ""  # No default for promotion
        value_str = str(value).strip().lower()
        if "do not wish" in value_str or "do not" in value_str:
            return "NO"
        else:
            return "YES"
    
    # Map conflict_of_commitment_declaration values to YES/NO
    def map_coi_values(value):
        if pd.isna(value) or str(value).strip() in ['', 'nan', 'None', 'null', 'NULL']:
            return ""  # No default for COI
        value_str = str(value).strip().lower()
        if "not up to date" in value_str or "are not up to date" in value_str:
            return "NO"
        else:
            return "YES"
    
    # Process each row to create declaration records
    declaration_records = []
    
    for _, row in declarations.iterrows():
        if pd.isna(row['user_id']) or str(row['user_id']).strip() == '':
            continue  # Skip rows without user_id
        if pd.isna(row.get('reporting_year')) or str(row.get('reporting_year')).strip() == '':
            continue  # Skip rows without reporting_year
            
        # Parse the created date for this specific row
        row_submission_date = parse_created_date(row.get('created', ''))
            
        # Create other_data JSON structure matching frontend format
        other_data = {
            "conflict_of_interest": map_coi_values(row.get('conflict_of_commitment_declaration', '')).lower(),
            "coi_submission_date": row_submission_date,
            "fom_merit": map_merit_values(row.get('considered_for_merit', '')).lower(),
            "psa_awards": map_psa_values(row.get('considered_for_psa', '')).lower(),
            "psa_submission_date": row_submission_date,
            "fom_promotion_review": map_promotion_values(row.get('considered_for_promotion', '')).lower(),
            "promotion_submission_date": row_submission_date,
            "promotion_pathways": "",  # Not in CSV
            "promotion_effective_date": int(row.get('reporting_year', 0)) + 1 if not pd.isna(row.get('reporting_year')) else 0,
            "fom_honorific_impact_report": safe_string_clean(pd.Series([row.get('fom_chair_professorship_impact_report', '')])).iloc[0],
            "support_anticipated": "",  # Not in CSV
            "updated_at": None
        }
        
        declaration_record = {
            'user_id': str(row['user_id']),
            'reporting_year': int(row.get('reporting_year', 0)) if not pd.isna(row.get('reporting_year')) else 0,
            'created_by': row.get('created_by', ''),
            'other_data': other_data
        }
        
        declaration_records.append(declaration_record)
    
    return pd.DataFrame(declaration_records)


def storeData(df, connection, cursor, errors, rows_processed, rows_added_to_db):
    """
    Store the cleaned DataFrame of declarations into the declarations table.
    Returns updated rows_processed and rows_added_to_db.
    """
    for i, row in df.iterrows():
        try:
            # Check if declaration already exists for this user and year
            cursor.execute(
                "SELECT COUNT(*) FROM declarations WHERE user_id = %s AND reporting_year = %s",
                (str(row['user_id']), row['reporting_year'])
            )
            existing_count = cursor.fetchone()[0]
            
            if existing_count > 0:
                # Update existing declaration
                cursor.execute(
                    """
                    UPDATE declarations 
                    SET other_data = %s, created_by = %s 
                    WHERE user_id = %s AND reporting_year = %s
                    """,
                    (
                        json.dumps(row['other_data']),
                        row['created_by'],
                        str(row['user_id']),
                        row['reporting_year']
                    )
                )
            else:
                # Insert new declaration
                cursor.execute(
                    """
                    INSERT INTO declarations (
                        user_id,
                        reporting_year,
                        created_by,
                        other_data
                    ) VALUES (%s, %s, %s, %s)
                    """,
                    (
                        str(row['user_id']),
                        row['reporting_year'],
                        row['created_by'],
                        json.dumps(row['other_data'])
                    )
                )
            rows_added_to_db += 1
        except Exception as e:
            errors.append(f"Error processing declaration for user {row['user_id']}, year {row['reporting_year']}: {str(e)}")
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
    Processes declarations CSV file uploaded to S3
    Reads CSV file with pandas, transforms the data to match frontend structure,
    and stores declarations in the declarations table
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
            
            # Validate required columns
            required_columns = ['user_id', 'reporting_year']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                raise ValueError(f"Missing required columns: {missing_columns}")
                
            print(f"DataFrame columns: {list(df.columns)}")
            print(f"DataFrame shape: {df.shape}")
            
        except ValueError as e:
            print(f"Error loading data: {str(e)}")
            return {
                'statusCode': 400,
                'status': 'FAILED',
                'error': str(e)
            }

        # Clean the DataFrame
        declarations_df = cleanData(df)
        print("Data cleaned successfully.")

        # Connect to database
        connection = get_connection(psycopg2, DB_PROXY_ENDPOINT)
        cursor = connection.cursor()
        print("Connected to database")

        rows_processed = 0
        rows_added_to_db = 0
        errors = []

        rows_processed, rows_added_to_db = storeData(declarations_df, connection, cursor, errors, rows_processed, rows_added_to_db)
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

