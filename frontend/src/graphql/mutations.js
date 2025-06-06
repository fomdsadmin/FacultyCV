export const ADD_USER_DECLARATION = `
  mutation AddUserDeclaration($first_name: String!, $last_name: String!, $reporting_year: Int!, $created_by: String!, $other_data: AWSJSON!) {
    addUserDeclaration(
      first_name: $first_name,
      last_name: $last_name,
      reporting_year: $reporting_year,
      created_by: $created_by,
      other_data: $other_data
    ) {
      id
      created_on
    }
  }
`;

export const DELETE_USER_DECLARATION = `
    mutation DeleteUserDeclaration($first_name: String!, $last_name: String!, $reporting_year: Int!) {
        deleteUserDeclaration(
            first_name: $first_name,
            last_name: $last_name,
            reporting_year: $reporting_year
        )
    }
`;

export const UPDATE_USER_DECLARATION = `
    mutation UpdateUserDeclaration($first_name: String!, $last_name: String!, $reporting_year: Int!, $other_data: AWSJSON!) {
        updateUserDeclaration(
            first_name: $first_name,
            last_name: $last_name,
            reporting_year: $reporting_year
            other_data: $other_data
        )
    }
`;

export const addToUserGroupMutation = (userName, userGroup) => `
    mutation AddToUserGroup {
        addToUserGroup(
            userName: "${userName}",
            userGroup: "${userGroup}"
        )
    }
`;

export const removeFromUserGroupMutation = (userName, userGroup) => `
    mutation RemoveFromUserGroup {
        removeFromUserGroup(
            userName: "${userName}",
            userGroup: "${userGroup}"
        )
    }
`;

export const ADD_SECTION = `
    mutation AddSection($title: String!, $description: String!, $data_type: String, $attributes: AWSJSON!) {
        addSection(
            title: $title,
            description: $description,
            data_type: $data_type,
            attributes: $attributes
        )
    }
`;

export const addUserMutation = (
    first_name,
    last_name,
    preferred_name,
    email,
    role,
    bio,
    rank,
    institution,
    primary_department,
    secondary_department,
    primary_faculty,
    secondary_faculty,
    primary_affiliation,
    secondary_affiliation,
    campus,
    keywords,
    institution_user_id,
    scopus_id,
    orcid_id
) => `
    mutation AddUser {
        addUser(
            first_name: "${first_name}"
            last_name: "${last_name}"
            preferred_name: "${preferred_name}"
            email: "${email}"
            role: "${role}"
            bio: "${bio}"
            rank: "${rank}"
            institution: "${institution}"
            primary_department: "${primary_department}"
            secondary_department: "${secondary_department}"
            primary_faculty: "${primary_faculty}"
            secondary_faculty: "${secondary_faculty}"
            primary_affiliation: "${primary_affiliation}"
            secondary_affiliation: "${secondary_affiliation}"
            campus: "${campus}"
            keywords: "${keywords}"
            institution_user_id: "${institution_user_id}"
            scopus_id: "${scopus_id}"
            orcid_id: "${orcid_id}"
        )
    }
`;

export const ADD_USER_CV_DATA = `
    mutation AddUserCVData($user_id: String!, $data_section_id: String!, $data_details: AWSJSON!, $editable: Boolean!, $cognito_user_id: String) {
        addUserCVData(
            user_id: $user_id,
            data_section_id: $data_section_id,
            data_details: $data_details,
            editable: $editable,
            cognito_user_id: $cognito_user_id
        )
    }
`;

export const ADD_BATCHED_USER_CV_DATA = `
    mutation AddBatchedUserCVData(
        $user_id: String!,
        $data_section_id: String!,
        $data_details_list: [AWSJSON!],
        $editable: Boolean!,
    ) {
        addBatchedUserCVData(
            user_id: $user_id,
            data_section_id: $data_section_id,
            data_details_list: $data_details_list,
            editable: $editable,
        )
    }
`;

export const addUniversityInfoMutation = (type, value) => `
    mutation AddUniversityInfo {
        addUniversityInfo(
            type: "${type}",
            value: "${value}"
        )
    }
`;

export const addUserConnectionMutation = (
    faculty_user_id,
    faculty_first_name,
    faculty_last_name,
    faculty_email,
    assistant_user_id,
    assistant_first_name,
    assistant_last_name,
    assistant_email,
    status
) => `
    mutation AddUserConnection {
        addUserConnection(
            faculty_user_id: "${faculty_user_id}"
            faculty_first_name: "${faculty_first_name}"
            faculty_last_name: "${faculty_last_name}"
            faculty_email: "${faculty_email}"
            assistant_user_id: "${assistant_user_id}"
            assistant_first_name: "${assistant_first_name}"
            assistant_last_name: "${assistant_last_name}"
            assistant_email: "${assistant_email}"
            status: "${status}"
        )
    }
`;

export const addTemplateMutation = (
    title,
    data_section_ids,
    start_year,
    end_year
) => `
    mutation AddTemplate {
        addTemplate(
            title: "${title}"
            data_section_ids: "${data_section_ids}"
            start_year: "${start_year}"
            end_year: "${end_year}"
        )
    }
`;

export const linkScopusIdMutation = (user_id, scopus_id, orcid_id) => {
    if (orcid_id) {
        return `
            mutation LinkScopusId {
                linkScopusId(
                    user_id: "${user_id}",
                    scopus_id: "${scopus_id}",
                    orcid_id: "${orcid_id}"
                )
            }
        `;
    } else {
        return `
            mutation LinkScopusId {
                linkScopusId(
                    user_id: "${user_id}",
                    scopus_id: "${scopus_id}"
                )
            }
        `;
    }
};

export const linkOrcidMutation = (user_id, orcid_id) => `
    mutation LinkOrcid {
        linkOrcid(
            user_id: "${user_id}",
            orcid_id: "${orcid_id}"
        )
    }
`;

export const updateUserMutation = (
    user_id,
    first_name,
    last_name,
    preferred_name,
    email,
    role,
    bio,
    rank,
    institution,
    primary_department,
    secondary_department,
    primary_faculty,
    secondary_faculty,
    primary_affiliation,
    secondary_affiliation,
    campus,
    keywords,
    institution_user_id,
    scopus_id,
    orcid_id,
    cognito_user_id
) => `
    mutation UpdateUser {
        updateUser(
            first_name: "${first_name}"
            last_name: "${last_name}"
            preferred_name: "${preferred_name}"
            email: "${email}"
            role: "${role}"
            bio: "${bio}"
            rank: "${rank}"
            institution: "${institution}"
            primary_department: "${primary_department}"
            secondary_department: "${secondary_department}"
            primary_faculty: "${primary_faculty}"
            secondary_faculty: "${secondary_faculty}"
            primary_affiliation: "${primary_affiliation}"
            secondary_affiliation: "${secondary_affiliation}"
            campus: "${campus}"
            keywords: "${keywords}"
            institution_user_id: "${institution_user_id}"
            scopus_id: "${scopus_id}"
            orcid_id: "${orcid_id}"
            user_id: "${user_id}"
            cognito_user_id: "${cognito_user_id}"
        )
    }
`;

export const UPDATE_SECTION = `
    mutation UpdateSection($data_section_id: String!, $archive: Boolean, $attributes: AWSJSON) {
        updateSection(
            data_section_id: $data_section_id
            archive: $archive
            attributes: $attributes
        )
    }
`

export const updateUserCVDataMutation = (
    user_cv_data_id,
    data_details,
    cognito_user_id
) => `
    mutation UpdateUserCVData {
        updateUserCVData(
            user_cv_data_id: "${user_cv_data_id}"
            data_details: ${data_details},
            cognito_user_id: "${cognito_user_id}"
        )
    }
`;

export const updateUserCVDataArchiveMutation = (
    user_cv_data_id,
    archive,
    cognito_user_id
) => `
    mutation UpdateUserCVData {
        updateUserCVData(
            user_cv_data_id: "${user_cv_data_id}"
            archive: ${archive}
            cognito_user_id: "${cognito_user_id}"
        )
    }
`;

export const updateUniversityInfoMutation = (
    university_info_id,
    type,
    value
) => `
    mutation UpdateUniversityInfo {
        updateUniversityInfo(
            type: "${type}"
            value: "${value}"
            university_info_id: "${university_info_id}"
        )
    }
`;

export const updateUserConnectionMutation = (user_connection_id, status) => `
    mutation UpdateUserConnection {
        updateUserConnection(
            user_connection_id: "${user_connection_id}"
            status: "${status}"
        )
    }
`;

export const updateTemplateMutation = (
    template_id,
    title,
    data_section_ids,
    start_year,
    end_year
) => `
    mutation UpdateTemplate {
        updateTemplate(
            template_id: "${template_id}"
            title: "${title}"
            data_section_ids: "${data_section_ids}"
            start_year: "${start_year}"
            end_year: "${end_year}"
        )
    }
`;

export const deleteUserConnectionMutation = (user_connection_id) => `
    mutation DeleteUserConnection {
        deleteUserConnection(
            user_connection_id: "${user_connection_id}"
        )
    }
`;

export const deleteTemplateMutation = (template_id) => `
    mutation DeleteTemplate {
        deleteTemplate(
            template_id: "${template_id}"
        )
    }
`;

export const updateLatexConfigurationMutation = (vspace, margin, font) => `
    mutation UpdateLatexConfiguration {
        updateLatexConfiguration(
            vspace: ${vspace},
            margin: ${margin},
            font: "${font}"
        )
    }
`;

export const addAuditViewMutation = `
    mutation AddAuditView($input: AuditViewInput!) {
        addAuditView(input: $input) {
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
