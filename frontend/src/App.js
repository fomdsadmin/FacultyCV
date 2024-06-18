import { Amplify } from 'aws-amplify';
import './App.css';
import '@aws-amplify/ui-react/styles.css';
import React, { useEffect, useState } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import HomePage from './HomePage';
import SignInPage from './auth/SignInPage';
import SignUpPage from './auth/SignUpPage';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

Amplify.configure({
  API: {
    GraphQL: {
      endpoint: process.env.REACT_APP_APPSYNC_ENDPOINT,
      region: process.env.REACT_APP_AWS_REGION,
      defaultAuthMode: 'userPool',
    }
  },
  Auth: {
    Cognito: {
      region: process.env.REACT_APP_AWS_REGION,
      userPoolClientId: process.env.REACT_APP_COGNITO_USER_POOL_CLIENT_ID,
      userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
      allowGuestAccess: false
    }
  },
});

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function getUser() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        console.log(currentUser.signInDetails.loginId, "is signed in");
        <Navigate to="/" />
      }
      catch (error) {
        setUser(null);
        console.log('Error getting user:', error);
        <Navigate to="/signin" />
      }
    }
    getUser();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <HomePage user = {user} /> : <Navigate to="/signin" />} />
        <Route path="/signin" element={user ? <Navigate to="/" /> : <SignInPage />} />
        <Route path="/signup" element={user ? <Navigate to="/" /> : <SignUpPage />} />
      </Routes>
    </Router>
  );
}

export default App;
