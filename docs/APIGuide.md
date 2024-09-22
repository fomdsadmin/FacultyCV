# API Guide

This is a guide for the FacultyCV GraphQL API. It includes all the queries and mutations for the API along with descriptions, arguments and return values for each of them.

# Queries
- [getAllUsers](#getallusers)
- [getAllSections](#getallsections)
- [getArchivedSections](#getarchivedsections)
- [getUser](#getuser)
- [getUserInstitutionId](#getuserinstitutionid)
- [getExistingUser](#getexistinguser)
- [getUserCVData](#getusercvdata)
- [getArchivedUserCVData](#getarchivedusercvdata)
- [getAllUniversityInfo](#getalluniversityinfo)
- [getElsevierAuthorMatches](#getelseviersuthormatches)
- [getOrcidAuthorMatches](#getorcidauthormatches)
- [getUserConnections](#getuserconnections)
- [getAllTemplates](#getalltemplates)
- [getTeachingDataMatches](#getteachingdatamatches)
- [getPublicationMatches](#getpublicationmatches)
- [getSecureFundingMatches](#getsecurefundingmatches)
- [getRiseDataMatches](#getrisedatamatches)
- [getPatentMatches](#getpatentmatches)
- [getPresignedUrl](#getpresignedurl)
- [getNumberOfGeneratedCVs](#getnumberofgeneratedcvs)
- [cvIsUpToDate](#cvisuptodate)

# getAllUsers

## Description:
Fetches all users from the database.

## Arguments:
None

## Return Value:
An array of user objects containing the following information:
  - "user_id": "string",
  - "first_name": "string",
  - "last_name": "string",
  - "preferred_name": "string",
  - "email": "string",
  - "role": "string",
  - "bio": "string",
  - "rank": "string",
  - "primary_department": "string",
  - "secondary_department": "string",
  - "primary_faculty": "string",
  - "secondary_faculty": "string",
  - "campus": "string",
  - "keywords": "string[]",
  - "institution_user_id": "string",
  - "scopus_id": "string",
  - "orcid_id": "string",
  - "joined_timestamp": "string"

# getAllSections

## Description:
Fetches all sections that are part of the schema.

## Arguments:
None

## Return Value:
An array of section objects containing the following information:
  - "attributes": JSON object with placeholder value - used to determine the structure (and not the actual data) of the section,
  - "dataSectionId": "string",
  - "data_type": "string",
  - "description": "string",
  - "title": "string"

# getArchivedSections

## Description:
Fetches all archived sections that are part of the schema.

## Arguments:
None

## Return Value:
An array of archived section objects containing the following information:
  - "attributes": JSON object with placeholder value - used to determine the structure (and not the actual data) of the section,
  - "dataSectionId": "string",
  - "data_type": "string",
  - "description": "string",
  - "title": "string"

# getUser

## Description:
Fetches user data based on the provided email.

## Arguments:
- "email": "string"

## Return Value:
A user object containing the following information:
  - "user_id": "string",
  - "first_name": "string",
  - "last_name": "string",
  - "preferred_name": "string",
  - "email": "string",
  - "role": "string",
  - "bio": "string",
  - "rank": "string",
  - "primary_department": "string",
  - "secondary_department": "string",
  - "primary_faculty": "string",
  - "secondary_faculty": "string",
  - "campus": "string",
  - "keywords": "string[]",
  - "scopus_id": "string",
  - "orcid_id": "string"

# getUserInstitutionId

## Description:
Fetches user data with institution_user_id based on the provided email.

## Arguments:
- "email": "string"

## Return Value:
A user object containing the following information:
  - "user_id": "string",
  - "first_name": "string",
  - "last_name": "string",
  - "preferred_name": "string",
  - "email": "string",
  - "role": "string",
  - "bio": "string",
  - "rank": "string",
  - "primary_department": "string",
  - "secondary_department": "string",
  - "primary_faculty": "string",
  - "secondary_faculty": "string",
  - "institution_user_id": "string",
  - "campus": "string",
  - "keywords": "string[]",
  - "scopus_id": "string",
  - "orcid_id": "string"

# getExistingUser

## Description:
Fetches existing user data based on the provided institution_user_id.

## Arguments:
- "institution_user_id": "string"

## Return Value:
A user object containing the following information:
  - "user_id": "string",
  - "first_name": "string",
  - "last_name": "string",
  - "preferred_name": "string",
  - "email": "string",
  - "role": "string",
  - "bio": "string",
  - "rank": "string",
  - "primary_department": "string",
  - "secondary_department": "string",
  - "primary_faculty": "string",
  - "secondary_faculty": "string",
  - "campus": "string",
  - "keywords": "string[]",
  - "institution_user_id": "string",
  - "scopus_id": "string",
  - "orcid_id": "string"

# getUserCVData

## Description:
Fetches user CV data given the user ID and the data section ID(s).

## Arguments:
- "user_id": "string"
- "data_section_id": "string" (optional) - ID of the data section as returned by the getAllSections call
- "data_section_id_list": "string[]" (optional) - List of data section IDs to retrieve data for

Must specify one of the two optional arguments.

## Return Value:
A user CV data object containing the following information:
  - "user_cv_data_id": "string",
  - "user_id": "string",
  - "data_section_id": "string",
  - "data_details": "JSON string",
  - "editable": "boolean"

# getArchivedUserCVData

## Description:
Fetches the archived user CV data given the user ID.

## Arguments:
- "user_id": "string"

## Return Value:
An archived user CV data object containing the following information:
  - "user_cv_data_id": "string",
  - "user_id": "string",
  - "data_section_id": "string",
  - "data_details": "JSON string",
  - "archive": "boolean",
  - "archive_timestamp": "string",
  - "editable": "boolean"

# getAllUniversityInfo

## Description:
Fetches all university information.

## Arguments:
None

## Return Value:
An array of university info objects containing the following information:
  - "university_info_id": "string",
  - "type": "string",
  - "value": "string"

# getElsevierAuthorMatches

## Description:
Fetches potential matches for an author using the Elsevier API.

## Arguments:
- "first_name": "string"
- "last_name": "string"
- "institution_name": "string" (optional, specify empty string if omitting)

## Return Value:
An array of author match objects containing the following information:
  - "last_name": "string",
  - "first_name": "string",
  - "current_affiliation": "string",
  - "name_variants": "string[]",
  - "subjects": "string[]",
  - "scopus_id": "string",
  - "orcid": "string"

# getOrcidAuthorMatches

## Description:
Fetches potential matches for an author using the Orcid API.

## Arguments:
- "first_name": "string"
- "last_name": "string"
- "institution_name": "string" (optional, specify empty string if omitting)

## Return Value:
An array of author match objects containing the following information:
  - "last_name": "string",
  - "first_name": "string",
  - "credit_name": "string",
  - "name_variants": "string[]",
  - "keywords": "string[]",
  - "researcher_urls": "string[]",
  - "orcid_id": "string"

# getUserConnections

## Description:
Fetches user connections given the user ID.

## Arguments:
- "user_id": "string"
- "isFaculty": "boolean" (optional, defaults to true)

## Return Value:
An array of user connection objects containing the following information:
  - "user_connection_id": "string",
  - "faculty_user_id": "string",
  - "faculty_first_name": "string",
  - "faculty_last_name": "string",
  - "faculty_email": "string",
  - "assistant_user_id": "string",
  - "assistant_first_name": "string",
  - "assistant_last_name": "string",
  - "assistant_email": "string",
  - "status": "string"

# getAllTemplates

## Description:
Fetches all templates.

## Arguments:
None

## Return Value:
An array of template objects containing the following information:
  - "template_id": "string",
  - "title": "string",
  - "data_section_ids": "string[]",
  - "start_year": "string",
  - "end_year": "string"

# getTeachingDataMatches

## Description:
Fetches teaching data matches from bulk loaded TTPS data given the institution user ID.

## Arguments:
- "institution_user_id": "string"

## Return Value:
An array of teaching data match objects containing the following information:
  - "teaching_data_id": "string",
  - "user_id": "string",
  - "data_details": "JSON string"

# getPublicationMatches

## Description:
Fetches publication matches using a user's Scopus ID.

## Arguments:
- "scopus_id": "string"
- "page_number": "int" - a zero-indexed page number to fetch data for
- "results_per_page": "int"

## Return Value:
An object containing the following information:
  - "publications":
    - "publication_id": "string"
    - "title": "string"
    - "cited_by": "int"
    - "keywords": "string[]"
    - "journal": "string"
    - "link": "string"
    - "doi": "string"
    - "year_published": "string"
    - "author_names": "string[]"
    - "author_ids": "string[]"
  - "total_results": "int"
  - "current_page": "int"
  - "total_pages": "int"

# getSecureFundingMatches

## Description:
Fetches secure funding matches from grants data.

## Arguments:
- "first_name": "string"
- "last_name": "string"

## Return Value:
An array of secure funding match objects containing the following information:
  - "secure_funding_id": "string",
  - "first_name": "string",
  - "last_name": "string",
  - "data_details": "JSON string"

# getRiseDataMatches

## Description:
Fetches rise data matches from rise data.

## Arguments:
- "first_name": "string"
- "last_name": "string"

## Return Value:
An array of rise data match objects containing the following information:
  - "rise_data_id": "string",
  - "first_name": "string",
  - "last_name": "string",
  - "data_details": "JSON string"

# getPatentMatches

## Description:
Fetches patent matches from patents data.

## Arguments:
- "first_name": "string"
- "last_name": "string"

## Return Value:
An array of patent match objects containing the following information:
  - "secure_funding_id": "string",
  - "first_name": "string",
  - "last_name": "string",
  - "data_details": "JSON string"

# getPresignedUrl

## Description:
Fetches a presigned URL authorized to PUT or GET an object to/from a dedicated partition in the CV S3 bucket for the tenant whose JWT token is passed.

## Arguments:
- "jwt": "string" - the JWT session token
- "fileKey": "string" - the key of the file to get the presigned URL for
- "type": "string" - the type of operation (PUT or GET)

## Return Value:
A string containing the presigned URL.

# getNumberOfGeneratedCVs

## Description:
Fetches the number of reports in the S3 bucket.

## Arguments:
None

## Return Value:
An integer representing the number of reports in the S3 bucket.

# cvIsUpToDate

## Description:
Checks if the CV needs updating.

## Arguments:
- "cognito_user_id": "string"
- "user_id": "string"
- "template_id": "string"

## Return Value:
A boolean indicating whether the CV is up to date (true or false).

# Mutations
- [addToUserGroup](#addtousergroup)
- [removeFromUserGroup](#removefromusergroup)
- [addUserCVData](#addusercvdata)
- [addSection](#addsection)
- [addUser](#adduser)
- [addUniversityInfo](#adduniversityinfo)
- [addUserConnection](#adduserconnection)
- [addTemplate](#addtemplate)
- [linkScopusId](#linkscopusid)
- [linkOrcid](#linkorcid)
- [linkTeachingData](#linkteachingdata)
- [linkPublication](#linkpublication)
- [updateUser](#updateuser)
- [updateSection](#updatesection)
- [updateUserCVData](#updateusercvdata)
- [updateUserCVDataArchive](#updateusercvdataarchive)
- [updateUniversityInfo](#updateuniversityinfo)
- [updateUserConnection](#updateuserconnection)
- [updateTemplate](#updatetemplate)
- [deleteUserConnection](#deleteuserconnection)
- [deleteTemplate](#deletetemplate)

# addToUserGroup

## Description:
Adds a user to a user group.

## Arguments:
- "userName": "string"
- "userGroup": "string"

## Return Value:
A string indicating the result of the operation.

# removeFromUserGroup

## Description:
Removes a user from a user group.

## Arguments:
- "userName": "string"
- "userGroup": "string"

## Return Value:
A string indicating the result of the operation.

# addUserCVData

## Description:
Adds user CV data - the section info associated with a user.

## Arguments:
- "user_id": "string" - ID of the user the profile belongs to
- "data_section_id": "string" - ID of the data section as returned by the getAllSections call
- "data_details": "JSON string"
- "editable": "boolean" (optional, defaults to true)

## Return Value:
A string saying "SUCCESS" if the call succeeded, anything else means the call failed.

# addSection

## Description:
Adds a section to the data_sections table.

## Arguments:
- "title": "string"
- "description": "string"
- "data_type": "string"
- "attributes": "JSON string" - with section data information

## Return Value:
A string saying "SUCCESS" if the call succeeded, anything else means the call failed.

# addUser

## Description:
Adds user data to the database.

## Arguments:
- "first_name": "string"
- "last_name": "string"
- "preferred_name": "string"
- "email": "string"
- "role": "string"
- "bio": "string"
- "rank": "string"
- "primary_department": "string"
- "secondary_department": "string"
- "primary_faculty": "string"
- "secondary_faculty": "string"
- "campus": "string"
- "keywords": "string[]"
- "institution_user_id": "string"
- "scopus_id": "string"
- "orcid_id": "string"

## Return Value:
A string saying "SUCCESS" if the call succeeded, anything else means the call failed.

# addUniversityInfo

## Description:
Adds university info to the university_info table.

## Arguments:
- "type": "string"
- "value": "string"

## Return Value:
A string saying "SUCCESS" if the call succeeded, anything else means the call failed.

# addUserConnection

## Description:
Adds user connections.

## Arguments:
- "faculty_user_id": "string" - ID of the faculty user
- "faculty_first_name": "string"
- "faculty_last_name": "string"
- "faculty_email": "string"
- "assistant_user_id": "string" - ID of the assistant user
- "assistant_first_name": "string"
- "assistant_last_name": "string"
- "assistant_email": "string"
- "status": "string"

## Return Value:
A string saying "SUCCESS" if the call succeeded, anything else means the call failed.

# addTemplate

## Description:
Adds a template.

## Arguments:
- "title": "string" - title of the template
- "data_section_ids": "string[]" - list of data section IDs
- "start_year": "string" - start year of the template
- "end_year": "string" - end year of the template

## Return Value:
A string saying "SUCCESS" if the call succeeded, anything else means the call failed.

# linkScopusId

## Description:
Links a user profile with a Scopus ID. Optionally, the ORCID can be specified if a match is found with the Scopus ID returned by the getElsevierAuthorMatches function call.

## Arguments:
- "user_id": "string"
- "scopus_id": "string"
- "orcid_id": "string" (optional)

## Return Value:
A string saying "Scopus ID linked successfully" if the call succeeded, anything else means the call failed.

# linkOrcid

## Description:
Links a user profile with an ORCID ID. To be used in conjunction with the getOrcidAuthorMatches function.

## Arguments:
- "user_id": "string"
- "orcid_id": "string"

## Return Value:
A string saying "Orcid ID linked successfully" if the call succeeded, anything else means the call failed.

# linkTeachingData

## Description:
Links bulk loaded teaching data to a profile.

## Arguments:
- "user_id": "string"
- "data_details": "JSON string"

## Return Value:
A string saying "Teaching data linked successfully" if the call succeeded, anything else means the call failed.

# linkPublication

## Description:
Links a publication to the user.

## Arguments:
- "user_id": "string"
- "data_details": "JSON string"

## Return Value:
A string saying "Publication linked successfully" if the call succeeded, anything else means the call failed.

# updateUser

## Description:
Updates user information.

## Arguments:
- "user_id": "string"
- "first_name": "string"
- "last_name": "string"
- "preferred_name": "string"
- "email": "string"
- "role": "string"
- "bio": "string"
- "rank": "string"
- "primary_department": "string"
- "secondary_department": "string"
- "primary_faculty": "string"
- "secondary_faculty": "string"
- "campus": "string"
- "keywords": "string[]"
- "institution_user_id": "string"
- "scopus_id": "string"
- "orcid_id": "string"

## Return Value:
A string saying "SUCCESS" if the call succeeded, anything else means the call failed.

# updateSection

## Description:
Updates a data section.

## Arguments:
- "data_section_id": "string" - ID of the data section
- "archive": "boolean"
- "attributes": "JSON string"

## Return Value:
A string saying "SUCCESS" if the call succeeded, anything else means the call failed.

# updateUserCVData

## Description:
Updates user CV data - the section info associated with a user.

## Arguments:
- "user_cv_data_id": "string" - ID of the user CV data
- "data_details": "JSON string"

## Return Value:
A string saying "SUCCESS" if the call succeeded, anything else means the call failed.

# updateUserCVDataArchive

## Description:
Updates user CV data - the archive status.

## Arguments:
- "user_cv_data_id": "string" - ID of the user CV data
- "archive": "boolean"

## Return Value:
A string saying "SUCCESS" if the call succeeded, anything else means the call failed.

# updateUniversityInfo

## Description:
Updates university info.

## Arguments:
- "university_info_id": "string"
- "type": "string"
- "value": "string"

## Return Value:
A string saying "SUCCESS" if the call succeeded, anything else means the call failed.

# updateUserConnection

## Description:
Updates user connections.

## Arguments:
- "user_connection_id": "string" - ID of the user connection
- "status": "string" - New status for the user connection

## Return Value:
A string saying "SUCCESS" if the call succeeded, anything else means the call failed.

# updateTemplate

## Description:
Updates a template.

## Arguments:
- "template_id": "string" - ID of the template
- "title": "string" - Title of the template
- "data_section_ids": "string[]" - List of data section IDs
- "start_year": "string" - Start year of the template
- "end_year": "string" - End year of the template

## Return Value:
A string saying "SUCCESS" if the call succeeded, anything else means the call failed.

# deleteUserConnection

## Description:
Deletes a user connection.

## Arguments:
- "user_connection_id": "string" - ID of the user connection

## Return Value:
A string saying "SUCCESS" if the call succeeded, anything else means the call failed.

# deleteTemplate

## Description:
Deletes a template.

## Arguments:
- "template_id": "string" - ID of the template

## Return Value:
A string saying "SUCCESS" if the call succeeded, anything else means the call failed.
