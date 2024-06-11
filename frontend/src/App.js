import logo from './logo.svg';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { Authenticator } from '@aws-amplify/ui-react';
import './App.css';
import '@aws-amplify/ui-react/styles.css';
import { getFacultyMembers } from './graphql/queries';


Amplify.configure({
  API: {
    GraphQL: {
      endpoint: process.env.REACT_APP_APPSYNC_ENDPOINT,
      region: process.env.REACT_APP_AWS_REGION,
      defaultAuthMode: 'iam',
    }
  },
  Auth: {
    Cognito: {
      region: process.env.REACT_APP_AWS_REGION,
      userPoolClientId: process.env.REACT_APP_COGNITO_USER_POOL_CLIENT_ID,
      userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
      allowGuestAccess: false
    }
  },
});
const client = generateClient();
console.log(await client.graphql({
  query: getFacultyMembers('', '')
}));
function App() {
  return (
    <Authenticator hideSignUp={true} loginMechanisms={['email']}>
      {({ signOut, user }) => (
        <main>
          <h1>Hello {user.signInDetails.loginId}</h1>
          <button onClick={signOut}>Sign out</button>
        </main>
      )}
    </Authenticator>
  );
}

export default App;
