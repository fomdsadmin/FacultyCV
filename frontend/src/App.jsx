import { Amplify } from "aws-amplify";
import "./App.css";
import "@aws-amplify/ui-react/styles.css";
import React, { useEffect, useState } from "react";
import Header from "./Components/Headers.jsx";
import Footer from "./Components/Footer.jsx";
import { fetchUserAttributes, signOut, fetchAuthSession } from "aws-amplify/auth";
import { BrowserRouter as Router, Routes, Route, Navigate, redirect, useLocation } from "react-router-dom";
import AuthPage from "./Views/AuthPage";
import Dashboard from "./Pages/Dashboard/dashboard.jsx";
import Support from "./Views/support.jsx";
import NotFound from "./Views/NotFound";
import AcademicWork from "./Views/AcademicWork.jsx";
import Declarations from "./Pages/Declarations/Declarations.jsx";
import Reports from "./Pages/ReportsPage/ReportsPage.jsx";
import Assistants from "./Views/Assistants.jsx";
import { getPresignedUrl, getUser } from "./graphql/graphqlHelpers.js";
import PageContainer from "./Views/PageContainer.jsx";
import AssistantHomePage from "./Views/AssistantHomePage.jsx";
import AdminUsers from "./Views/AdminUsers.jsx";
import Archive from "./Views/Archive.jsx";
import Assistant_FacultyHomePage from "./Views/Assistant_FacultyHomePage.jsx";
import Assistant_Archive from "./Views/Assistant_Archive.jsx";
import Assistant_Reports from "./Views/Assistant_Reports.jsx";
//import Assistant_Assistants from './Views/Assistant_Assistants.jsx';
import Assistant_AcademicWork from "./Views/Assistant_AcademicWork.jsx";
import AdminHomePage from "./Views/AdminHomePage.jsx";
import TemplatesPage from "./Pages/TemplatePages/TemplatesPage/TemplatesPage.jsx";
import Sections from "./Views/Sections.jsx";
import AuditPage from "./Views/AuditPage.jsx";
import ArchivedSections from "./Views/ArchivedSections.jsx";
import PageViewLogger from "./Components/AuditLogger/PageViewLogger.jsx";
import DepartmentAdminUsers from "./Views/DepartmentAdminUsers.jsx";
import DepartmentAdminHomePage from "./Views/DepartmentAdminHomePage.jsx";
import DepartmentAdminUserInsights from "./Views/DepartmentAdminUserInsights.jsx";
import DepartmentAdminTemplates from "./Views/DepartmentAdminTemplates.jsx";
import DepartmentAdminSections from "./Views/DepartmentAdminSections.jsx";
import DepartmentAdminArchivedSections from "./Views/DepartmentAdminArchivedSections.jsx";
import { getJWT } from "./getAuthToken.js";
import { NotificationProvider } from "./Contexts/NotificationContext.jsx";
import Notification from "./Components/Notification.jsx";
import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito";
import { CookieStorage } from "aws-amplify/utils";
import FacultyHomePage from "./Pages/FacultyHomePage/FacultyHomePage";
import { AppProvider, useApp } from "./Contexts/AppContext";
import { ToastContainer } from "react-toastify";

Amplify.configure({
  API: {
    GraphQL: {
      endpoint: process.env.REACT_APP_APPSYNC_ENDPOINT,
      region: process.env.REACT_APP_AWS_REGION,
      defaultAuthMode: "userPool",
    },
  },
  Auth: {
    Cognito: {
      region: process.env.REACT_APP_AWS_REGION,
      userPoolClientId: process.env.REACT_APP_COGNITO_USER_POOL_CLIENT_ID,
      userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
      allowGuestAccess: false,
    },
  },
});

cognitoUserPoolsTokenProvider.setKeyValueStorage(new CookieStorage());

const AppContent = () => {
  const {
    getCognitoUser,
    setUserInfo,
    user,
    userInfo,
    assistantUserInfo,
    setAssistantUserInfo,
    loading,
    setLoading,
    currentViewRole,
    setCurrentViewRole,
  } = useApp();

  // Initialize view mode for redirects and route access
  useEffect(() => {
    if (user && userInfo && userInfo.role && !currentViewRole) {
      setCurrentViewRole(userInfo.role);
    }
  }, [user, userInfo]);

  const getUserInfo = async (email) => {
    try {
      const userInformation = await getUser(email);
      if (userInformation.role === "Assistant") {
        setAssistantUserInfo(userInformation);
      } else {
        setUserInfo(userInformation);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center w-full">
          <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
        </div>
      </PageContainer>
    );
  }

  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={1000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      {user && <Header userInfo={userInfo} getCognitoUser={getCognitoUser} />}
      {user && <PageViewLogger userInfo={userInfo} />}
      <Routes>
        {/* Main home route - redirects based on role */}
        <Route
          path="/home"
          element={
            user ? (
              Object.keys(userInfo).length !== 0 && userInfo.role === "Admin" ? (
                <Navigate to="/admin/home" />
              ) : Object.keys(userInfo).length !== 0 && userInfo.role.startsWith("Admin-") ? (
                <Navigate to="/department-admin/home" />
              ) : Object.keys(assistantUserInfo).length !== 0 && assistantUserInfo.role === "Assistant" ? (
                <Navigate to="/assistant/home" />
              ) : Object.keys(userInfo).length !== 0 && userInfo.role === "Faculty" ? (
                <Navigate to="/faculty/home" />
              ) : (
                <PageContainer>
                  <div className="flex items-center justify-center w-full">
                    <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
                  </div>
                </PageContainer>
              )
            ) : (
              <Navigate to="/auth" />
            )
          }
        />

        {/* Role-specific home routes that check currentViewRole */}
        <Route
          path="/admin/users"
          element={
            user && userInfo.role === "Admin" && currentViewRole === "Admin" ? (
              <AdminUsers userInfo={userInfo} getCognitoUser={getCognitoUser} />
            ) : (
              <Navigate to="/auth" />
            )
          }
        />

        <Route
          path="/admin/home"
          element={user ? <AdminHomePage userInfo={userInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />}
        />

        <Route
          path="/department-admin/home"
          element={
            user &&
            (userInfo.role.startsWith("Admin-") || userInfo.role === "Admin") &&
            currentViewRole.startsWith("Admin-") ? (
              <DepartmentAdminHomePage
                userInfo={userInfo}
                getCognitoUser={getCognitoUser}
                department={userInfo && userInfo.role ? userInfo.role.split("-")[1] : ""}
              />
            ) : (
              <Navigate to="/auth" />
            )
          }
        />

        <Route
          path="/faculty/home"
          element={
            user &&
            (userInfo.role === "Faculty" || userInfo.role.startsWith("Admin-") || userInfo.role === "Admin") &&
            currentViewRole === "Faculty" ? (
              <FacultyHomePage
                userInfo={{ ...userInfo, role: "Faculty" }} // Use Faculty role in view
                setUserInfo={setUserInfo}
                getCognitoUser={getCognitoUser}
                getUser={getUserInfo}
              />
            ) : (
              <Navigate to="/home" />
            )
          }
        />

        <Route
          path="/assistant/home"
          element={
            user &&
            (assistantUserInfo.role === "Assistant" || userInfo.role === "Admin") &&
            currentViewRole === "Assistant" ? (
              <Assistant_FacultyHomePage
                assistantUserInfo={assistantUserInfo}
                userInfo={userInfo}
                setUserInfo={setUserInfo}
                getUser={getUserInfo}
                getCognitoUser={getCognitoUser}
              />
            ) : (
              <Navigate to="/home" />
            )
          }
        />

        {/* Auth route remains the same */}
        <Route path="/auth" element={user ? <Navigate to="/home" /> : <AuthPage getCognitoUser={getCognitoUser} />} />

        {/* Faculty dashboard */}
        <Route
          path="/faculty/dashboard"
          element={user ? <Dashboard userInfo={userInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />}
        />

        {/* Other existing routes remain unchanged */}
        <Route
          path="/faculty/home/affiliations"
          element={user ? <FacultyHomePage tab="affiliations" /> : <Navigate to="/auth" />}
        />
        <Route
          path="/faculty/home/employment"
          element={user ? <FacultyHomePage tab="employment" /> : <Navigate to="/auth" />}
        />
        <Route
          path="/faculty/home/education"
          element={user ? <FacultyHomePage tab="education" /> : <Navigate to="/auth" />}
        />
        <Route
          path="/support"
          element={user ? <Support userInfo={userInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />}
        />
        <Route
          path="/faculty/academic-work"
          element={
            user ? <AcademicWork getCognitoUser={getCognitoUser} userInfo={userInfo} /> : <Navigate to="/auth" />
          }
        />
        <Route
          path="/faculty/academic-work/:category"
          element={
            user ? <AcademicWork getCognitoUser={getCognitoUser} userInfo={userInfo} /> : <Navigate to="/auth" />
          }
        />
        <Route
          path="/faculty/academic-work/:category/:title"
          element={
            user ? <AcademicWork getCognitoUser={getCognitoUser} userInfo={userInfo} /> : <Navigate to="/auth" />
          }
        />
        <Route
          path="/faculty/declarations"
          element={
            user ? <Declarations userInfo={userInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />
          }
        />
        <Route
          path="/reports"
          element={user ? <Reports userInfo={userInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />}
        />
        <Route
          path="/faculty/assistants"
          element={user ? <Assistants userInfo={userInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />}
        />
        <Route
          path="/archive"
          element={user ? <Archive userInfo={userInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />}
        />
        <Route
          path="/assistant/home"
          element={
            user ? (
              <Assistant_FacultyHomePage
                assistantUserInfo={assistantUserInfo}
                userInfo={userInfo}
                setUserInfo={setUserInfo}
                getUser={getUserInfo}
                getCognitoUser={getCognitoUser}
              />
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
        <Route
          path="/assistant/academic-work"
          element={
            user ? (
              <Assistant_AcademicWork
                assistantUserInfo={assistantUserInfo}
                userInfo={userInfo}
                getCognitoUser={getCognitoUser}
              />
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
        <Route
          path="/assistant/reports"
          element={
            user ? (
              <Assistant_Reports
                assistantUserInfo={assistantUserInfo}
                userInfo={userInfo}
                getCognitoUser={getCognitoUser}
              />
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
        {/* <Route path="/assistant/assistants" element={user ? <Assistant_Assistants assistantUserInfo={assistantUserInfo} userInfo={userInfo} getCognitoUser={getCognitoUser}/> : <Navigate to="/auth" />} /> */}
        <Route
          path="/assistant/archive"
          element={
            user ? (
              <Assistant_Archive
                assistantUserInfo={assistantUserInfo}
                userInfo={userInfo}
                getCognitoUser={getCognitoUser}
              />
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
        <Route
          path="/audit"
          element={user ? <AuditPage userInfo={userInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />}
        />
        <Route path="/templates" element={user ? <TemplatesPage /> : <Navigate to="/auth" />} />
        <Route
          path="/sections"
          element={user ? <Sections userInfo={userInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />}
        />
        <Route
          path="/sections/manage"
          element={user ? <Sections userInfo={userInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />}
        />
        <Route
          path="/sections/:category"
          element={user ? <Sections userInfo={userInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />}
        />
        <Route
          path="/sections/:category/:title"
          element={user ? <Sections userInfo={userInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />}
        />
        <Route
          path="/archived-sections"
          element={
            user ? <ArchivedSections userInfo={userInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />
          }
        />
        <Route
          path="/department-admin/users"
          element={
            user ? (
              <DepartmentAdminUsers
                userInfo={{ ...userInfo, role: currentViewRole }} // Pass current view role
                getCognitoUser={getCognitoUser}
                department={currentViewRole.split("-")[1] || ""}
              />
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
        <Route
          path="/department-admin/users/:userId"
          element={
            user ? (
              <DepartmentAdminUsers
                userInfo={{ ...userInfo, role: currentViewRole }} // Pass current view role
                getCognitoUser={getCognitoUser}
                department={currentViewRole.split("-")[1] || ""}
              />
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
        <Route
          path="/department-admin/analytics"
          element={
            user ? (
              <DepartmentAdminHomePage
                userInfo={userInfo}
                getCognitoUser={getCognitoUser}
                department={userInfo && userInfo.role ? userInfo.role.split("-")[1] : ""}
              />
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
        <Route
          path="/department-admin/templates"
          element={
            user ? (
              <DepartmentAdminTemplates
                userInfo={userInfo}
                getCognitoUser={getCognitoUser}
                department={userInfo && userInfo.role ? userInfo.role.split("-")[1] : ""}
              />
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
        <Route
          path="/department-admin/sections"
          element={
            user ? (
              <DepartmentAdminSections
                userInfo={userInfo}
                getCognitoUser={getCognitoUser}
                department={userInfo && userInfo.role ? userInfo.role.split("-")[1] : ""}
              />
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
        <Route
          path="/department-admin/archived-sections"
          element={
            user ? (
              <DepartmentAdminArchivedSections
                userInfo={userInfo}
                getCognitoUser={getCognitoUser}
                department={userInfo && userInfo.role ? userInfo.role.split("-")[1] : ""}
              />
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {user && <Footer />}
    </Router>
  );
};

const App = () => {
  return (
    <AppProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AppProvider>
  );
};

export default App;
