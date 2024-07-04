import React from 'react';
import { Link } from 'react-router-dom';
import PageContainer from './PageContainer.jsx';

const NotFound = () => {
  return (
    <PageContainer>
      <div className="w-full p-4 flex flex-col items-center">
        <h1 className="mb-10">404 - Not Found!</h1>
        <Link className="text-blue-500 font-bold underline underline-offset-2 cursor-pointer" to="/home">Back to the homepage</Link>
      </div>
    </PageContainer>
  );
}

export default NotFound;