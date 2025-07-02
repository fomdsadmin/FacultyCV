import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from "react-oidc-context";


const cognitoAuthConfig = {
  authority: "https://cognito-idp.ca-central-1.amazonaws.com/ca-central-1_BO47RpLGu",
  client_id: "35ies7u543bt5j2tu52r1o6ui3",
  redirect_uri: "http://localhost:3000",
  response_type: "code",
  scope: "email openid profile",
};

const root = ReactDOM.createRoot(document.getElementById("root"));

// wrap the application with AuthProvider
root.render(
  <React.StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);