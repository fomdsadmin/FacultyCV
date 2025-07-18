import React from 'react';
import PageContainer from './PageContainer.jsx';
import '../CustomStyles/scrollbar.css';

const AuthPage = ({ getCognitoUser }) => {


  return (
    <PageContainer>
      <div className="flex w-full rounded-lg mx-auto shadow-lg overflow-hidden bg-gray-100">
        <div className="w-3/5 flex flex-col items-center justify-center overflow-auto custom-scrollbar">


        </div>
        <div className="w-2/5" style={{ backgroundImage: "url(/UBC.jpg)", backgroundRepeat: "no-repeat", backgroundSize: "cover" }}></div>
      </div>
   </PageContainer>
  );
};

export default AuthPage;