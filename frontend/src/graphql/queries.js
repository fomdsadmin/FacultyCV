export const GET_BIO_RESPONSE_DATA = `
    query GetBioResponseData($username_input: String!) {
        getBioResponseData(username_input: $username_input) {
            answer
            error
        }
    }
`

export const getUserQuery = `
    query GetUser($username: String!) {
        getUser(
            username: $username
        ){
            user_id
            first_name
            last_name
            preferred_name
            email
            role
            bio
            rank
            institution
            primary_department
            secondary_department
            primary_faculty
            secondary_faculty
            primary_affiliation
            secondary_affiliation
            campus
            keywords
            scopus_id
            orcid_id
            joined_timestamp   
            pending
            approved
            username
        }
    }
`;

export const getUserInstitutionIdQuery = (email) => `
    query GetUser {
        getUser (
            email: "${email}"
        ) {
            user_id
            first_name
            last_name
            preferred_name
            email
            role
            bio
            rank
            primary_department
            secondary_department
            primary_faculty
            secondary_faculty
            campus
            keywords
            institution_user_id
            scopus_id
            orcid_id
            joined_timestamp
        }
    }
`;

export const getAllUsersQuery = () => `
    query GetAllUsers {
        getAllUsers {
            user_id
            first_name
            last_name
            preferred_name
            email
            role
            bio
            rank
            institution
            primary_department
            secondary_department
            primary_faculty
            secondary_faculty
            primary_affiliation
            secondary_affiliation
            campus
            keywords
            institution_user_id
            scopus_id
            orcid_id
            joined_timestamp
            pending
            approved
            username
        }
    }
`;

export const getExistingUserQuery = (institution_user_id) => `
    query GetExistingUser {
        getExistingUser (
            institution_user_id: "${institution_user_id}"
        ) {
            user_id
            first_name
            last_name
            preferred_name
            email
            role
            bio
            rank
            institution
            primary_department
            secondary_department
            primary_faculty
            secondary_faculty
            primary_affiliation
            secondary_affiliation
            campus
            keywords
            institution_user_id
            scopus_id
            orcid_id
            joined_timestamp
        }
    }
`;

export const getAllSectionsQuery = () => `
    query GetAllSections {
        getAllSections {
            attributes
            attributes_type
            data_section_id
            data_type
            description
            title
            archive
            info
        }
    }
`;

export const getArchivedSectionsQuery = () => `
    query GetArchivedSections {
        getArchivedSections {
            attributes
            data_section_id
            data_type
            description
            title
            archive
        }
    }
`;

export const getUserCVDataQuery = (user_id, data_section_ids) => {
    if (Array.isArray(data_section_ids)) {
        let data_section_ids_string = "[";
        data_section_ids.forEach((id) => {
            data_section_ids_string += `"${id}",`;
        });
        data_section_ids_string = data_section_ids_string.slice(0, -1) + "]";
        return `query GetUserCVData {
        getUserCVData (
            user_id: "${user_id}",
            data_section_id_list: ${data_section_ids_string}
        ) {
            user_cv_data_id
            user_id
            data_section_id
            data_details
            editable
        }
    }`;
    } else
        return `query GetUserCVData {
        getUserCVData (
            user_id: "${user_id}",
            data_section_id: "${data_section_ids}"
        ) {
            user_cv_data_id
            user_id
            data_section_id
            data_details
            editable
        }
    }`;
};


export const getAllSectionCVDataQuery = (data_section_id, data_section_ids) => {
    if (data_section_id) 
        return `query GetAllSectionCVData {
        getAllSectionCVData (
            data_section_id: "${data_section_id}"
        ) {
            data {
                data_section_id
                data_details
            }
            total_count
            returned_count
        }
    }`;
    
    if (data_section_ids) 
        return `query GetAllSectionCVData {
        getAllSectionCVData (
            data_section_id_list: [${data_section_ids.map(id => `"${id}"`).join(', ')}]
        ) {
            data {
                data_section_id
                data_details
            }
            total_count
            returned_count
        }
    }`;
};

export const getArchivedUserCVDataQuery = (user_id) => `
    query GetArchivedUserCVData {
        getArchivedUserCVData (
            user_id: "${user_id}",
        ) {
            user_cv_data_id
            user_id
            data_section_id
            data_details
            archive
            archive_timestamp
            editable
        }
    }
`;

export const getAllUniversityInfoQuery = () => `
    query GetAllUniversityInfo {
        getAllUniversityInfo {
            university_info_id
            type
            value
        }
    }
`;

export const getAllNotificationsQuery = () => `
    query GetNotifications {
        GetNotifications {
            record_id
            title
            description
            date
            archive
            information_complete
        }
    }
`;

export const getUserDeclarationsQuery = (user_id) => `
    query getUserDeclarations {
        getUserDeclarations (
            user_id: "${user_id}"
        ) {
            reporting_year
            other_data
            created_on
            created_by
        }
    }
`;

export const getUserAffiliationsQuery = (user_id, first_name, last_name) => `
    query getUserAffiliations {
        getUserAffiliations (
            first_name: "${first_name}", last_name: "${last_name}", user_id: "${user_id}"
        ) {
            data_details
        }
    }
`;

export const getAuditViewQuery = (logged_user_id) => {
    if (logged_user_id !== undefined && logged_user_id !== null) {
        return `
            query getAuditView {
                getAuditView(logged_user_id: ${logged_user_id}) {
                    log_view_id
                    ts
                    logged_user_id
                    logged_user_first_name
                    logged_user_last_name
                    ip
                    browser_version
                    page
                    session_id
                    assistant
                    profile_record
                    logged_user_role,
                    logged_user_email,
                    logged_user_action
                }
            }
        `;
    } else {
        return `
            query getAuditView {
                getAuditView {
                    log_view_id
                    ts
                    logged_user_id
                    logged_user_first_name
                    logged_user_last_name
                    ip
                    browser_version
                    page
                    session_id
                    assistant
                    profile_record
                    logged_user_role,
                    logged_user_email,
                    logged_user_action
                }
            }
        `;
    }
};


export const getElsevierAuthorMatchesQuery = (
    first_name,
    last_name,
    institution_name
) => `
    query getElsevierAuthorMatches {
        getElsevierAuthorMatches (
            first_name: "${first_name}", last_name: "${last_name}", institution_name: "${institution_name}"
        ) {
            last_name,
            first_name,
            name_variants,
            subjects,
            current_affiliation,
            scopus_id,
            orcid
        }
    }
`;

export const getOrcidAuthorMatchesQuery = (
    first_name,
    last_name,
    institution_name
) => `
    query getOrcidAuthorMatches {
        getOrcidAuthorMatches (
            first_name: "${first_name}", last_name: "${last_name}", institution_name: "${institution_name}"
        ) {
            last_name,
            first_name,
            credit_name
            name_variants,
            keywords,
            orcid_id,
            researcher_urls
            }
    }
`;

export const getOrcidSectionsQuery = (orcidId, section) => `
    query getOrcidSections {
        getOrcidSections (
            orcidId: "${orcidId}", section: "${section}"
        ) {
            bio,
            keywords,
            publications {
                publication_id
                title
                cited_by
                keywords
                journal
                link
                doi
                year_published
                author_names
                author_ids
            },
            other_data
        }
    }
`;

export const getTotalOrcidPublicationsQuery = (orcid_id) => `
    query GetTotalOrcidPublications {
        getTotalOrcidPublications(orcid_id: "${orcid_id}") {
            total_results
            put_codes
        }
    }
`;

export const getOrcidPublicationQuery = (orcid_id, put_codes) => `
    query getOrcidPublication {
        getOrcidPublication (
            orcid_id: "${orcid_id}", put_codes: [${put_codes.join(",")}]
        ) {
            bio,
            keywords,
            publications {
                publication_id
                title
                cited_by
                keywords
                journal
                link
                doi
                year_published
                author_names
                author_ids
            },
            other_data
        }
    }
`;

export const getUserConnectionsQuery = (user_id, isFaculty = true) => `
    query GetUserConnections {
        getUserConnections (
            ${isFaculty ? "faculty_user_id" : "assistant_user_id"}: "${user_id}"
        ) {
            user_connection_id
            faculty_user_id
            faculty_first_name
            faculty_last_name
            faculty_email
            assistant_user_id
            assistant_first_name
            assistant_last_name
            assistant_email
            status
        }
    }
`;

export const getAllTemplatesQuery = () => `
    query GetAllTemplates {
        getAllTemplates {
            template_id
            title
            template_structure
            start_year
            end_year
        }
    }
`;

export const getTeachingDataMatchesQuery = (institution_user_id) => `
    query GetTeachingDataMatches {
        getTeachingDataMatches (
            institution_user_id: "${institution_user_id}",
        ) {
            teaching_data_id
            institution_user_id
            data_details
        }
    }
`;

export const getPublicationMatchesQuery = (
    scopus_id,
    page_number,
    results_per_page
) => `
    query GetPublicationMatches {
        getPublicationMatches (
            scopus_id: "${scopus_id}",
            page_number: ${page_number},
            results_per_page: ${results_per_page}
        ) {
            publications {
                publication_id
                title
                cited_by
                keywords
                journal
                link
                doi
                year_published
                author_names
                author_ids
            }
            total_results
            current_page
            total_pages
        }
    }
`;

export const getSecureFundingMatchesQuery = (first_name, last_name) => `
    query GetSecureFundingMatches {
        getSecureFundingMatches (
            first_name: "${first_name}",
            last_name: "${last_name}"
        ) {
            secure_funding_id
            first_name
            last_name
            data_details
        }
    }
`;

export const getRiseDataMatchesQuery = (first_name, last_name) => `
    query GetRiseDataMatches {
        getRiseDataMatches (
            first_name: "${first_name}",
            last_name: "${last_name}"
        ) {
            rise_data_id
            first_name
            last_name
            data_details
        }
    }
`;

export const getPatentMatchesQuery = (first_name, last_name) => `
    query GetPatentMatches {
        getPatentMatches (
            first_name: "${first_name}",
            last_name: "${last_name}"
        ) {
            patent_id
            first_name
            last_name
            data_details
        }
    }
`;

export const getPresignedUrlQuery = (jwt, fileKey, type) => `
    query GetPresignedUrl {
        getPresignedUrl (
            jwt: "${jwt}",
            key: "${fileKey}",
            type: "${type}"
        )
    }
`;

export const getNumberOfGeneratedCVsQuery = (department) => {
    if (!department)
        return `
    query GetNumberOfGeneratedCVs {
        getNumberOfGeneratedCVs
    }
    `;
    else
        return `
    query GetNumberOfGeneratedCVs {
        getNumberOfGeneratedCVs (
            department: "${department}"
        )
    }
    `;
};

export const cvIsUpToDateQuery = (cognito_user_id, user_id, template_id) => `
    query CvIsUpToDate {
        cvIsUpToDate (
            cognito_user_id: "${cognito_user_id}"
            user_id: "${user_id}",
            template_id: "${template_id}"
        )
    }
`;

export const getLatexConfigurationQuery = () => `
    query GetLatexConfiguration {
        getLatexConfiguration
    }
`;
