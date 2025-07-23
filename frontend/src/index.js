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
      userPoolClientId: '10shpk39hmqk6iros3mn3q88l4',
      userPoolId: 'ca-central-1_4QA5peGTF',
      loginWith: { // Optional
        oauth: {
          domain: 'ca-central-14qa5pegtf.auth.ca-central-1.amazoncognito.com',
          scopes: ['aws.cognito.signin.user.admin', 'email', 'openid', 'profile'],
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