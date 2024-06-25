export const getUser = ({firstName, lastName}) => `
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