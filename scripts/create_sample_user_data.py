import csv
from faker import Faker
import uuid
import random
fake = Faker()

ENTRIES = 20000

ranks = []
departments = []
faculties = []
affiliations = []
institutions = []
campus = []


with open('../docs/sample_data/university_info.csv') as file:
    for line in file:
        if line.startswith('Affiliation'):
            affiliations.append(line.split(',')[1][:-1])
        elif line.startswith('Campus'):
            campus.append(line.split(',')[1][:-1])
        elif line.startswith('Faculty'):
            faculties.append(line.split(',')[1][:-1])
        elif line.startswith('Institution'):
            institutions.append(line.split(',')[1][:-1])
        elif line.startswith('Department'):
            departments.append(line.split(',')[1][:-1])
        elif line.startswith('Rank'):
            ranks.append(line.split(',')[1][:-1])

with open('hr_data_sample.csv', 'w', newline='') as file:
    writer = csv.writer(file)
    fields = [ 'SNAPSHOT_DATE', 'PREFERRED_FIRST_NAME', 'PREFERRED_LAST_NAME', 'PREFERRED_FULL_NAME', 'INSITUTION_USER_ID', 'EMAIL_ADDRESS', 'PRIMARY_DEPARTMENT_AFFILIATION_ID', 'PRIMARY_DEPARTMENT_AFFILIATION', 'SECONDARY_DEPARTMENT_AFFILIATION_ID', 'SECONDARY_DEPARTMENT_AFFILIATION', 'PRIMARY_FACULTY_AFFILIATION_ID', 'PRIMARY_FACULTY_AFFILIATION', 'SECONDARY_FACULTY_AFFILIATION_ID', 'SECONDARY_FACULTY_AFFILIATION', 'PRIMARY_CAMPUS_LOCATION_ID', 'PRIMARY_CAMPUS_LOCATION', 'SECONDARY_CAMPUS_LOCATION_ID', 'SECONDARY_CAMPUS_LOCATION', 'PRIMARY_ACADEMIC_RANK', 'PRIMARY_ACADEMIC_TRACK_TYPE', 'PRIMARY_JOB_PROFILE_CODE', 'PRIMARY_JOB_PROFILE_NAME', 'SECONDARY_ACADEMIC_RANK', 'SECONDARY_ACADEMIC_TRACK_TYPE', 'SECONDARY_JOB_PROFILE_CODE', 'SECONDARY_JOB_PROFILE_NAME']
    writer.writerow(fields)
    for i in range(ENTRIES):
        entry = []
        entry.append('7/6/2024')
        name = fake.name()
        while len(name.split(' ')) != 2:
            name = fake.name()
        first_name = name.split(' ')[0]
        last_name = name.split(' ')[1]
        entry.append(first_name)
        entry.append(last_name)
        entry.append(name)
        entry.append(uuid.uuid4())
        entry.append(f"{first_name.lower()}.{last_name.lower()}@example.com")

        prim_dept_num = random.randint(0,len(departments)-1) 
        entry.append(departments[prim_dept_num].upper())
        entry.append(departments[prim_dept_num])
        sec_dept_num = random.randint(0,len(departments)-1)
        entry.append(departments[sec_dept_num].upper())
        entry.append(departments[sec_dept_num])

        prim_fac_num = random.randint(0,len(faculties)-1)
        entry.append(faculties[prim_fac_num].upper())
        entry.append(faculties[prim_fac_num])
        sec_fac_num = random.randint(0,len(faculties)-1)
        entry.append(faculties[sec_fac_num].upper())
        entry.append(faculties[sec_fac_num])

        prim_campus_loc_num = random.randint(0, len(campus)-1)
        entry.append(campus[prim_campus_loc_num].upper())
        entry.append(campus[prim_campus_loc_num])
        sec_campus_loc_num = random.randint(0, len(campus)-1)
        entry.append(campus[sec_campus_loc_num].upper())
        entry.append(campus[sec_campus_loc_num])

        my_rank = ranks[random.randint(0, len(ranks)-1)]
        entry.append(my_rank)
        entry.append(['Tenure', 'Visiting', 'Clinical', 'Term'][random.randint(0,3)])
        entry.append(f"job_prof_code{random.randint(0,5)}")
        entry.append(my_rank)

        my_rank = ranks[random.randint(0, len(ranks)-1)]
        entry.append(my_rank)
        entry.append(['Tenure', 'Visiting', 'Clinical', 'Term'][random.randint(0,3)])
        entry.append(f"job_prof_code{random.randint(0,5)}")
        entry.append(my_rank)

        writer.writerow(entry)
        









        