export const getFacultyMembers = ({firstName, lastName}) => `
    query getFacultyMember(
    firstName: ${firstName},
    lastName: ${lastName}
    ) {
        firstName, lastName
    }
`;