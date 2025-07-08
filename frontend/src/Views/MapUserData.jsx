import React, { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useApp } from "../Contexts/AppContext";
import { addUser, getUser } from "../graphql/graphqlHelpers.js";

const MapUserData = () => {
  const auth = useAuth(); 
  const { amplifyConfigured } = useApp();

  useEffect(() => {
    async function syncUser() {
      if (!amplifyConfigured) return; // Wait for Amplify config

      if (auth.isAuthenticated && auth.user?.id_token) {
        const { email, given_name, family_name } = auth.user.profile;
        const token = auth.user.id_token;
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log("OIDC Token:", auth.user.id_token);
        console.log("ISSUER:", payload.iss);
        console.log("AUDIENCE:", payload.aud);
        console.log("EXP:", new Date(payload.exp * 1000));
        console.log("amplifyConfigured:", amplifyConfigured);
        console.log("auth.isAuthenticated:", auth.isAuthenticated);

        try {
          const existingUser = await getUser(email, auth.user.id_token);
          console.log("Existing user data:", existingUser);
          
          if (!existingUser || !existingUser.role) {
            await addUser(
              given_name || "",
              family_name || "",
              "",
              email || "",
              "Faculty",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              token
            );
            console.log("New user added.");
          }
        } catch (error) {
          console.error("Error syncing user data:", error);
        }
      }
    }

    syncUser();
  }, [auth.isAuthenticated, auth.user, amplifyConfigured]);

  return null;
};

export default MapUserData;
