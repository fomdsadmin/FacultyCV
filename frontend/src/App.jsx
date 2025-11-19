import "./App.css";
import "@aws-amplify/ui-react/styles.css";
import Header from "./Components/Headers.jsx";
import Footer from "./Components/Footer.jsx";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./Views/AuthPage";
import Dashboard from "./Pages/Dashboard/dashboard.jsx"
import SupportForm from "./Views/support.jsx";
import NotFound from "./Views/NotFound";
import AcademicWork from "./Pages/AcademicWork/AcademicWork.jsx";
import Declarations from "./Pages/Declarations/Declarations.jsx";
import Reports from "./Pages/ReportsPage/ReportsPage.jsx";
import FacultyDelegates from "./Views/FacultyDelegates.jsx";
import AdminUsers from "./Views/AdminUsers.jsx";
import Archive from "./Views/Archive.jsx";
import DelegateConnections from "./Views/DelegateConnections.jsx";
import DelegateHomePage from "./Views/DelegateHomePage.jsx";
import Assistant_Archive from "./Views/Assistant_Archive.jsx";
import Assistant_AcademicWork from "./Views/Assistant_AcademicWork.jsx";
import AdminHomePage from "./Views/AdminHomePage.jsx";
import TemplatesPage from "./Pages/TemplatePages/TemplatesPage/TemplatesPage.jsx";
import Sections from "./Views/Sections.jsx";
import AuditPage from "./Pages/AuditLogPages/AuditPage.jsx";
import { AuditLoggerProvider } from "./Contexts/AuditLoggerContext.jsx";
import ArchivedSections from "./Views/ArchivedSections.jsx";
import DepartmentAdminMembers from "./Views/DepartmentAdminMembers.jsx";
import DepartmentAdminDashboard from "./Views/DepartmentAdminDashboard.jsx";
import DepartmentAdminTemplates from "./Views/DepartmentAdminTemplates.jsx";
import DepartmentAdminAcademicSectionsReporting from "Views/DepartmentAdminAcademicSectionsReporting";
import FacultyAdminHomePage from "./Views/FacultyAdminHomePage.jsx";
import FacultyAdminUsers from "./Views/FacultyAdminUsers.jsx";
import { NotificationProvider } from "./Contexts/NotificationContext.jsx";
import FacultyHomePage from "./Pages/FacultyHomePage/FacultyHomePage";
import { AppProvider, useApp } from "./Contexts/AppContext";
import { AdminProvider } from "./Contexts/AdminContext.jsx";
import { ToastContainer } from "react-toastify";
import VPPNoMatchPage from "./Views/VPPNoMatchPage";
import KeycloakLogout from "Components/KeycloakLogout";
import YourActivityPage from "./Pages/AuditLogPages/YourActivityPage.jsx";
import GenerateCV from "Pages/GenerateCV/GenerateCV";
import DepartmentAdminDeclarations from "Views/DepartmentAdminDeclarations.jsx";
import DepartmentAdminAffiliations from "Views/DepartmentAdminAffiliations";
import CVSearch from "Views/CVSearch.jsx";

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
    isUserActive,
    isManagingUser,
    getUserInfo,
    isVPPUser,
    hasVPPProfile,
    isUserTerminated,
  } = useApp();

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
        {loading ? (
          // Show loading spinner while authentication state is being determined
          <div className="flex items-center justify-center min-h-screen w-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <div className="text-lg text-zinc-600">Loading...</div>
            </div>
          </div>
        ) : !isUserLoggedIn ? (
          <Routes>
            <Route path="/keycloak-logout" element={<KeycloakLogout />} />
            <Route path="/auth" element={<AuthPage getCognitoUser={getCognitoUser} />} />
            <Route path="/*" element={<Navigate to="/auth" />} />
          </Routes>
        ) : isVPPUser && !hasVPPProfile ? (
          <Routes>
            <Route path="/keycloak-logout" element={<KeycloakLogout />} />
            <Route path="/vpp-no-match" element={<VPPNoMatchPage />} />
            <Route path="/*" element={<Navigate to="/vpp-no-match" />} />
          </Routes>
        ) : isUserPending || !isUserApproved || !isUserActive ? (
          <Routes>
            <Route path="/keycloak-logout" element={<KeycloakLogout />} />
            <Route path="/auth" element={<AuthPage getCognitoUser={getCognitoUser} />} />
            <Route path="/*" element={<Navigate to="/auth" />} />
          </Routes>
        ) : isUserTerminated ? (
          <Routes>
            <Route path="/keycloak-logout" element={<KeycloakLogout />} />
            <Route path="/auth" element={<AuthPage getCognitoUser={getCognitoUser} />} />
            <Route path="/*" element={<Navigate to="/auth" />} />
          </Routes>
        ) : (
          // User is logged in, approved and active - allow access to all routes
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
                  <Navigate to="/department-admin/dashboard" />
                ) : Object.keys(assistantUserInfo).length !== 0 && assistantUserInfo.role === "Assistant" ? (
                  <Navigate to="/delegate/home" />
                ) : Object.keys(userInfo).length !== 0 && userInfo.role === "Faculty" ? (
                  <Navigate to="/faculty/home" />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/delegate/home"
              element={
                (assistantUserInfo.role === "Assistant" && currentViewRole === "Assistant") ||
                (userInfo.role === "Admin" && currentViewRole === "Assistant") ? (
                  <DelegateHomePage
                    assistantUserInfo={assistantUserInfo}
                    userInfo={
                      userInfo.role === "Admin" && currentViewRole === "Assistant" ? userInfo : assistantUserInfo
                    }
                    setUserInfo={
                      userInfo.role === "Admin" && currentViewRole === "Assistant" ? setUserInfo : setAssistantUserInfo
                    }
                    getUser={getUserInfo}
                    getCognitoUser={getCognitoUser}
                  />
                ) : (
                  <Navigate to="/home" />
                )
              }
            />

            <Route
              path="/delegate/connections"
              element={
                <DelegateConnections
                  userInfo={assistantUserInfo}
                  setUserInfo={setAssistantUserInfo}
                  getCognitoUser={getCognitoUser}
                />
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
                  <GenerateCV getCognitoUser={getCognitoUser} />
                ) : (
                  <Navigate to="/home" />
                )
              }
            />

            <Route path="/admin/home" element={<AdminHomePage userInfo={userInfo} getCognitoUser={getCognitoUser} />} />

            <Route
              path="/department-admin/dashboard"
              element={
                typeof userInfo.role === "string" &&
                (userInfo.role.startsWith("Admin-") || userInfo.role === "Admin") &&
                typeof currentViewRole === "string" &&
                currentViewRole.startsWith("Admin-") ? (
                  <DepartmentAdminDashboard
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

            <Route
              path="/loggings"
              element={
                userInfo.role && userInfo.role !== "Assistant" ? (
                  <YourActivityPage
                    userInfo={userInfo}
                    getCognitoUser={getCognitoUser}
                    currentViewRole={currentViewRole}
                  />
                ) : (
                  <Navigate to="/home" />
                )
              }
            />

            <Route
              path="/audit"
              element={
                (userInfo.role && userInfo.role.startsWith("FacultyAdmin-")) ||
                (userInfo.role && userInfo.role === "Admin") ? (
                  <AuditPage userInfo={userInfo} getCognitoUser={getCognitoUser} currentViewRole={currentViewRole} />
                ) : (
                  <Navigate to="/home" />
                )
              }
            />

            {/* Other routes - no restrictions for approved users */}
            <Route path="/faculty/home/affiliations" element={<FacultyHomePage tab="affiliations" />} />
            <Route path="/faculty/home/employment" element={<FacultyHomePage tab="employment" />} />
            <Route path="/faculty/home/employment/:sectionTitle" element={<FacultyHomePage tab="employment" />} />
            <Route path="/faculty/home/education" element={<FacultyHomePage tab="education" />} />
            <Route path="/faculty/home/education/:sectionTitle" element={<FacultyHomePage tab="education" />} />
            <Route
              path="/support"
              element={
                <SupportForm
                  userInfo={userInfo}
                  getCognitoUser={getCognitoUser}
                  toggleViewMode={toggleViewMode}
                  currentViewRole={currentViewRole}
                />
              }
            />
            <Route
              path="/delegate/support"
              element={
                <SupportForm
                  userInfo={Object.keys(userInfo).length !== 0 ? userInfo : assistantUserInfo}
                  getCognitoUser={getCognitoUser}
                  toggleViewMode={toggleViewMode}
                />
              }
            />
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
              path="/faculty/delegates"
              element={<FacultyDelegates userInfo={userInfo} getCognitoUser={getCognitoUser} />}
            />
            <Route path="/faculty/archive" element={<Archive userInfo={userInfo} getCognitoUser={getCognitoUser} />} />
            <Route path="/faculty/cv-search" element={<CVSearch userInfo={userInfo} getCognitoUser={getCognitoUser} />} />
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
              path="/assistant/archive"
              element={
                <Assistant_Archive
                  assistantUserInfo={assistantUserInfo}
                  userInfo={userInfo}
                  getCognitoUser={getCognitoUser}
                />
              }
            />

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
              path="/department-admin/members"
              element={
                <DepartmentAdminMembers
                  userInfo={{ ...userInfo, role: currentViewRole }}
                  getCognitoUser={getCognitoUser}
                  department={currentViewRole && currentViewRole.split ? currentViewRole.split("-")[1] || "" : ""}
                  currentViewRole={currentViewRole}
                />
              }
            />
            <Route
              path="/department-admin/members/:userId"
              element={
                <DepartmentAdminMembers
                  userInfo={{ ...userInfo, role: currentViewRole }}
                  getCognitoUser={getCognitoUser}
                  department={currentViewRole && currentViewRole.split ? currentViewRole.split("-")[1] || "" : ""}
                  currentViewRole={currentViewRole}
                />
              }
            />
            <Route
              path="/department-admin/members/:userId/actions"
              element={
                <DepartmentAdminMembers
                  userInfo={{ ...userInfo, role: currentViewRole }}
                  getCognitoUser={getCognitoUser}
                  department={currentViewRole && currentViewRole.split ? currentViewRole.split("-")[1] || "" : ""}
                  currentViewRole={currentViewRole}
                />
              }
            />
            <Route
              path="/department-admin/analytics"
              element={
                <DepartmentAdminDashboard
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
            <Route path="/department-admin/generate" element={<GenerateCV getCognitoUser={getCognitoUser} />} />
            <Route
              path="/department-admin/reporting"
              element={
                <DepartmentAdminAcademicSectionsReporting
                  userInfo={userInfo}
                  getCognitoUser={getCognitoUser}
                  department={userInfo && userInfo.role ? userInfo.role.split("-")[1] : ""}
                />
              }
            />

            <Route
              path="/department-admin/declarations"
              element={
                <DepartmentAdminDeclarations
                  userInfo={userInfo}
                  getCognitoUser={getCognitoUser}
                  department={userInfo && userInfo.role ? userInfo.role.split("-")[1] : ""}
                />
              }
            />

            <Route
              path="/department-admin/affiliations"
              element={
                <DepartmentAdminAffiliations
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
                  <GenerateCV getCognitoUser={getCognitoUser} toggleViewMode={toggleViewMode} />
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
  // Use AppProvider and NotificationProvider as usual
  // Wrap AppContent with AdminContextProvider only for admin roles
  // We need to get the userInfo from AppContext, so use a wrapper
  const AdminWrapper = () => {
    const { userInfo } = useApp();
    const isAdmin =
      userInfo &&
      typeof userInfo.role === "string" &&
      (userInfo.role === "Admin" || userInfo.role.startsWith("Admin-") || userInfo.role.startsWith("FacultyAdmin-"));
    const role = userInfo.role;
    if (isAdmin) {
      return (
        <AdminProvider isAdmin={isAdmin} role={role}>
          <AppContent />
        </AdminProvider>
      );
    }
    return <AppContent />;
  };
  return (
    <AppProvider>
      <NotificationProvider>
        <AdminWrapper />
      </NotificationProvider>
    </AppProvider>
  );
};

export default App;
