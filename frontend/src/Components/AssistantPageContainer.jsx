import React from 'react';


const AssistantPageContainer = ({ children }) => {
  return (
    <div className="mx-auto flex box-border" style={{ minHeight: 'calc(100vh - 4rem)', maxHeight: 'calc(100vh - 4rem)', height: 'calc(100vh - 4rem)' }}>
      {children}
    </div>
  );
};

export default AssistantPageContainer;
