import { useEffect } from 'react';
 
const useFederatedLoginRedirect = (authStatus) => {
  useEffect(() => {
    if (authStatus !== "unauthenticated") return;
 
    const redirectIfNotLoggedIn = async () => {
      const cognitoDomain = process.env.REACT_APP_COGNITO_DOMAIN;
      const clientId = process.env.REACT_APP_COGNITO_USER_POOL_CLIENT_ID;
      const redirectUri = process.env.REACT_APP_REDIRECT_URI;
      const identityProvider = process.env.REACT_APP_COGNITO_IDP || '';
 
      const loginUrl =
        `https://${cognitoDomain}/oauth2/authorize` +
        `?client_id=${clientId}` +
        `&response_type=token` +
        `&scope=email+openid+profile` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        (identityProvider ? `&identity_provider=${identityProvider}` : '');
 
      window.location.href = loginUrl;
    };
 
    redirectIfNotLoggedIn();
  }, [authStatus]);
};
 
export default useFederatedLoginRedirect;