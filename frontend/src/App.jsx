import React, { useEffect, useState } from "react";
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
import { Cache } from "aws-amplify/utils";
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';


const AppContent = () => {
  const { amplifyConfigured, setAmplifyConfigured } = useApp();
  const [readyToRender, setReadyToRender] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const helper = async () => {
      try {
        const user = await getCurrentUser();
        setUser(user);
        setIsLoading(false);
        setReadyToRender(true);
      } catch {
        setIsLoading(false);
      }
    }
    helper();
  }, [])



  if (isLoading) return <div>Loading authentication...</div>;

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={1000} theme="light" />
      {user && <Header />}
      {/* Only render MapUserData after Amplify is fully configured */}
      {user && readyToRender && <MapUserData />}
      <Routes>
        <Route path="/auth" element={<FederatedAuthRedirect />} />
        <Route
          path="/faculty/dashboard"
          element={user && !isLoading ? <Dashboard /> : <Navigate to="/auth" />}
        />
        <Route path="/" element={<Navigate to="/faculty/dashboard" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {user && <Footer />}
    </Router>
  );
};

const App = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default App;
