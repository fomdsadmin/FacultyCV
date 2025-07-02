import React, { useEffect } from "react";
import { useAuth } from "react-oidc-context";

const FederatedAuthRedirect = () => {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isAuthenticated && !auth.isLoading && !auth.error) {
      auth.signinRedirect();
    }
  }, [auth]);

  if (auth.isLoading) return <div>Loading...</div>;
  if (auth.error) return <div>Error: {auth.error.message}</div>;

  return null;
};

export default FederatedAuthRedirect;
