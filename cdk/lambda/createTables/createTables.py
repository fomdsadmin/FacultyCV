import boto3
import psycopg2
import json

# # TESTING PURPOSES
# session = boto3.Session(profile_name='abhi')
# sm_client = session.client('secretsmanager')

sm_client = boto3.client('secretsmanager')

def getCredentials():
    credentials = {}

    response = sm_client.get_secret_value(SecretId='facultyCV/credentials/dbCredentials')
    secrets = json.loads(response['SecretString'])
    credentials['username'] = secrets['username']
    credentials['password'] = secrets['password']
    credentials['host'] = secrets['host']
    credentials['db'] = secrets['dbname']
    return credentials

'''
Given a table name and a list of columns created using createColumn, returns a postgres query to create a table called table_name
with columns as defined in the columns list
'''
def createQuery(table_name, columns):
    query = 'CREATE TABLE IF NOT EXISTS public.' + table_name + ' ('
    for column in columns:
        query = query + column
    query = query + ');'
    return query

'''
Given a column_name, data type, constraints(eg. NOT NULL), and a boolean detailing whether the column is the last one to be added,
Returns a column section of a postgres create table query which can be fed into createQuery
'''        
def createColumn(column_name, columnType, constraints, final_column):
    column = column_name + ' ' + columnType + ' ' + constraints
    if not final_column:
        column = column + ', '
    return column

def lambda_handler(event, context):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    print("Connected to Database")
    cursor = connection.cursor()

    #Add extension to create UUID Fields
    query = 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'
    cursor.execute(query)

    # Create Users Table
    columns = []
    columns.append(createColumn('user_id', 'varchar', 'DEFAULT uuid_generate_v4() PRIMARY KEY', False))
    columns.append(createColumn('first_name', 'varchar', '', False))
    columns.append(createColumn('last_name', 'varchar', '', False))
    columns.append(createColumn('preferred_name', 'varchar', '', False))
    columns.append(createColumn('email', 'varchar', '', False))
    columns.append(createColumn('role', 'varchar', '', False))
    columns.append(createColumn('bio', 'varchar', '', False))
    columns.append(createColumn('rank', 'varchar', '', False))
    columns.append(createColumn('institution', 'varchar', '', False))
    columns.append(createColumn('primary_department', 'varchar', '', False))
    columns.append(createColumn('secondary_department', 'varchar', '', False))
    columns.append(createColumn('primary_faculty', 'varchar', '', False))
    columns.append(createColumn('secondary_faculty', 'varchar', '', False))
    columns.append(createColumn('primary_affiliation', 'varchar', '', False))
    columns.append(createColumn('secondary_affiliation', 'varchar', '', False))
    columns.append(createColumn('campus', 'varchar', '', False))
    columns.append(createColumn('keywords', 'varchar', '', False))
    columns.append(createColumn('institution_user_id', 'varchar', '', False))
    columns.append(createColumn('scopus_id', 'varchar', '', False))
    columns.append(createColumn('orcid_id', 'varchar', '', False))
    columns.append(createColumn('joined_timestamp', 'varchar', 'DEFAULT CURRENT_TIMESTAMP', True))  # Add this line
    query = createQuery('users', columns)
    cursor.execute(query)

    # Create Data Sections Table
    columns = []
    columns.append(createColumn('data_section_id', 'varchar', 'DEFAULT uuid_generate_v4() PRIMARY KEY', False))
    columns.append(createColumn('title', 'varchar', '', False))
    columns.append(createColumn('description', 'varchar', '', False))
    columns.append(createColumn('data_type', 'varchar', '', False))
    columns.append(createColumn('attributes', 'JSON', '', False))
    columns.append(createColumn('archive', 'boolean', 'DEFAULT false', True))
    query = createQuery('data_sections', columns)
    cursor.execute(query)

    # Create User CV Data Table
    columns = []
    columns.append(createColumn('user_cv_data_id', 'varchar', 'DEFAULT uuid_generate_v4() PRIMARY KEY', False))
    columns.append(createColumn('user_id', 'varchar', '', False))
    columns.append(createColumn('data_section_id', 'varchar', '', False))
    columns.append(createColumn('data_details', 'JSON', '', False))
    columns.append(createColumn('archive', 'boolean', 'DEFAULT false', False))
    columns.append(createColumn('archive_timestamp', 'timestamp', '', False))
    columns.append(createColumn('editable', 'boolean', '', True))
    query = createQuery('user_cv_data', columns)
    cursor.execute(query)

    # Create University Info Table
    columns = []
    columns.append(createColumn('university_info_id', 'varchar', 'DEFAULT uuid_generate_v4() PRIMARY KEY', False))
    columns.append(createColumn('type', 'varchar', '', False))
    columns.append(createColumn('value', 'varchar', '', True))
    query = createQuery('university_info', columns)
    cursor.execute(query)

    # Create User Connections Table
    columns = []
    columns.append(createColumn('user_connection_id', 'varchar', 'DEFAULT uuid_generate_v4() PRIMARY KEY', False))
    columns.append(createColumn('faculty_user_id', 'varchar', '', False))
    columns.append(createColumn('faculty_first_name', 'varchar', '', False))
    columns.append(createColumn('faculty_last_name', 'varchar', '', False))
    columns.append(createColumn('faculty_email', 'varchar', '', False))
    columns.append(createColumn('assistant_user_id', 'varchar', '', False))
    columns.append(createColumn('assistant_first_name', 'varchar', '', False))
    columns.append(createColumn('assistant_last_name', 'varchar', '', False))
    columns.append(createColumn('assistant_email', 'varchar', '', False))
    columns.append(createColumn('status', 'varchar', '', True))
    query = createQuery('user_connections', columns)
    cursor.execute(query)

    # Create Teaching Data Table to store bulk loaded teaching data
    columns = []
    columns.append(createColumn('teaching_data_id', 'varchar', 'DEFAULT uuid_generate_v4() PRIMARY KEY', False))
    columns.append(createColumn('year', 'varchar', '', False))
    columns.append(createColumn('session', 'varchar', '', False))
    columns.append(createColumn('course', 'varchar', '', False))
    columns.append(createColumn('description', 'varchar', '', False))
    columns.append(createColumn('scheduled_hours', 'int', '', False))
    columns.append(createColumn('class_size', 'int', '', False))
    columns.append(createColumn('lectures', 'int', '', False))
    columns.append(createColumn('tutorials', 'int', '', False))
    columns.append(createColumn('labs', 'int', '', False))
    columns.append(createColumn('other', 'int', '', False))
    columns.append(createColumn('institution_user_id', 'varchar', '', True))
    query = createQuery('teaching_data', columns)
    cursor.execute(query)

    # Create Grants Table to store bulk load grants data
    columns = []
    columns.append(createColumn('grant_id', 'varchar', 'DEFAULT uuid_generate_v4() PRIMARY KEY', False))
    columns.append(createColumn('first_name', 'varchar', '', False))
    columns.append(createColumn('last_name', 'varchar', '', False))
    columns.append(createColumn('keywords', 'varchar', '', False))
    columns.append(createColumn('agency', 'varchar', '', False))
    columns.append(createColumn('department', 'varchar', '', False))
    columns.append(createColumn('program', 'varchar', '', False))
    columns.append(createColumn('title', 'varchar', '', False))
    columns.append(createColumn('amount', 'int', '', False))
    columns.append(createColumn('dates', 'varchar', '', True))
    query = createQuery('grants', columns)
    cursor.execute(query)

    # Create Rise Table to store bulk load rise grants data
    columns = []
    columns.append(createColumn('rise_data_id', 'varchar', 'DEFAULT uuid_generate_v4() PRIMARY KEY', False))
    columns.append(createColumn('first_name', 'varchar', '', False))
    columns.append(createColumn('last_name', 'varchar', '', False))
    columns.append(createColumn('keywords', 'varchar', '', False))
    columns.append(createColumn('agency', 'varchar', '', False))
    columns.append(createColumn('department', 'varchar', '', False))
    columns.append(createColumn('program', 'varchar', '', False))
    columns.append(createColumn('title', 'varchar', '', False))
    columns.append(createColumn('amount', 'int', '', False))
    columns.append(createColumn('dates', 'varchar', '', True))
    query = createQuery('rise_data', columns)
    cursor.execute(query)

    # Create Templates Table
    columns = []
    columns.append(createColumn('template_id', 'varchar', 'DEFAULT uuid_generate_v4() PRIMARY KEY', False))
    columns.append(createColumn('title', 'varchar', '', False))
    columns.append(createColumn('data_section_ids', 'varchar', '', True))
    query = createQuery('templates', columns)
    cursor.execute(query)

    # Create Patents Table to store bulk load patents data
    columns = []
    columns.append(createColumn('patent_id', 'varchar', 'DEFAULT uuid_generate_v4() PRIMARY KEY', False))
    columns.append(createColumn('title', 'varchar', '', False))
    columns.append(createColumn('first_name', 'varchar', '', False))
    columns.append(createColumn('last_name', 'varchar', '', False))
    columns.append(createColumn('publication_number', 'varchar', '', False))
    columns.append(createColumn('publication_date', 'varchar', '', False))
    columns.append(createColumn('family_number', 'varchar', '', False))
    columns.append(createColumn('country_code', 'varchar', '', False))
    columns.append(createColumn('kind_code', 'varchar', '', False))
    columns.append(createColumn('classification', 'varchar', '', True))
    query = createQuery('patents', columns)
    cursor.execute(query)
    
    cursor.close()
    connection.commit()
    connection.close()
    print("Tables Created")

    return {
        'statusCode': 200,
        'body': json.dumps('Tables Created')
    }