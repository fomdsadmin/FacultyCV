import React from 'react';
import { generateClient } from 'aws-amplify/api';
import { getUserQuery } from './graphql/queries';
import { signOut } from 'aws-amplify/auth';
import { getAllSections } from './graphql/queryHelpers';

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
    <div>
      <main>
        <h1>Hello {user.signInDetails.loginId}</h1>
        <button onClick={async () => {
          // Example query to graphql
          const client = generateClient();
          console.log(await client.graphql({
            query: getUserQuery({
              firstName: '',
              lastName: ''
            })
          }));
        }}>Query</button>
        <button onClick={async () => console.log(await getAllSections())}>Sections</button>
        <button onClick={handleSignOut}>Sign out</button>
      </main>
    </div>
  );
};

export default HomePage;
