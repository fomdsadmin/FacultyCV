<<<<<<< HEAD
export const getFacultyMember = ({firstName, lastName}) => `
    query GetFacultyMember {
        getFacultyMember(
            firstName: "${firstName}",
            lastName: "${lastName}"
=======
export const getUser = ({firstName, lastName}) => `
    query GetUser {
        getUser(
            firstName: \"${firstName}\",
            lastName: \"${lastName}\"
>>>>>>> a16701a5450addccd707549a0b2bc89982ae771c
        ) {
            firstName
            lastName
        }
    }
`;