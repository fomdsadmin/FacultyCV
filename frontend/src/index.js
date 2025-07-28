import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Amplify } from 'aws-amplify';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import { CookieStorage } from 'aws-amplify/utils';


Amplify.configure({
  Auth: {
    Cognito: {
      userPoolClientId: process.env.REACT_APP_COGNITO_USER_POOL_CLIENT_ID,
      userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
      loginWith: { // Optional
        oauth: {
          domain: process.env.REACT_APP_COGNITO_DOMAIN,
          scopes: ['aws.cognito.signin.user.admin', 'email', 'openid', 'profile'],
          redirectSignIn: ["http://localhost:3000/auth", "https://360.med.ubc.ca/auth", `https://dev.360.med.ubc.ca/auth`],
          redirectSignOut: ["http://localhost:3000/auth", "https://360.med.ubc.ca/auth", `https://dev.360.med.ubc.ca/auth`],
          responseType: 'code',
        }
      }
    }
  },
  API: {
    GraphQL: {
      endpoint: process.env.REACT_APP_APPSYNC_ENDPOINT,
      region: 'ca-central-1',
      defaultAuthMode: 'userPool'
    },
  },
});

cognitoUserPoolsTokenProvider.setKeyValueStorage(new CookieStorage());

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);