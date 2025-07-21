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
      userPoolClientId: '35ies7u543bt5j2tu52r1o6ui3',
      userPoolId: 'ca-central-1_BO47RpLGu',
      loginWith: { // Optional
        oauth: {
          domain: 'ca-central-1bo47rplgu.auth.ca-central-1.amazoncognito.com',
          scopes: ['openid', 'email', 'profile', 'aws.cognito.signin.user.admin'],
          redirectSignIn: ['http://localhost:3000/auth'],
          redirectSignOut: ['http://localhost:3000/auth'],
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

cognitoUserPoolsTokenProvider.setKeyValueStorage(new CookieStorage());

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);