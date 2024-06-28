export const getUserQuery = ({firstName, lastName}) => `
    query GetUser {
        getUser(
            firstName: "${firstName}",
            lastName: "${lastName}"
        ) {
            firstName
            lastName
        }
    }
`;

export const getAllSectionsQuery = () => `
    query GetAllSections {
        getAllSections {
            attributes
            dataSectionId
            dataType
            description
            title
        }
    }
`;