import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from "react-oidc-context";
import { Amplify } from 'aws-amplify';

const cognitoAuthConfig = {
  authority: "https://cognito-idp.ca-central-1.amazonaws.com/ca-central-1_BO47RpLGu",
  client_id: "35ies7u543bt5j2tu52r1o6ui3",
  redirect_uri: "http://localhost:3000",
  response_type: "code",
  scope: "email openid profile",
};

const ubcKeycloakAuthConfig = {
  authority: "https://cognito-idp.ca-central-1.amazonaws.com/ca-central-1_BO47RpLG",
  client_id: "35ies7u543bt5j2tu52r1o6ui3", // You might need to update this with the correct UBC Keycloak client ID
  redirect_uri: "http://localhost:3000",
  response_type: "code",
  scope: "openid profile email",
};

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolClientId: '35ies7u543bt5j2tu52r1o6ui3',
      userPoolId: 'ca-central-1_BO47RpLGu',
      loginWith: { // Optional
        oauth: {
          domain: 'ca-central-1bo47rplgu.auth.ca-central-1.amazoncognito.com',
          scopes: ['openid', 'email', 'profile', 'aws.cognito.signin.user.admin'],
          redirectSignIn: ['http://localhost:3000/'],
          redirectSignOut: ['https://www.google.com/'],
          responseType: 'code',
        }
      }
    }
  },
  API: {
    GraphQL: {
      endpoint: 'https://b52u3hajhfejlapwe3exmv2vce.appsync-api.ca-central-1.amazonaws.com/graphql',
      region: 'ca-central-1',
      defaultAuthMode: 'userPool'
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

