import { Amplify } from 'aws-amplify';
import './App.css';
import '@aws-amplify/ui-react/styles.css';
import React, { useEffect, useState } from 'react';
import Header from './Components/Headers.jsx';
import Footer from './Components/Footer.jsx';
import { fetchUserAttributes, signOut, fetchAuthSession } from 'aws-amplify/auth';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './Views/AuthPage';
import Dashboard from './Views/dashboard.jsx';
import Support from './Views/support.jsx';
import NotFound from './Views/NotFound';
import AcademicWork from './Views/AcademicWork';
import Declarations from './Views/Declarations.jsx';
import Reports from './Views/Reports.jsx';
import Assistants from './Views/Assistants.jsx';
import { getPresignedUrl, getUser } from './graphql/graphqlHelpers.js';
import PageContainer from './Views/PageContainer.jsx';
import AssistantHomePage from './Views/AssistantHomePage.jsx';
import AdminHomePage from './Views/AdminHomePage.jsx';
import Archive from './Views/Archive.jsx';
import Assistant_FacultyHomePage from './Views/Assistant_FacultyHomePage.jsx';
import Assistant_Archive from './Views/Assistant_Archive.jsx';
import Assistant_Reports from './Views/Assistant_Reports.jsx';
//import Assistant_Assistants from './Views/Assistant_Assistants.jsx';
import Assistant_AcademicWork from './Views/Assistant_AcademicWork.jsx';
import Analytics from './Views/Analytics.jsx';
import Templates from './Views/Templates.jsx';
import Sections from './Views/Sections.jsx';
import ArchivedSections from './Views/ArchivedSections.jsx';
import DepartmentAdminHomePage from './Views/DepartmentAdminHomePage.jsx';
import DepartmentAdminAnalytics from './Views/DepartmentAdminAnalytics.jsx';
import DepartmentAdminTemplates from './Views/DepartmentAdminTemplates.jsx';
//import DepartmentAdminSections from './Views/DepartmentAdminSections.jsx';
//import DepartmentAdminArchivedSections from './Views/DepartmentAdminArchivedSections.jsx';
import { getJWT } from './getAuthToken.js';
import { NotificationProvider } from './Contexts/NotificationContext.jsx';
import Notification from './Components/Notification.jsx';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import { CookieStorage } from 'aws-amplify/utils';
import FacultyHomePage from './Pages/FacultyHomePage/FacultyHomePage';
import { AppProvider, useApp } from './Contexts/AppContext';

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

cognitoUserPoolsTokenProvider.setKeyValueStorage(new CookieStorage());

const AppContent = () => {

  //const [user, setUser] = useState(null);
  //const [userInfo, setUserInfo] = useState({});
  //const [assistantUserInfo, setAssistantUserInfo] = useState({});
  //const [loading, setLoading] = useState(false);
  //const [userGroup, setUserGroup] = useState(null);
  //const [viewMode, setViewMode] = useState('department-admin'); // 'department-admin' or 'faculty'

  const { getCognitoUser, setUserInfo, user, userInfo, assistantUserInfo, setAssistantUserInfo, loading, setLoading, viewMode, setViewMode } = useApp();


  const toggleViewMode = () => {
    setViewMode((prevMode) => (prevMode === 'department-admin' ? 'faculty' : 'department-admin'));
  };


  async function getUserGroup() {
    try {
      const session = await fetchAuthSession();

      const groups = session.tokens.idToken.payload['cognito:groups']

      return groups ? groups[0] : null;
    } catch (error) {

    }
  }

  async function getUserInfo(email) {
    try {
      const userInformation = await getUser(email);
      if (userInformation.role === 'Assistant') {
        setAssistantUserInfo(userInformation);

      } else {
        setUserInfo(userInformation);

      }
      setLoading(false);
    } catch (error) {
      setLoading(false);

    }
  }

  useEffect(() => {
    getCognitoUser();
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <div className='flex items-center justify-center w-full'>
          <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
        </div>
      </PageContainer>
    )
  }
  return (
    <Router>
       {user && <Header />}
      <Routes>
        <Route path="/home" element={user ? (
          Object.keys(userInfo).length !== 0 && userInfo.role === 'Admin' ? <AdminHomePage userInfo={userInfo} getCognitoUser={getCognitoUser} /> :
            Object.keys(userInfo).length !== 0 && userInfo.role.startsWith('Admin-') ? (
              viewMode === 'department-admin' ? (
                <DepartmentAdminHomePage
                  userInfo={userInfo}
                  getCognitoUser={getCognitoUser}
                  department={userInfo.role.split('-')[1]} // Extract the department from the role
                  toggleViewMode={toggleViewMode} // Pass the toggle function
                />
              ) : (
                <FacultyHomePage
                  userInfo={userInfo}
                  setUserInfo={setUserInfo}
                  getCognitoUser={getCognitoUser}
                  getUser={getUserInfo}
                  toggleViewMode={toggleViewMode} // Pass the toggle function
                />
              )
            ) :
              Object.keys(assistantUserInfo).length !== 0 && assistantUserInfo.role === 'Assistant' ? <AssistantHomePage userInfo={assistantUserInfo} setUserInfo={setAssistantUserInfo} getCognitoUser={getCognitoUser} getUser={getUserInfo} /> :
                Object.keys(userInfo).length !== 0 && userInfo.role === 'Faculty' ? <FacultyHomePage/> :
                  <PageContainer>
                    <div className='flex items-center justify-center w-full'>
                      <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
                    </div>
                  </PageContainer>
        ) : <Navigate to="/auth" />} />
        <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <AuthPage getCognitoUser={getCognitoUser} />} />
        <Route path="/dashboard" element={user ? <Dashboard userInfo={userInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />} />
        <Route path="/home" element={user ? <FacultyHomePage/> : <Navigate to="/auth" />} />
        <Route path="/support" element={user ? <Support userInfo={userInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />} />
        <Route path="/academic-work" element={user ? <AcademicWork userInfo={userInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />} />
		    <Route path="/declarations" element={user ? <Declarations userInfo = {userInfo} getCognitoUser = {getCognitoUser}/> : <Navigate to="/auth" />} />
        <Route path="/reports" element={user ? <Reports userInfo={userInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />} />
        <Route path="/assistants" element={user ? <Assistants userInfo={userInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />} />
        <Route path="/archive" element={user ? <Archive userInfo={userInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />} />
        <Route path="/assistant/home" element={user ? <Assistant_FacultyHomePage assistantUserInfo={assistantUserInfo} userInfo={userInfo} setUserInfo={setUserInfo} getUser={getUserInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />} />
        <Route path="/assistant/academic-work" element={user ? <Assistant_AcademicWork assistantUserInfo={assistantUserInfo} userInfo={userInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />} />
        <Route path="/assistant/reports" element={user ? <Assistant_Reports assistantUserInfo={assistantUserInfo} userInfo={userInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />} />
        {/* <Route path="/assistant/assistants" element={user ? <Assistant_Assistants assistantUserInfo={assistantUserInfo} userInfo={userInfo} getCognitoUser={getCognitoUser}/> : <Navigate to="/auth" />} /> */}
        <Route path="/assistant/archive" element={user ? <Assistant_Archive assistantUserInfo={assistantUserInfo} userInfo={userInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />} />
        <Route path="/analytics" element={user ? <Analytics userInfo={userInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />} />
        <Route path="/templates" element={user ? <Templates userInfo={userInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />} />
        <Route path="/sections" element={user ? <Sections userInfo={userInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />} />
        <Route path="/archived-sections" element={user ? <ArchivedSections userInfo={userInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />} />
        <Route path="/department-admin/analytics" element={user ? <DepartmentAdminAnalytics userInfo={userInfo} getCognitoUser={getCognitoUser} department={userInfo && userInfo.role ? userInfo.role.split('-')[1] : ''} toggleViewMode={toggleViewMode} /> : <Navigate to="/auth" />} />
        <Route path="/department-admin/templates" element={user ? <DepartmentAdminTemplates userInfo={userInfo} getCognitoUser={getCognitoUser} department={userInfo && userInfo.role ? userInfo.role.split('-')[1] : ''} /> : <Navigate to="/auth" />} />
        {/* <Route path="/department-admin/sections" element={user ? <DepartmentAdminSections userInfo={userInfo} getCognitoUser={getCognitoUser} department={userInfo && userInfo.role ? userInfo.role.split('-')[1] : ''} /> : <Navigate to="/auth" />} />
        <Route path="/department-admin/archived-sections" element={user ? <DepartmentAdminArchivedSections userInfo={userInfo} getCognitoUser={getCognitoUser} department={userInfo && userInfo.role ? userInfo.role.split('-')[1] : ''} /> : <Navigate to="/auth" />} /> */}
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {user && <Footer />}
    </Router>

  );
}

const App = () => {
  return <>
    <AppProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AppProvider>
  </>
}

export default App;