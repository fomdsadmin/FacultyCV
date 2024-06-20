export const getFacultyMember = ({firstName, lastName}) => `
    query GetUser {
        getUser(
            firstName: \"${firstName}\",
            lastName: \"${lastName}\"
        ) {
            firstName
            lastName
        }
    }
`;