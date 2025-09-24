import React from "react";
import { useApp } from "../Contexts/AppContext";

const PageContainer = ({ children }) => {
  const { isManagingUser, userInfo, currentViewRole } = useApp();
  return (
    <div className={`${currentViewRole && currentViewRole.startsWith('Admin') ? '' : 'px-12 lg:px-16 xl:px-20'} flex min-h-screen box-border ${isManagingUser ? 'mt-14' : ''}`}>
      {children}
    </div>
  );
};

export default PageContainer;
