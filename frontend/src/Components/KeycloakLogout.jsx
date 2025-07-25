import { useEffect } from "react";

const KeycloakLogout = () => {
    useEffect(() => {
        const KEYCLOAK_LOGOUT_URL =
            "https://broker.id.ubc.ca/auth/realms/idb2/protocol/openid-connect/logout";

        // The client_id that Keycloak recognizes your application by.
        // We determined this from the network tab during the login redirect to Keycloak.
        const KEYCLOAK_CLIENT_ID = "facultycv-prod";

        const redirectUrl = `${KEYCLOAK_LOGOUT_URL}?client_id=${KEYCLOAK_CLIENT_ID}`;

        window.location.href = redirectUrl;
    }, []);

    return <p>Logging out from Authentication..</p>;
};

export default KeycloakLogout;