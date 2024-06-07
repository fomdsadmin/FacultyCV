import logo from './logo.svg';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import './App.css';
import '@aws-amplify/ui-react/styles.css';


Amplify.configure({
  Auth: {
    Cognito: {
      region: process.env.REACT_APP_AWS_REGION,
      userPoolClientId: process.env.REACT_APP_COGNITO_USER_POOL_CLIENT_ID,
      userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
      allowGuestAccess: false
    }
  }
});

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
