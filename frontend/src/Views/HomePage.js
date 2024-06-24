import React from 'react';
import { generateClient } from 'aws-amplify/api';
import { getFacultyMember } from '../graphql/queries';
import { signOut } from 'aws-amplify/auth';
import { Container } from '@column-resizer/react';
import PageContainer from './PageContainer';
import FacultyMenu from '../Components/FacultyMenu';


const HomePage = ({ user }) => {

  const handleSignOut = () => {
    try {
      signOut();
      console.log('Logged out');
      window.location.reload();
    }
    catch (error) {
      console.log('Error logging out:', error);
    }
  }
  return (
    <PageContainer>
      <FacultyMenu userName={user.signInDetails.loginId} onSignOut={handleSignOut}></FacultyMenu>
      <main>
        <h1>Hello {user.signInDetails.loginId}</h1>
        <button className="btn btn-info" onClick={async () => {
          // Example query to graphql
          const client = generateClient();
          console.log(await client.graphql({
            query: getFacultyMember({
              firstName: '',
              lastName: ''
            })
          }));
        }}>Query</button>
      </main>
    </PageContainer>
  );
};

export default HomePage;
