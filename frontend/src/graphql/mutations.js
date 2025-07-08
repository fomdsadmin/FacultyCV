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
