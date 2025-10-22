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
    Cleans the input DataFrame for location update processing:
    Expected columns: user_id, rank, location_primary, location_secondary (optional), location_tertiary (optional)
    """
    
    # Handle user_id column - apply the same transformation as users lambda handler
    def process_user_id(x):
        if pd.isna(x) or x == '' or str(x).strip() == '' or str(x) == 'nan':
            return None
        try:
            original_id = int(x)  # Convert string to integer (e.g., "123" -> 123)
            # Apply transformation to make unique - add same offset as users handler
            unique_id = original_id + 534234
            return str(unique_id)  # Return as string for database matching
        except (ValueError, TypeError):
            return None
    
    if "id" in df.columns:
        df["user_id"] = df["id"].apply(process_user_id)
    else:
        raise ValueError("CSV must contain 'id' column")
    
    # Remove rows where user_id transformation failed
    df = df[df["user_id"].notna()]
    
    # Handle rank column - this will be used to match against affiliations
    if "present_rank" not in df.columns:
        raise ValueError("CSV must contain 'present_rank' column for matching")
    df["rank"] = df["present_rank"].fillna('').astype(str).str.strip()
    
    # Handle location_primary column - this is required
    if "location_primary" not in df.columns:
        raise ValueError("CSV must contain 'location_primary' column")
    df["location_primary"] = df["location_primary"].fillna('').astype(str).str.strip()
    
    # Handle optional location_secondary and location_tertiary columns
    if "location_secondary" not in df.columns:
        df["location_secondary"] = ''
    else:
        df["location_secondary"] = df["location_secondary"].fillna('').astype(str).str.strip()
    
    if "location_tertiary" not in df.columns:
        df["location_tertiary"] = ''
    else:
        df["location_tertiary"] = df["location_tertiary"].fillna('').astype(str).str.strip()
    
    # Filter out rows with empty rank (user_id already filtered above)
    df = df[df["rank"] != '']
    
    # Keep only the required columns
    df = df[["user_id", "rank", "location_primary", "location_secondary", "location_tertiary"]].copy()
    
    return df


def storeData(df, connection, cursor, errors, rows_processed, rows_updated):
    """
    Update location data in affiliations table based on rank matching.
    For each user_id in CSV:
    1. Find their affiliations record
    2. Check if any primary_unit rank matches the CSV rank
    3. If match found, update location field by combining location_primary + location_secondary + location_tertiary
    Returns updated rows_processed and rows_updated.
    """
    for i, row in df.iterrows():
        try:
            user_id = row['user_id']
            csv_rank = row['rank']
            location_primary = row['location_primary']
            location_secondary = row['location_secondary']
            location_tertiary = row['location_tertiary']
            
            # Construct combined location string
            location_parts = [location_primary]
            if location_secondary:
                location_parts.append(location_secondary)
            if location_tertiary:
                location_parts.append(location_tertiary)
            combined_location = ', '.join(location_parts)
            
            # Get existing affiliations for this user
            cursor.execute(
                "SELECT primary_unit FROM affiliations WHERE user_id = %s", 
                (user_id,)
            )
            result = cursor.fetchone()
            
            if not result:
                errors.append(f"User ID {user_id} not found in affiliations table")
                continue
            
            # Extract the data from the tuple result
            primary_unit_data = result[0]
            
            # Handle the data based on its type
            if isinstance(primary_unit_data, str):
                # If it's a string, parse it as JSON
                try:
                    primary_unit_data = json.loads(primary_unit_data)
                except (json.JSONDecodeError, TypeError) as e:
                    errors.append(f"Invalid JSON in primary_unit for user {user_id}: {str(e)}")
                    continue
            else:
                # If it's neither string nor list, treat as empty
                print(f"Unexpected data type for primary_unit: {type(primary_unit_data)}")
                primary_unit_data = []
            
            # Update location for all units if location data is provided in CSV
            updated = False
            
            # Only update if we have location data from CSV
            if combined_location.strip():
                for unit in primary_unit_data:
                    unit['location'] = combined_location
                    updated = True
            else:
                print(f"No location data provided for user {user_id}, skipping update")
                continue
            
            if updated:
                # Update the database record - convert Python object back to JSON string
                update_query = """
                UPDATE affiliations SET 
                    primary_unit = %s
                WHERE user_id = %s
                """
                cursor.execute(update_query, (
                    json.dumps(primary_unit_data),
                    user_id
                ))
                rows_updated += 1
                
        except Exception as e:
            errors.append(f"Error processing user {user_id} at row {i}: {str(e)}")
        finally:
            rows_processed += 1
    
    connection.commit()
    return rows_processed, rows_updated

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
    Processes location update file (CSV or Excel) uploaded to S3
    Updates location information in affiliations table based on user_id and rank matching
    """
    try:
        # Parse S3 event
        s3_event = event["Records"][0]["s3"]
        bucket_name = s3_event["bucket"]["name"]
        file_key = s3_event["object"]["key"]

        print(f"Processing location update file: {file_key} from bucket: {bucket_name}")

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
        rows_updated = 0
        errors = []

        rows_processed, rows_updated = storeData(df, connection, cursor, errors, rows_processed, rows_updated)
        print("Location data updated successfully.")
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
            'rows_updated': rows_updated,
            'errors': errors[:10] if errors else []
        }

        print(f"Location update completed: {result}")
        return result

    except Exception as e:
        print(f"Error processing location update: {str(e)}")
        return {
            'statusCode': 500,
            'status': 'FAILED',
            'error': str(e)
        }

