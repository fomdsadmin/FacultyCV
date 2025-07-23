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
import { addUser } from 'graphql/graphqlHelpers.js';
import { useState } from 'react';

const AuthPage = ({ getCognitoUser }) => {

  const { setUser } = useApp();
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [userExistsInSqlDatabase, setUserExistsInSqlDatabase] = useState(false);
  const [isUserPending, setIsUserPending] = useState(false);
  const [isUserApproved, setIsUserApproved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    role: "faculty"
  });

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
    const initializeAuth = async () => {
      setLoading(true);
      try {
        // Step 1: Check authentication session
        const session = await fetchAuthSession();
        console.log(session);
        const token = session.tokens?.idToken?.toString();

        if (!token) {
          // User is not logged in
          setIsUserLoggedIn(false);
          setUserExistsInSqlDatabase(false);
          setIsUserPending(false);
          setIsUserApproved(false);
          return;
        }

        // Step 2: Set up form with user attributes
        await setUpForm();
        setIsUserLoggedIn(true);

        // Step 3: Get user attributes to check email
        const { email } = await fetchUserAttributes();
        
        if (!email) {
          setUserExistsInSqlDatabase(false);
          setIsUserPending(false);
          setIsUserApproved(false);
          return;
        }

        // Step 4: Check if user exists in SQL database
        try {
          const userData = await getUser(email);
          setUserExistsInSqlDatabase(true);
          setIsUserPending(userData.pending);
          setIsUserApproved(userData.approved);
        } catch (error) {
          console.error("Error fetching user data:", error);
          // User does not exist in SQL database
          setUserExistsInSqlDatabase(false);
          setIsUserPending(false);
          setIsUserApproved(false);
        }

      } catch (error) {
        console.error("Error checking auth session:", error);
        setIsUserLoggedIn(false);
        setUserExistsInSqlDatabase(false);
        setIsUserPending(false);
        setIsUserApproved(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [])

  const submitRequest = async () => {
    setLoading(true);
    try {
      await addUser(
        formData.first_name,
        formData.last_name,
        formData.email,
        formData.role,
        "",
        ""
      );
      setUserExistsInSqlDatabase(true);
      setIsUserPending(true);
      setIsUserApproved(false);
    } catch (error) {
      console.error("Error submitting request:", error);
    } finally {
      setLoading(false);
    }
  }

  const setUpForm = async () => {
    console.log(await fetchUserAttributes());
    const { given_name, family_name, email } = await fetchUserAttributes();
    setFormData({
      email: email,
      first_name: given_name,
      last_name: family_name,
      role: "faculty"
    })
  }

  const signIn = async () => {
    await signInWithRedirect({
      provider: {
        custom: 'facultycv-prod'
      }
    });
    await setUpForm();
    setIsUserLoggedIn(true);
  };

  return (
    <PageContainer>
      <div className="flex w-full rounded-lg mx-auto shadow-lg overflow-hidden bg-gray-100">
        <div className="w-3/5 flex flex-col items-center justify-center overflow-auto custom-scrollbar">
          {loading && (
            <div className="text-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          )}

          {!loading && !isUserLoggedIn && (
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 focus:outline-none mt-4"
              onClick={() => signIn()}
            >
              Login with CWL
            </button>
          )}

          {!loading && isUserLoggedIn && !userExistsInSqlDatabase && (
            <form className="w-full max-w-md">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  type="text"
                  id="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="first_name">
                  First Name
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="last_name">
                  Last Name
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
                  Role
                </label>
                <div className="flex items-center">
                  <label className="mr-4">
                    <input
                      type="radio"
                      name="role"
                      value="faculty"
                      checked={formData.role === "faculty"}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    />
                    Faculty
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="role"
                      value="assistant"
                      checked={formData.role === "assistant"}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    />
                    Assistant
                  </label>
                </div>
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 focus:outline-none mt-4 disabled:opacity-50"
                onClick={submitRequest}
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          )}

          {!loading && isUserLoggedIn && userExistsInSqlDatabase && isUserPending && (
            <div className="text-center p-4 m-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
              <h2 className="text-lg font-bold">Your request has been received!</h2>
              <p className="mt-2">It will be processed in a few days. Thank you for your patience.</p>
            </div>
          )}

          {!loading && isUserLoggedIn && userExistsInSqlDatabase && !isUserPending && isUserApproved && (
            <div className="text-center p-4 m-4 bg-green-100 border border-green-400 text-green-700 rounded">
              <h2 className="text-lg font-bold">Your account has been approved!</h2>
              <p className="mt-2">You can now access all features. Welcome aboard!</p>
            </div>
          )}

          {!loading && isUserLoggedIn && userExistsInSqlDatabase && !isUserPending && !isUserApproved && (
            <div className="text-center p-4 m-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <h2 className="text-lg font-bold">Account not approved</h2>
              <p className="mt-2">Your account has not been approved. Please contact the administrator for assistance.</p>
            </div>
          )}
        </div>
        <div className="w-2/5" style={{ backgroundImage: "url(/UBC.jpg)", backgroundRepeat: "no-repeat", backgroundSize: "cover" }}></div>
      </div>
    </PageContainer>
  );
};

export default AuthPage;