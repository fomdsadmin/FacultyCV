import React from "react";
import { useApp } from "../Contexts/AppContext";

const PageContainer = ({ children }) => {
  const { isManagingUser } = useApp();
  return (
    <div className={`mx-auto flex min-h-screen box-border ${isManagingUser ? 'mt-14' : ''}`}>
      {children}
    </div>
  );
};

export default PageContainer;
