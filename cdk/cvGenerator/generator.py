import boto3
import botocore
import subprocess
import sys
import os
from pylatexenc.latexencode import unicode_to_latex
import time

def download_file_from_s3(bucket_name, s3_file_key, local_file_path):
    # Create a session using your AWS credentials
    session = boto3.Session()
    
    # Create an S3 resource
    s3 = session.resource('s3')

    try:
        # Download the file from S3
        s3.Bucket(bucket_name).download_file(s3_file_key, local_file_path)
        print(f"File downloaded successfully from S3 bucket '{bucket_name}' to '{local_file_path}'")
    except botocore.exceptions.ClientError as e:
        print(f"Error downloading file: {e}")

def sanitize_latex_file(file_path):
    with open(file_path, 'r') as file:
        content = file.read()

    # Replace only special characters that need to be escaped in LaTeX
    new_content = ''
    for ch in content:
        if 0 <= ord(ch) <= 127:
            new_content += ch
        else:
            new_content += unicode_to_latex(ch)

    with open(file_path, 'w') as file:
        file.write(new_content)

def runPdfLatex(file_name):
    try:
        subprocess.run(["lualatex", "-interaction=nonstopmode", file_name])
    except Exception as e:
        print(f"Error running pdflatex: {e}")
        
def convert_to_docx(input_tex, output_docx):
    try:
        result = subprocess.run(
            ["pandoc", input_tex, "-s", "-o", output_docx],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        print(f"DOCX file generated: {output_docx}")
    except subprocess.CalledProcessError as e:
        print("Pandoc conversion error:\n", e.stderr.decode())

def upload_file_to_s3(file_name, bucket_name, s3_file_key):
    # Create a session using your AWS credentials
    session = boto3.Session()

    # Create an S3 resource
    s3 = session.resource('s3')

    try:
        # Upload the file to S3
        s3.Bucket(bucket_name).upload_file(file_name, s3_file_key)
        print(f"File uploaded successfully to S3 bucket '{bucket_name}' with key '{s3_file_key}'")
    except botocore.exceptions.ClientError as e:
        print(f"Error uploading file: {e}")

        

def handler(event, context):

    os.chdir('/tmp/')

    bucket_name = event['Records'][0]['s3']['bucket']['name']
    s3_file_key = event['Records'][0]['s3']['object']['key']
    local_file_path = 'resume.tex'

    # If the file resume.pdf exists, delete it
    if os.path.exists('resume.pdf'):
        print("Old resume.pdf found, removing it!")
        os.remove('resume.pdf')
        
    # If the file resume.docx exists, delete it
    if os.path.exists('resume.docx'):
        print("Old resume.docx found, removing it!")
        os.remove('resume.docx')
       
    download_file_from_s3(bucket_name, s3_file_key, local_file_path)
    start = time.time()
    sanitize_latex_file(local_file_path)
    # For debugging purposes only
    # upload_file_to_s3(local_file_path, bucket_name, s3_file_key.replace('tex', 'txt'))
    end = time.time()
    print(f"Sanitization took {end - start} seconds")
    
    # Run pdflatex to generate the PDF
    runPdfLatex(local_file_path)
    
    # Convert LaTeX to DOCX using pandoc
    convert_to_docx(local_file_path, local_file_path.replace('tex', 'docx'))

    upload_file_to_s3(local_file_path.replace('tex', 'pdf'), bucket_name, s3_file_key.replace('tex', 'pdf'))
    upload_file_to_s3(local_file_path.replace('tex', 'docx'), bucket_name, s3_file_key.replace('tex', 'docx'))

    return {
        'status': 'SUCCEEDED'
    }



