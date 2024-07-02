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
    email, role, rank, primary_department, secondary_department, primary_faculty,
    secondary_faculty, campus, keywords, institution_user_id, scopus_id, orcid_id
) => `
    mutation AddUser {
        addUser(
            first_name: "${first_name}"
            last_name: "${last_name}"
            preferred_name: "${preferred_name}"
            email: "${email}"
            role: "${role}"
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
    mutation AddUserCVDataMutation {
        addUserCVData(
            user_id: "${user_id}"
            data_section_id: "${data_section_id}"
            data_details: "${data_details}"
        )
    }
`;

export const updateUserMutation = (user_id, first_name, last_name, preferred_name,
    email, role, rank, primary_department, secondary_department, primary_faculty,
    secondary_faculty, campus, keywords, institution_user_id, scopus_id, orcid_id) => `
    mutation UpdateUser {
        updateUser(
            first_name: "${first_name}"
            last_name: "${last_name}"
            preferred_name: "${preferred_name}"
            email: "${email}"
            role: "${role}"
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

export const updateUserCVDataMutation = (user_id, data_section_id, data_details) => `
    mutation UpdateUserCVDataMutation {
        updateUserCVData(
            user_id: "${user_id}"
            data_section_id: "${data_section_id}"
            data_details: "${data_details}"
        )
    }
`;