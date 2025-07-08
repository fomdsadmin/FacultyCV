import { useAuth } from "react-oidc-context";

/**
 * Hook to access the federated authentication token and user ID
 * using react-oidc-context (e.g., Cognito Hosted UI + external IdP).
 */
export const useFederatedToken = () => {
  const auth = useAuth();

  const getJWT = () => {
    // Returns the ID token (JWT) from the OIDC context
    return auth?.user?.id_token || null;
  };

  const getUserId = () => {
    // Returns the unique user ID (typically 'sub' from the ID token claims)
    return auth?.user?.profile?.sub || null;
  };

  // Optional debug logs (call these functions explicitly where needed)
  // console.log("getJWT:", getJWT());
  // console.log("getUserId:", getUserId());

  return { getJWT, getUserId };
};
