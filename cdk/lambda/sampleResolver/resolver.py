def lambda_handler(event, context):
    first_name = event['arguments']['firstName']
    last_name = event['arguments']['lastName']

    return {
        "facultyMemberId": "testId",
        "firstName": "Aayush",
        "preferredName": "",
        "lastName": "Behl",
        "email": "aayush.behl@ubc.ca",
        "currentRank": "Student",
        "primaryDepartment": "Faculty of Applied Science",
        "secondaryDepartment": "",
        "primaryFaculty": "Computer Engineering",
        "secondaryFaculty": "",
        "campus": "Vancouver",
        "keywords": "",
        "institutionUserId": "123",
        "scopusId": 1234,
        "orcidId": "12345"
    }