import React from 'react';
import PageContainer from './PageContainer.jsx';
import '../CustomStyles/scrollbar.css';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { signInWithRedirect } from 'aws-amplify/auth';
import { useApp } from 'Contexts/AppContext.jsx';
import { addUser } from 'graphql/graphqlHelpers.js';
import { useState } from 'react';
import { useEffect } from 'react';

const AuthPage = () => {

  const {
    setIsUserLoggedIn,
    isUserLoggedIn,
    loading,
    setLoading,
    userExistsInSqlDatabase,
    setUserExistsInSqlDatabase,
    isUserPending,
    setIsUserPending,
    isUserApproved,
    setIsUserApproved
  } = useApp();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    role: "Faculty"
  });

  useEffect(() => {
    const helper = async () => {
      if (isUserLoggedIn && !userExistsInSqlDatabase) {
        await setUpForm();
      }
    }
    helper();
  }, [isUserLoggedIn, userExistsInSqlDatabase])

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
      role: "Faculty"
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
                      value="Faculty"
                      checked={formData.role === "Faculty"}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    />
                    Faculty
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="role"
                      value="Assistant"
                      checked={formData.role === "Assistant"}
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
              <button
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none"
                onClick={async () => {
                  window.location.href = "/home";
                }}
              >
                Continue to Dashboard
              </button>
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