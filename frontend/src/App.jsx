import React from "react";
import { useAuth } from "react-oidc-context";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Header from "./Components/Headers.jsx";
import Footer from "./Components/Footer.jsx";
import Dashboard from "./Views/dashboard.jsx";
import NotFound from "./Views/NotFound.jsx";
import { AppProvider } from "./Contexts/AppContext";
import MapUserData from "./Views/MapUserData";
import FederatedAuthRedirect from "./Views/FederatedAuthRedirect";
import { ToastContainer } from "react-toastify";

const AppContent = () => {
  const auth = useAuth();

  if (auth.isLoading) return <div>Loading...</div>;
  if (auth.error) return <div>Error: {auth.error.message}</div>;

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={1000} theme="light" />
      {auth.isAuthenticated && <Header />}
      <MapUserData />
      <Routes>
        {/* Auto redirect Federated login */}
        <Route path="/auth" element={<FederatedAuthRedirect />} />

        {/* Protected dashboard route */}
        <Route
          path="/faculty/dashboard"
          element={auth.isAuthenticated ? <Dashboard /> : <Navigate to="/auth" />}
        />

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/faculty/dashboard" />} />

        {/* Catch all */}
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
