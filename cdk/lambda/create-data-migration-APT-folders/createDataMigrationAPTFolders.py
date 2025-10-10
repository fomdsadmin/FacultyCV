import os
import boto3

# create the folder structure on S3 bucket for maual uploads
def lambda_handler(event, context):
    s3 = boto3.client("s3")
    bucket = os.environ.get("BUCKET_NAME")
    folders = [
        'APT/',
        'APT/approach_teachings/',
        'APT/categories/',
        'APT/cit',
        'APT/clinically_integrated_teachings/',
        'APT/continuing_education_activities/',
        'APT/continuing_education_trainings/',
        'APT/curriculum_development_innovations/',
        'APT/educational_conferences/',
        'APT/educational_leaderships/',
        'APT/efforts_improve_teachings/',
        'APT/employment_records/',
        'APT/leave_of_absences/',
        'APT/meritform/',
        'APT/merits/',
        'APT/other_teaching_learning_activities/',
        'APT/other_teachings/',
        'APT/other_types_scholarly_contributions/',
        'APT/research_equivalent_grants_contracts/',
        'APT/special_professional_qualifications/',
        'APT/supervising_advising_students/',
        'APT/teaching_awards/',
        'APT/templates/',
        'APT/trainee_awards/',
        'APT/ubc_courses/',
        'APT/university_institutions/',
        'APT/users/',
        'APT/mulesoft_users/',
        'APT/workday_users/',
        'APT/visiting_lecturers/',
    ]
    for folder in folders:
        s3.put_object(Bucket=bucket, Key=folder)

    print("Created all subfolders in 'APT/' folder")


