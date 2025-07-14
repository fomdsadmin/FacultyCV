import { fetchUserAttributes, getCurrentUser, signInWithRedirect, fetchAuthSession } from "aws-amplify/auth";
import { getAllUsers, getUser } from "graphql/graphqlHelpers";
import React, { useEffect } from "react";

const FederatedAuthRedirect = () => {
  useEffect(() => {
    const checkAndSignIn = async () => {
      try {
        const user = await getCurrentUser();
        console.log("User is already logged in:", user);
        const session = await fetchAuthSession();
        console.log(session);
        const idToken = session.tokens?.idToken?.toString();
        console.log("ID Token (JWT):", idToken);
        const attributes = await fetchUserAttributes();
        console.log("User attributes:", attributes);
        //console.log(await getUser());
        // Optionally redirect or do something else here
        
      } catch (error) {
        console.log(error);
        // Not logged in, so start sign-in
        await signInWithRedirect({
          provider: {
            custom: 'staging-facultycv'
          }
        });
      }
    };
    checkAndSignIn();
  }, []);

  return null;
};

export default FederatedAuthRedirect;
