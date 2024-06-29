export const getUserQuery = ({email}) => `
    query GetUser {
        getUser(
            email: "${email}"
        ) {
            user_id
            first_name
            last_name
            preferred_name
            email
            role
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
        }
    }
`;

export const getAllSectionsQuery = () => `
    query GetAllSections {
        getAllSections {
            attributes
            data_section_id
            data_type
            description
            title
        }
    }
`;

export const getUserCVDataQuery = (user_id, data_section_id) => `
    query GetUserCVData {
        getUserCVData (
            user_id: "${user_id}",
            data_section_id: "${data_section_id}"
        ) {
            user_cv_data_id
            user_id
            data_section_id
            data_details
        }
`;