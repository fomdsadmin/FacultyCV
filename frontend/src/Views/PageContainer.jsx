import React from 'react';

const PageContainer = ({ children }) => {
  return (
    <div className="mx-auto flex min-h-screen box-border">
      {children}
    </div>
  );
};

export default PageContainer;
