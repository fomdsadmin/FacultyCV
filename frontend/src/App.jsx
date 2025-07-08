import React, { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Header from "./Components/Headers.jsx";
import Footer from "./Components/Footer.jsx";
import Dashboard from "./Views/dashboard.jsx";
import NotFound from "./Views/NotFound.jsx";
import { AppProvider, useApp } from "./Contexts/AppContext";
import MapUserData from "./Views/MapUserData";
import FederatedAuthRedirect from "./Views/FederatedAuthRedirect";
import { ToastContainer } from "react-toastify";
import { Amplify } from "aws-amplify";


const AppContent = () => {
  const auth = useAuth();
  const { amplifyConfigured, setAmplifyConfigured } = useApp();
  const [readyToRender, setReadyToRender] = useState(false);

  useEffect(() => {
    const configureAmplify = async () => {
      if (
        auth.isAuthenticated &&
        auth.user &&
        auth.user.id_token &&
        !amplifyConfigured
      ) {
        try {
          console.log("OIDC Token:", auth.user.id_token);
      Amplify.configure({
        API: {
          GraphQL: {
            endpoint: 'https://b52u3hajhfejlapwe3exmv2vce.appsync-api.ca-central-1.amazonaws.com/graphql',
            region: 'ca-central-1',
            defaultAuthMode: 'oidc',
            headers: async () => ({
              'Authorization': auth.user.id_token,
            })
          }
        }
      });
          setAmplifyConfigured(true);
          setReadyToRender(true);
        } catch (err) {
          console.error("Amplify configuration failed:", err);
        }
      } else if (amplifyConfigured) {
        setReadyToRender(true);
      }
    };

    configureAmplify();
  }, [auth.isAuthenticated, auth.user, amplifyConfigured, setAmplifyConfigured]);

  if (auth.isLoading) return <div>Loading authentication...</div>;
  if (auth.error) return <div>Error: {auth.error.message}</div>;

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={1000} theme="light" />
      {auth.isAuthenticated && <Header />}
      {/* Only render MapUserData after Amplify is fully configured */}
      {auth.isAuthenticated && readyToRender && <MapUserData />}
      <Routes>
        <Route path="/auth" element={<FederatedAuthRedirect />} />
        <Route
          path="/faculty/dashboard"
          element={auth.isAuthenticated ? <Dashboard /> : <Navigate to="/auth" />}
        />
        <Route path="/" element={<Navigate to="/faculty/dashboard" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {auth.isAuthenticated && <Footer />}
    </Router>
  );
};

const App = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default App;
