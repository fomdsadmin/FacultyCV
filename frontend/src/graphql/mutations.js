export const ADD_USER_DECLARATION = `
  mutation AddUserDeclaration($user_id: String!, $reporting_year: Int!, $created_by: String!, $other_data: AWSJSON!) {
    addUserDeclaration(
      user_id: $user_id,
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
    mutation DeleteUserDeclaration($user_id: String!, $reporting_year: Int!) {
        deleteUserDeclaration(
            user_id: $user_id,
            reporting_year: $reporting_year
        )
    }
`;

export const UPDATE_USER_DECLARATION = `
    mutation UpdateUserDeclaration($user_id: String!, $reporting_year: Int!, $other_data: AWSJSON!) {
        updateUserDeclaration(
            user_id: $user_id,
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

export const ADD_USER = `
    mutation AddUser($first_name: String!, $last_name: String!, $email: String!, $role: String!, $pending: Boolean!, $approved: Boolean!, $cwl_username: String!, $vpp_username: String!, $primary_department: String!, $primary_faculty: String!) {
        addUser(
            first_name: $first_name,
            last_name: $last_name,
            email: $email,
            role: $role,
            pending: $pending,
            approved: $approved,
            cwl_username: $cwl_username,
            vpp_username: $vpp_username,
            primary_department: $primary_department,
            primary_faculty: $primary_faculty
        )
    }
`;

export const REMOVE_USER = `
    mutation RemoveUser($user_id: String!) {
        removeUser(
            user_id: $user_id
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
        $data_section_title: String!,
        $data_details_list: [AWSJSON!],
        $editable: Boolean!,
    ) {
        addBatchedUserCVData(
            user_id: $user_id,
            data_section_id: $data_section_id,
            data_section_title: $data_section_title!,
            data_details_list: $data_details_list,
            editable: $editable,
        )
    }
`;

export const ADD_STAGING_SCOPUS_PUBLICATIONS = `
    mutation AddStagingScopusPublications(
        $user_id: String!,
        $publications: [AWSJSON!]!
    ) {
        addStagingScopusPublications(
            user_id: $user_id,
            publications: $publications
        )
    }
`;

export const UPDATE_STAGING_SCOPUS_PUBLICATIONS = `
    mutation UpdateStagingScopusPublications(
        $publication_ids: [String!]!,
        $is_new: Boolean!
    ) {
        updateStagingScopusPublications(
            publication_ids: $publication_ids,
            is_new: $is_new
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
    status,
    faculty_username,
    assistant_username
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
            faculty_username: "${faculty_username}"
            assistant_username: "${assistant_username}"
        )
    }
`;

export const ADD_TEMPLATE = `
    mutation AddTemplate($title: String!, $template_structure: AWSJSON!, $start_year: String, $end_year: String) {
        addTemplate(
            title: $title
            template_structure: $template_structure
            start_year: $start_year
            end_year: $end_year
        )
    }
`

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
    institution,
    primary_department,
    primary_faculty,
    campus,
    keywords,
    institution_user_id,
    scopus_id,
    orcid_id,
) => `
    mutation UpdateUser {
        updateUser(
            first_name: "${first_name}"
            last_name: "${last_name}"
            preferred_name: "${preferred_name}"
            email: "${email}"
            role: "${role}"
            bio: "${bio}"
            institution: "${institution}"
            primary_department: "${primary_department}"
            primary_faculty: "${primary_faculty}"
            campus: "${campus}"
            keywords: "${keywords}"
            institution_user_id: "${institution_user_id}"
            scopus_id: "${scopus_id}"
            orcid_id: "${orcid_id}"
            user_id: "${user_id}"
        )
    }
`;

export const updateUserPermissionsMutation = (
    user_id,
    pending,
    approved,
) => `
    mutation UpdateUserPermissions {
        updateUserPermissions(
            user_id: "${user_id}"
            pending: ${pending}
            approved: ${approved}
        )
    }
`;

export const updateUserActiveStatusMutation = (user_ids, active) => `
    mutation UpdateUserActiveStatus {
        updateUserActiveStatus(
            user_ids: [${user_ids.map(id => `"${id}"`).join(', ')}]
            active: ${active}
        )
    }
`;

export const UPDATE_SECTION = `
    mutation UpdateSection($data_section_id: String!, $archive: Boolean, $attributes: AWSJSON, $attributes_type: AWSJSON) {
        updateSection(
            data_section_id: $data_section_id
            archive: $archive
            attributes: $attributes
            attributes_type: $attributes_type
        )
    }
`;

export const CHANGE_USERNAME = `
    mutation ChangeUsername($user_id: String!, $cwl_username: String!, $vpp_username: String!) {
        changeUsername(
            user_id: $user_id,
            cwl_username: $cwl_username,
            vpp_username: $vpp_username
        )
    }
`;

export const UPDATE_USER_AFFILIATIONS = `
    mutation UpdateUserAffiliations($user_id: String!, $first_name: String, $last_name: String, $affiliations: AWSJSON) {
        updateUserAffiliations(
            user_id: $user_id,
            first_name: $first_name,
            last_name: $last_name,
            affiliations: $affiliations
        )
    }
`;

export const EDIT_SECTION_DETAILS = `
    mutation EditSectionDetails($data_section_id: String!, $title: String!, $data_type: String!, $description: String, $info: String) {
        editSectionDetails(
            data_section_id: $data_section_id
            title: $title
            data_type: $data_type
            description: $description
            info: $info
        )
    }
`;


export const UPDATE_USER_CV_DATA = `
    mutation UpdateUserCVData($user_cv_data_id: String!, $data_details: AWSJSON, $cognito_user_id: String) {
      updateUserCVData(
        user_cv_data_id: $user_cv_data_id
        data_details: $data_details
        cognito_user_id: $cognito_user_id
    )
  }
`;

export const DELETE_USER_CV_SECTION_DATA = `
    mutation DeleteUserCVSectionData($user_id: String!, $data_section_id: String!) {
      deleteUserCVSectionData(
        user_id: $user_id
        data_section_id: $data_section_id
    )
  }
`;

export const DELETE_SECTION_CV_DATA = `
    mutation DeleteSectionCVData($data_section_id: String!) {
      deleteSectionCVData(
        data_section_id: $data_section_id
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

export const UPDATE_TEMPLATE = `
    mutation UpdateTemplate($template_id: String!, $title: String!, $template_structure: AWSJSON, $start_year: String, $end_year: String) {
        updateTemplate(
            template_id: $template_id
            title: $title
            template_structure: $template_structure
            start_year: $start_year
            end_year: $end_year
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
        logged_user_role
        logged_user_email
        logged_user_action
        }
    }
`;