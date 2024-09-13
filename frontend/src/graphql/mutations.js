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

export const addSectionMutation = (title, description, data_type, attributes) => `
    mutation AddSection {
        addSection(
            title: "${title}",
            description: "${description}",
            data_type: "${data_type}",
            attributes: ${attributes}
        )
    }
`;

export const addUserMutation = (first_name, last_name, preferred_name,
    email, role, bio, rank, institution, primary_department, secondary_department, primary_faculty,
    secondary_faculty, primary_affiliation, secondary_affiliation, campus, keywords, institution_user_id, scopus_id, orcid_id
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

export const addUserCVDataMutation = (user_id, data_section_id, data_details, editable, cognito_user_id) => `
    mutation AddUserCVData {
        addUserCVData(
            user_id: "${user_id}"
            data_section_id: "${data_section_id}"
            data_details: ${data_details}
            editable: ${editable}
            cognito_user_id: "${cognito_user_id}"
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
    faculty_user_id, faculty_first_name, faculty_last_name, faculty_email,
    assistant_user_id, assistant_first_name, assistant_last_name, assistant_email,
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

export const addTemplateMutation = (title, data_section_ids, start_year, end_year) => `
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
    if(orcid_id) {
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
}

export const linkOrcidMutation = (user_id, orcid_id) => `
    mutation LinkOrcid {
        linkOrcid(
            user_id: "${user_id}",
            orcid_id: "${orcid_id}"
        )
    }
`;

export const updateUserMutation = (user_id, first_name, last_name, preferred_name,
    email, role, bio, rank, institution, primary_department, secondary_department, primary_faculty,
    secondary_faculty, primary_affiliation, secondary_affiliation, campus, keywords, institution_user_id, scopus_id, orcid_id, cognito_user_id) => `
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

export const updateSectionMutation = (data_section_id, archive, attributes) => `
    mutation UpdateSection {
        updateSection(
            data_section_id: "${data_section_id}"
            archive: ${archive}
            attributes: ${attributes}
        )
    }
`;

export const updateUserCVDataMutation = (user_cv_data_id, data_details, cognito_user_id) => `
    mutation UpdateUserCVData {
        updateUserCVData(
            user_cv_data_id: "${user_cv_data_id}"
            data_details: ${data_details},
            cognito_user_id: "${cognito_user_id}"
        )
    }
`;

export const updateUserCVDataArchiveMutation = (user_cv_data_id, archive) => `
    mutation UpdateUserCVData {
        updateUserCVData(
            user_cv_data_id: "${user_cv_data_id}"
            archive: ${archive}
        )
    }
`;

export const updateUniversityInfoMutation = (university_info_id, type, value) => `
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

export const updateTemplateMutation = (template_id, title, data_section_ids, start_year, end_year) => `
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