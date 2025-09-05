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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
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
                    You've logged in using your Health Authority (VPP) credentials, but we couldn't find a matching
                    profile in our Faculty CV system.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Do you already have an account?</h3>
              <p className="text-sm text-blue-700 mb-3">If you already have a Faculty CV account, please:</p>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Log in using your CWL (Campus Wide Login) credentials</li>
                <li>Go to your profile settings page</li>
                <li>Connect your Health Authority (VPP) login to your existing account</li>
              </ol>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-gray-800 mb-2">New to Faculty CV?</h3>
              <p className="text-sm text-gray-700">
                If you don't have an account yet, you'll need to create one using your CWL credentials first. Health
                Authority-only accounts are not supported for initial registration.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <button
              onClick={handleCWLLogin}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
            >
              Sign Out & Login with CWL
            </button>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                This will sign you out of your current Health Authority session and redirect you to login with CWL
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Need help?</span>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Contact IT support if you need assistance connecting your Health Authority login
              </p>
              {/* <a href="/support" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                Get Support
              </a> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VPPNoMatchPage;
