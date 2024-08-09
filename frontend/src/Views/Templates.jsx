import React from 'react'
import { useState } from 'react';
import PageContainer from './PageContainer.jsx';
import AdminMenu from '../Components/AdminMenu.jsx';

const Templates = ({ getCognitoUser, userInfo }) => {
  const [loading, setLoading] = useState(false);

  return (
    <PageContainer>
      <AdminMenu getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} />
      <main className='ml-4 pr-5 overflow-auto custom-scrollbar w-full mb-4'>
        <h1 className="text-left m-4 text-4xl font-bold text-zinc-600">Templates</h1>
        {loading ? (
          <div className='flex items-center justify-center w-full'>
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <div className='m-4 max-w-lg flex'>Hello World!</div>
        )}
      </main>
    </PageContainer>
  )
}

export default Templates