import "./App.css";
import "@aws-amplify/ui-react/styles.css";
import Header from "./Components/Headers.jsx";
import Footer from "./Components/Footer.jsx";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./Views/AuthPage";
import Dashboard from "./Pages/Dashboard/dashboard.jsx";
import Support from "./Views/support.jsx";
import NotFound from "./Views/NotFound";
import AcademicWork from "./Views/AcademicWork.jsx";
import Declarations from "./Pages/Declarations/Declarations.jsx";
import Reports from "./Pages/ReportsPage/ReportsPage.jsx";
import Assistants from "./Views/Assistants.jsx";
import { getUser } from "./graphql/graphqlHelpers.js";
import PageContainer from "./Views/PageContainer.jsx";
import AdminUsers from "./Views/AdminUsers.jsx";
import Archive from "./Views/Archive.jsx";
import AssistantConnections from "./Views/AssistantConnections.jsx";
import Assistant_FacultyHomePage from "./Views/Assistant_FacultyHomePage.jsx";
import Assistant_Archive from "./Views/Assistant_Archive.jsx";
import Assistant_Reports from "./Views/Assistant_Reports.jsx";
import Assistant_AcademicWork from "./Views/Assistant_AcademicWork.jsx";
import AdminHomePage from "./Views/AdminHomePage.jsx";
import TemplatesPage from "./Pages/TemplatePages/TemplatesPage/TemplatesPage.jsx";
import Sections from "./Views/Sections.jsx";
import AuditPage from "./Views/AuditPage.jsx";
import { AuditLoggerProvider } from "./Contexts/AuditLoggerContext.jsx";
import ArchivedSections from "./Views/ArchivedSections.jsx";
import DepartmentAdminUsers from "./Views/DepartmentAdminUsers.jsx";
import DepartmentAdminHomePage from "./Views/DepartmentAdminHomePage.jsx";
import DepartmentAdminTemplates from "./Views/DepartmentAdminTemplates.jsx";
import DepartmentAdminGenerateCV from "./Views/DepartmentAdminGenerateCV.jsx";
import AdminGenerateCV from "./Views/AdminGenerateCV.jsx";
import FacultyAdminHomePage from "./Views/FacultyAdminHomePage.jsx";
import FacultyAdminUsers from "./Views/FacultyAdminUsers.jsx";
import FacultyAdminGenerateCV from "./Views/FacultyAdminGenerateCV.jsx";
import { NotificationProvider } from "./Contexts/NotificationContext.jsx";
import FacultyHomePage from "./Pages/FacultyHomePage/FacultyHomePage";
import { AppProvider, useApp } from "./Contexts/AppContext";
import { ToastContainer } from "react-toastify";
import KeycloakLogout from "Components/KeycloakLogout";

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
    toggleViewMode,
    isUserLoggedIn,
    isUserPending,
    isUserApproved,
  } = useApp();

  const getUserInfo = async (username) => {
    try {
      const userInformation = await getUser(username);
      // console.log("userInformation, none because we don't add user...", userInformation)
      if (userInformation.role === "Assistant") {
        setAssistantUserInfo(userInformation);
        setUserInfo(userInformation);
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
      <AuditLoggerProvider userInfo={userInfo}>
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
        {isUserLoggedIn && <Header assistantUserInfo={assistantUserInfo} />}
        {!isUserLoggedIn ? (
          <Routes>
            <Route path="/keycloak-logout" element={<KeycloakLogout />} />
            <Route path="/auth" element={<AuthPage getCognitoUser={getCognitoUser} />} />
            <Route path="/*" element={<Navigate to="/auth" />} />
          </Routes>
        ) : isUserPending || !isUserApproved ? (
          <Routes>
            <Route path="/keycloak-logout" element={<KeycloakLogout />} />
            <Route path="/auth" element={<AuthPage getCognitoUser={getCognitoUser} />} />
            <Route path="/*" element={<Navigate to="/auth" />} />
          </Routes>
          ) : (
          // User is logged in and approved - allow access to all routes
          <Routes>
            <Route path="/keycloak-logout" element={<KeycloakLogout />} />
            {/* Main home route - redirects based on role */}
            <Route
              path="/home"
              element={
                Object.keys(userInfo).length !== 0 && userInfo.role === "Admin" ? (
                  <Navigate to="/admin/home" />
                ) : Object.keys(userInfo).length !== 0 &&
                  typeof userInfo.role === "string" &&
                  userInfo.role.startsWith("FacultyAdmin-") ? (
                  <Navigate to="/faculty-admin/home" />
                ) : Object.keys(userInfo).length !== 0 &&
                  typeof userInfo.role === "string" &&
                  userInfo.role.startsWith("Admin-") ? (
                  <Navigate to="/department-admin/home" />
                ) : Object.keys(assistantUserInfo).length !== 0 && assistantUserInfo.role === "Assistant" ? (
                  <Navigate to="/assistant/home" />
                ) : Object.keys(userInfo).length !== 0 && userInfo.role === "Faculty" ? (
                  <Navigate to="/faculty/home" />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/assistant/home"
              element={
                assistantUserInfo.role === "Assistant" && currentViewRole === "Assistant" ? (
                  <Assistant_FacultyHomePage
                    assistantUserInfo={assistantUserInfo}
                    userInfo={assistantUserInfo}
                    setUserInfo={setAssistantUserInfo}
                    getUser={getUserInfo}
                    getCognitoUser={getCognitoUser}
                  />
                ) : (
                  <Navigate to="/home" />
                )
              }
            />
            {/* Role-specific home routes that check currentViewRole */}
            <Route
              path="/admin/users"
              element={
                userInfo.role === "Admin" && currentViewRole === "Admin" ? (
                  <AdminUsers userInfo={userInfo} getCognitoUser={getCognitoUser} />
                ) : (
                  <Navigate to="/home" />
                )
              }
            />

            <Route
              path="/admin/generate"
              element={
                userInfo.role === "Admin" && currentViewRole === "Admin" ? (
                  <AdminGenerateCV userInfo={userInfo} getCognitoUser={getCognitoUser} />
                ) : (
                  <Navigate to="/home" />
                )
              }
            />

            <Route path="/admin/home" element={<AdminHomePage userInfo={userInfo} getCognitoUser={getCognitoUser} />} />

            <Route
              path="/department-admin/home"
              element={
                typeof userInfo.role === "string" &&
                (userInfo.role.startsWith("Admin-") || userInfo.role === "Admin") &&
                typeof currentViewRole === "string" &&
                currentViewRole.startsWith("Admin-") ? (
                  <DepartmentAdminHomePage
                    userInfo={userInfo}
                    getCognitoUser={getCognitoUser}
                    department={
                      typeof userInfo.role === "string" && userInfo.role.split("-")[1]
                        ? userInfo.role.split("-")[1]
                        : "All"
                    }
                  />
                ) : (
                  <Navigate to="/home" />
                )
              }
            />

            <Route
              path="/faculty-admin/home"
              element={
                typeof userInfo.role === "string" &&
                (userInfo.role.startsWith("FacultyAdmin-") || userInfo.role === "Admin") ? (
                  <FacultyAdminHomePage
                    userInfo={userInfo}
                    getCognitoUser={getCognitoUser}
                    toggleViewMode={toggleViewMode}
                  />
                ) : (
                  <Navigate to="/home" />
                )
              }
            />

            <Route
              path="/faculty/home"
              element={
                typeof userInfo.role === "string" &&
                (userInfo.role === "Faculty" ||
                  userInfo.role.startsWith("Admin-") ||
                  userInfo.role.startsWith("FacultyAdmin-") ||
                  userInfo.role === "Admin") &&
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

            {/* Auth route - allow access for registration/approval flow */}
            <Route path="/auth" element={<AuthPage getCognitoUser={getCognitoUser} />} />

            {/* Faculty dashboard - no restrictions for approved users */}
            <Route
              path="/faculty/dashboard"
              element={<Dashboard userInfo={userInfo} getCognitoUser={getCognitoUser} />}
            />

            {/* Other routes - no restrictions for approved users */}
            <Route path="/faculty/home/affiliations" element={<FacultyHomePage tab="affiliations" />} />
            <Route path="/faculty/home/employment" element={<FacultyHomePage tab="employment" />} />
            <Route path="/faculty/home/education" element={<FacultyHomePage tab="education" />} />
            <Route path="/support" element={<Support userInfo={userInfo} getCognitoUser={getCognitoUser} />} />
            <Route
              path="/faculty/academic-work"
              element={<AcademicWork getCognitoUser={getCognitoUser} userInfo={userInfo} />}
            />
            <Route
              path="/faculty/academic-work/:category"
              element={<AcademicWork getCognitoUser={getCognitoUser} userInfo={userInfo} />}
            />
            <Route
              path="/faculty/academic-work/:category/:title"
              element={<AcademicWork getCognitoUser={getCognitoUser} userInfo={userInfo} />}
            />
            <Route
              path="/faculty/declarations"
              element={<Declarations userInfo={userInfo} getCognitoUser={getCognitoUser} />}
            />
            <Route
              path="/faculty/declarations/:action"
              element={<Declarations userInfo={userInfo} getCognitoUser={getCognitoUser} />}
            />
            <Route
              path="/faculty/declarations/:action/:year"
              element={<Declarations userInfo={userInfo} getCognitoUser={getCognitoUser} />}
            />
            <Route path="/faculty/reports" element={<Reports userInfo={userInfo} getCognitoUser={getCognitoUser} />} />
            <Route
              path="/faculty/assistants"
              element={<Assistants userInfo={userInfo} getCognitoUser={getCognitoUser} />}
            />
            <Route path="/archive" element={<Archive userInfo={userInfo} getCognitoUser={getCognitoUser} />} />
            <Route
              path="/assistant/academic-work"
              element={
                <Assistant_AcademicWork
                  assistantUserInfo={assistantUserInfo}
                  userInfo={userInfo}
                  getCognitoUser={getCognitoUser}
                />
              }
            />
            <Route
              path="/assistant/academic-work/:category"
              element={
                <Assistant_AcademicWork
                  assistantUserInfo={assistantUserInfo}
                  userInfo={userInfo}
                  getCognitoUser={getCognitoUser}
                />
              }
            />
            <Route
              path="/assistant/academic-work/:category/:title"
              element={
                <Assistant_AcademicWork
                  assistantUserInfo={assistantUserInfo}
                  userInfo={userInfo}
                  getCognitoUser={getCognitoUser}
                />
              }
            />
            <Route
              path="/assistant/reports"
              element={
                <Assistant_Reports
                  assistantUserInfo={assistantUserInfo}
                  userInfo={userInfo}
                  getCognitoUser={getCognitoUser}
                />
              }
            />
            <Route
              path="/assistant/connections"
              element={
                <AssistantConnections
                  assistantUserInfo={assistantUserInfo}
                  userInfo={assistantUserInfo}
                  setUserInfo={setAssistantUserInfo}
                  getUser={getUserInfo}
                  getCognitoUser={getCognitoUser}
                />
              }
            />
            <Route
              path="/assistant/archive"
              element={
                <Assistant_Archive
                  assistantUserInfo={assistantUserInfo}
                  userInfo={userInfo}
                  getCognitoUser={getCognitoUser}
                />
              }
            />
            <Route path="/audit" element={<AuditPage userInfo={userInfo} getCognitoUser={getCognitoUser} />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/sections" element={<Sections userInfo={userInfo} getCognitoUser={getCognitoUser} />} />
            <Route path="/sections/manage" element={<Sections userInfo={userInfo} getCognitoUser={getCognitoUser} />} />
            <Route
              path="/sections/:category"
              element={<Sections userInfo={userInfo} getCognitoUser={getCognitoUser} />}
            />
            <Route
              path="/sections/:category/:title"
              element={<Sections userInfo={userInfo} getCognitoUser={getCognitoUser} />}
            />
            <Route
              path="/sections/:category/:title/data"
              element={
                user ? <Sections userInfo={userInfo} getCognitoUser={getCognitoUser} /> : <Navigate to="/auth" />
              }
            />
            <Route
              path="/archived-sections"
              element={<ArchivedSections userInfo={userInfo} getCognitoUser={getCognitoUser} />}
            />
            <Route
              path="/department-admin/users"
              element={
                <DepartmentAdminUsers
                  userInfo={{ ...userInfo, role: currentViewRole }}
                  getCognitoUser={getCognitoUser}
                  department={currentViewRole && currentViewRole.split ? currentViewRole.split("-")[1] || "" : ""}
                />
              }
            />
            <Route
              path="/department-admin/users/:userId"
              element={
                <DepartmentAdminUsers
                  userInfo={{ ...userInfo, role: currentViewRole }}
                  getCognitoUser={getCognitoUser}
                  department={currentViewRole && currentViewRole.split ? currentViewRole.split("-")[1] || "" : ""}
                />
              }
            />
            <Route
              path="/department-admin/analytics"
              element={
                <DepartmentAdminHomePage
                  userInfo={userInfo}
                  getCognitoUser={getCognitoUser}
                  department={userInfo && userInfo.role ? userInfo.role.split("-")[1] : ""}
                />
              }
            />
            <Route
              path="/department-admin/templates"
              element={
                <DepartmentAdminTemplates
                  userInfo={userInfo}
                  getCognitoUser={getCognitoUser}
                  department={userInfo && userInfo.role ? userInfo.role.split("-")[1] : ""}
                />
              }
            />
            <Route
              path="/department-admin/generate"
              element={
                <DepartmentAdminGenerateCV
                  userInfo={userInfo}
                  getCognitoUser={getCognitoUser}
                  department={userInfo && userInfo.role ? userInfo.role.split("-")[1] : ""}
                />
              }
            />

            {/* Faculty Admin Routes */}
            <Route
              path="/faculty-admin/users"
              element={
                typeof userInfo.role === "string" &&
                (userInfo.role.startsWith("FacultyAdmin-") || userInfo.role === "Admin") ? (
                  <FacultyAdminUsers
                    userInfo={userInfo}
                    getCognitoUser={getCognitoUser}
                    toggleViewMode={toggleViewMode}
                  />
                ) : (
                  <Navigate to="/home" />
                )
              }
            />

            <Route
              path="/faculty-admin/generate-cv"
              element={
                typeof userInfo.role === "string" &&
                (userInfo.role.startsWith("FacultyAdmin-") || userInfo.role === "Admin") ? (
                  <FacultyAdminGenerateCV
                    userInfo={userInfo}
                    getCognitoUser={getCognitoUser}
                    toggleViewMode={toggleViewMode}
                  />
                ) : (
                  <Navigate to="/home" />
                )
              }
            />

            <Route path="/" element={<Navigate to="/home" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        )}
        {isUserLoggedIn && <Footer />}
      </AuditLoggerProvider>
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
