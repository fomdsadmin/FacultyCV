import { Amplify } from 'aws-amplify';
import './App.css';
import '@aws-amplify/ui-react/styles.css';
import React, { useEffect, useState } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './Views/HomePage.jsx';
import AuthPage from './Views/AuthPage.jsx';
import NotFound from './Views/NotFound.jsx';
import AcademicWork from './Views/AcademicWork.jsx';
import Reports from './Views/Reports.jsx';
import Assistants from './Views/Assistants.jsx';
import { getUser } from './graphql/graphqlHelpers.js';

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
  const [userInfo, setUserInfo] = useState({});
  //get user info and render page based on role

  useEffect(() => {
    async function getUserInfo(email) {
      try {
        const userInformation = await getUser(email);
        setUserInfo(userInformation);
        console.log(userInformation);
      } catch (error) {
        console.log('Error getting user:', error);
      }
    }

    async function getCognitoUser() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        console.log(currentUser.signInDetails.loginId, "is signed in");
        getUserInfo(currentUser.signInDetails.loginId);
        <Navigate to="/home" />
      }
      catch (error) {
        setUser(null);
        console.log('Error getting user:', error);
        <Navigate to="/auth" />
      }
    }
    
    getCognitoUser();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/home" element={user ? <HomePage userInfo = {userInfo} /> : <Navigate to="/auth" />} />
        <Route path="/auth" element={user ? <Navigate to="/home" /> : <AuthPage />} />
        <Route path="/academic-work" element={user ? <AcademicWork user = {userInfo} /> : <Navigate to="/auth" />} />
        <Route path="/reports" element={user ? <Reports user = {userInfo} /> : <Navigate to="/auth" />} />
        <Route path="/assistants" element={user ? <Assistants user = {userInfo} /> : <Navigate to="/auth" />} />
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
