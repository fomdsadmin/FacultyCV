import os
import boto3

# create the folder structure on S3 bucket for maual uploads
def lambda_handler(event, context):
    s3 = boto3.client("s3")
    bucket = os.environ.get("BUCKET_NAME")
    folders = [
        'obgyn/',
        'obgyn/AuthorshipStatement/',
        'obgyn/Awards/',
        'obgyn/ClinicalTeaching/',
        'obgyn/CME/',
        'obgyn/CommitteeService/',
        'obgyn/CommunityService/',
        'obgyn/ContinuingEducation/',
        'obgyn/Contributions/',
        'obgyn/Education/',
        'obgyn/Grants/',
        'obgyn/Leave/',
        'obgyn/order/',
        'obgyn/OtherProfessionalAct/',
        'obgyn/OtherRelevantInfo/',
        'obgyn/OtherSpecializedTraining/',
        'obgyn/OtherTeachingUGGPG/',
        'obgyn/PositionHeld/',
        'obgyn/Presentations/',
        'obgyn/ProfessionalQuals/',
        'obgyn/Publications/',
        'obgyn/Publications_order/',
        'obgyn/SpecialInterests/',
        'obgyn/SupervisoryExperience/',
        'obgyn/TeachingInterests/',
        'obgyn/UBCCourses/',
        'obgyn/VisitOtherTeaching/',
        'obgyn/Doctors/',
        'obgyn/Users/'
    ]
    for folder in folders:
        s3.put_object(Bucket=bucket, Key=folder)

    print("Created all subfolders in 'obgyn/' folder")


