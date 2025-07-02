import React, { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { addUser, updateUser, getUser } from "../graphql/graphqlHelpers.js"

const MapUserData = () => {
  const auth = useAuth();

  useEffect(() => {
    async function syncUser() {
      if (auth.isAuthenticated) {
        const { email, given_name, family_name } = auth.user.profile;
        console.log("User profile data:", auth.user.profile);
        console.log("User email:", email);
        console.log("User given name:", given_name);
        
        try {
          const existingUser = await getUser(email);

          if (!existingUser || !existingUser.role) {
            const role = "Faculty"; // Set default role or determine dynamically
            await addUser(
              given_name || "",
              family_name || "",
              "",
              email || "",
              role,
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
              ""
            );
          }
        } catch (error) {
          console.error("Error syncing user data:", error);
        }
      }
    }

    syncUser();
  }, [auth.isAuthenticated]);

  return null;
};

export default MapUserData;
