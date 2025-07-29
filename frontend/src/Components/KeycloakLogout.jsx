import { useEffect } from "react";

const KeycloakLogout = () => {
    useEffect(() => {
        const KEYCLOAK_LOGOUT_URL = process.env.REACT_APP_KEYCLOAK_LOGOUT_URL;

        // The client_id that Keycloak recognizes your application by.
        // We determined this from the network tab during the login redirect to Keycloak.
        const KEYCLOAK_CLIENT_ID = process.env.REACT_APP_COGNITO_CLIENT_NAME;

        const redirectUrl = `${KEYCLOAK_LOGOUT_URL}?client_id=${KEYCLOAK_CLIENT_ID}`;

        console.log("Filter: User redirected to keycloak logout page");
        window.location.href = redirectUrl;
    }, []);

    return <p>Logging out from Authentication..</p>;
};

export default KeycloakLogout;