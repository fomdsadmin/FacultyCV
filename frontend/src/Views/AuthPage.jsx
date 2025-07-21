import React from 'react';
import PageContainer from './PageContainer.jsx';
import '../CustomStyles/scrollbar.css';
import { useEffect } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { fetchAuthSession } from 'aws-amplify/auth';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { signInWithRedirect } from 'aws-amplify/auth';
import { useApp } from 'Contexts/AppContext.jsx';
import { getUser } from 'graphql/graphqlHelpers.js';
import { updateUser } from 'graphql/graphqlHelpers.js';

const AuthPage = ({ getCognitoUser }) => {

  const { setUser } = useApp();

  //useEffect(() => {
  //getUser(emaio)
  // note: user is automatically added to cognito when logging in from cwl
  // if user does not exist in cognito and userprofile table and pending status is false then update group membership in cognito to faculty
  // if user exists in cognito and exists in the userprofile table and pending status is false then dont do anything.
  // if user exists in cognito and does not exist in user profile table then redirect them to the signup form, it should be prefiled in with all attributes from jwt, they can select roles [faculty, assistant], then just let them know the request was submitted
  // if user exists in cognito and and pending status is true then tell them to wait on the ui

  //catch {
  //redirect to form
  // }
  // })

  useEffect(() => {
    const helper = async () => {
      const user = await getCurrentUser();
      console.log("User is already logged in:", user);
      const attributes = await fetchUserAttributes();
      console.log("User attributes:", attributes);
      console.log(await getUser(attributes.email));
    }
    helper();
  }, [])


  const checkAndSignIn = async () => {
    try {
      const user = await getCurrentUser();
      console.log("User is already logged in:", user);
      const session = await fetchAuthSession();
      console.log(session);
      const idToken = session.tokens?.idToken?.toString();
      console.log("ID Token (JWT):", idToken);
      const attributes = await fetchUserAttributes();
      console.log("User attributes:", attributes);
      setUser(user);
      //console.log(await getUser());
      // Optionally redirect or do something else here

    } catch (error) {
      console.log(error);
      // Not logged in, so start sign-in
      await signInWithRedirect({
        provider: {
          custom: 'staging-facultycv'
        }
      });

      console.log(error);

      const user = await getCurrentUser();
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      console.log("ID Token (JWT):", idToken);
      setUser(user);
    }
  };

  return (
    <PageContainer>
      <div className="flex w-full rounded-lg mx-auto shadow-lg overflow-hidden bg-gray-100">
        <div className="w-3/5 flex flex-col items-center justify-center overflow-auto custom-scrollbar">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 focus:outline-none mt-4"
            onClick={() => checkAndSignIn()}
          >
            Login with CWL
          </button>
        </div>
        <div className="w-2/5" style={{ backgroundImage: "url(/UBC.jpg)", backgroundRepeat: "no-repeat", backgroundSize: "cover" }}></div>
      </div>
    </PageContainer>
  );
};

export default AuthPage;