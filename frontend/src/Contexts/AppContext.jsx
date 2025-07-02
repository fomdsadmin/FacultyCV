import React, { createContext, useContext, useState } from "react";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [assistantUserInfo, setAssistantUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentViewRole, setCurrentViewRole] = useState(null);

  return (
  <AppContext.Provider
    value={{
      userInfo,
      setUserInfo,
      assistantUserInfo,
      setAssistantUserInfo,
      loading,
      setLoading,
      currentViewRole,
      setCurrentViewRole,
    }}
  >
    {children}
  </AppContext.Provider>
);

};

export const useApp = () => useContext(AppContext);
