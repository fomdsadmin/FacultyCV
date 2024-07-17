import React from 'react';

const PageContainer = ({ children }) => {
  return (
    <div className="mx-auto flex min-h-screen max-h-screen h-screen box-border">
      {children}
    </div>
  );
};

export default PageContainer;
