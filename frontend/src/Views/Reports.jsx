import React, {useState, useEffect} from 'react';
import PageContainer from './PageContainer.jsx';
import FacultyMenu from '../Components/FacultyMenu';

const Reports = ({ userInfo, getCognitoUser }) => {
  const [user, setUser] = useState(userInfo);

  useEffect(() => {
    setUser(userInfo);
  }, [userInfo]);

  return (
    <PageContainer>
      <FacultyMenu userName={user.preferred_name || user.first_name} getCognitoUser={getCognitoUser}/>
      <main className='ml-4'>
        <h1 className="text-4xl font-bold my-3 text-zinc-600">Reports</h1>
      </main>
    </PageContainer>
  );
}

export default Reports;