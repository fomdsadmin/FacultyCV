import React from "react";
import { signOut } from "aws-amplify/auth";

const VPPNoMatchPage = () => {
  const handleCWLLogin = async () => {
    try {
      await signOut();
      const clientId = process.env.REACT_APP_COGNITO_USER_POOL_CLIENT_ID;
      const logoutUri = `${process.env.REACT_APP_AMPLIFY_DOMAIN}/keycloak-logout`; // Make sure this URL is registered in your Cognito App Client's "Sign out URLs"
      const cognitoDomain = "https://" + process.env.REACT_APP_COGNITO_DOMAIN;

      window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(
        logoutUri
      )}`;
    } catch (error) {
      console.error("Error signing out:", error);
      // Fallback on error
      window.location.href = "/auth";
    } 
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Health Authority Profile Not Found</h2>

          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Health Authority Login Detected</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You've logged in using your Health Authority credentials, but we couldn't find a matching
                    profile in our system. Please contact the department administrator for access.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 space-y-4">
            <button
              onClick={handleCWLLogin}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
            >
              Sign Out & Login with CWL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VPPNoMatchPage;
