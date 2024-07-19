export const addSectionMutation = (title, description, data_type, attributes) => `
    mutation AddSection {
        addSection(
            title: "${title}",
            description: "${description}",
            data_type: "${data_type}",
            attributes: "${attributes}"
        )
    }
`;

export const addUserMutation = (first_name, last_name, preferred_name,
    email, role, bio, rank, primary_department, secondary_department, primary_faculty,
    secondary_faculty, campus, keywords, institution_user_id, scopus_id, orcid_id
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
            primary_department: "${primary_department}"
            secondary_department: "${secondary_department}"
            primary_faculty: "${primary_faculty}"
            secondary_faculty: "${secondary_faculty}"
            campus: "${campus}"
            keywords: "${keywords}"
            institution_user_id: "${institution_user_id}"
            scopus_id: "${scopus_id}"
            orcid_id: "${orcid_id}"
        )
    }
`;

export const addUserCVDataMutation = (user_id, data_section_id, data_details) => `
    mutation AddUserCVData {
        addUserCVData(
            user_id: "${user_id}"
            data_section_id: "${data_section_id}"
            data_details: "${data_details}"
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

export const addUserConnectionMutation = (user_id, user_connection) => `
    mutation AddUserConnection {
        addUserConnection(
            user_id: "${user_id}"
            user_connection: "${user_connection}"
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

export const updateUserMutation = (user_id, first_name, last_name, preferred_name,
    email, role, bio, rank, primary_department, secondary_department, primary_faculty,
    secondary_faculty, campus, keywords, institution_user_id, scopus_id, orcid_id) => `
    mutation UpdateUser {
        updateUser(
            first_name: "${first_name}"
            last_name: "${last_name}"
            preferred_name: "${preferred_name}"
            email: "${email}"
            role: "${role}"
            bio: "${bio}"
            rank: "${rank}"
            primary_department: "${primary_department}"
            secondary_department: "${secondary_department}"
            primary_faculty: "${primary_faculty}"
            secondary_faculty: "${secondary_faculty}"
            campus: "${campus}"
            keywords: "${keywords}"
            institution_user_id: "${institution_user_id}"
            scopus_id: "${scopus_id}"
            orcid_id: "${orcid_id}"
            user_id: "${user_id}"
        )
    }
`;

export const updateUserCVDataMutation = (user_cv_data_id, data_details) => `
    mutation UpdateUserCVData {
        updateUserCVData(
            user_cv_data_id: "${user_cv_data_id}"
            data_details: "${data_details}"
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

export const updateUserConnectionMutation = (user_connection_id, user_connection) => `
    mutation UpdateUserConnection {
        updateUserConnection(
            user_connection_id: "${user_connection_id}"
            user_connection: "${user_connection}"
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