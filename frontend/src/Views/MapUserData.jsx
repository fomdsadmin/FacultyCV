import React, { useEffect } from "react";
import { useApp } from "../Contexts/AppContext";
import { addUser, getUser } from "../graphql/graphqlHelpers.js";
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';

const MapUserData = () => {
  const { amplifyConfigured } = useApp();

  useEffect(() => {
    async function syncUser() {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const email = attributes.email;
      const given_name = attributes.given_name;
      const family_name = attributes.family_name;

      try {
        console.log("Amplify user attributes:", attributes);
        if (!email) {
          console.error("No email found in user attributes");
          return;
        }
        const existingUser = await getUser(email);
        console.log("Existing user data:", existingUser);

      } catch (error) {
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
            ""
          );
          console.log("New user added.");
        console.error("Error syncing user data:", error);
      }
    }

    syncUser();
  }, [amplifyConfigured]);

  return null;
};

export default MapUserData;
