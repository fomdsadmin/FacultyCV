import React from 'react';
import PageContainer from './PageContainer.jsx';
import FacultyMenu from '../Components/FacultyMenu';

const Reports = ({ user }) => {
  return (
    <PageContainer>
      <FacultyMenu userName={user.first_name}></FacultyMenu>
      <main className='ml-4'>
        <h1 className="text-4xl font-bold my-3 text-zinc-600">Reports</h1>
      </main>
    </PageContainer>
  );
}

export default Reports;