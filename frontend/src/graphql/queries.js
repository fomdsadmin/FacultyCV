export const getFacultyMember = ({firstName, lastName}) => `
    query GetFacultyMember {
        getFacultyMember(
            firstName: ${firstName},
            lastName: ${lastName}
        ) {
            firstName
            lastName
        }
    }
`;