import logo from './logo.svg';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { Authenticator } from '@aws-amplify/ui-react';
import './App.css';
import '@aws-amplify/ui-react/styles.css';
import { getFacultyMember } from './graphql/queries';
import React from 'react';
import { Container, Section, Bar } from '@column-resizer/react';

Amplify.configure({
  API: {
    GraphQL: {
      endpoint: process.env.REACT_APP_APPSYNC_ENDPOINT,
      region: process.env.REACT_APP_AWS_REGION,
      defaultAuthMode: 'userPool',
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

function App() {
  return (
    <Container className="flex h-screen bg-base-100">
      <Section style={{ minWidth: '200px', flex: 1 }}>
        <div className="prose lg:prose-xl p-4">
          <h1>Your Article Title</h1>
          <p>This is a paragraph.</p>
          <h2>Subheading</h2>
          <p>Another paragraph with more text content.</p>
          <blockquote>This is a blockquote, styled by Tailwind CSS Typography.</blockquote>
        </div>
      </Section>
      <Bar size={3} className="bg-neutral cursor-col-resize" />
      <Section style={{ minWidth: '200px', flex: 1 }}>
        <div className="p-4">
          <button className="btn btn-secondary">Secondary</button>
          <button className="btn btn-primary">Primary</button>
          <button className="btn btn-accent">Accent</button>
          <button className="btn btn-neutral">Neutral</button>
          <button className="btn btn-base-100">Base-100</button>
          <button className="btn btn-info">Info</button>
          <button className="btn btn-success">Success</button>
          <button className="btn btn-warning">Warning</button>
          <button className="btn btn-error">Error</button>
        </div>
      </Section>
    </Container>
    // <Authenticator hideSignUp={true} loginMechanisms={['email']}>
    //   {({ signOut, user }) => (
    //     <main>
    //       <h1>Hello {user.signInDetails.loginId}</h1>
    //       <button onClick={async () => {
    //         // Example query to graphql
    //         const client = generateClient();
    //         console.log(await client.graphql({
    //           query: getFacultyMember({
    //             firstName: '',
    //             lastName: ''
    //           })
    //         }));
    //       }}>Query</button>
    //       <button onClick={signOut}>Sign out</button>
    //     </main>
    //   )}
    // </Authenticator>
  );
}

export default App;
