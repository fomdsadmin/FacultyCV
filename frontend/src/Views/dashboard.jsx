import React, { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { addUser, updateUser, getUser } from "../graphql/graphqlHelpers.js"

const Dashboard = () => {
  const auth = useAuth();

  useEffect(() => {
    async function syncUser() {
      if (auth.isAuthenticated) {
        const { email, given_name, family_name } = auth.user.profile;
        console.log("User profile data:", auth.user.profile);
        console.log("User email:", email);
        console.log("User given name:", given_name);
      }
    }

    syncUser();
  }, [auth.isAuthenticated]);

  return null;
};

export default Dashboard;
