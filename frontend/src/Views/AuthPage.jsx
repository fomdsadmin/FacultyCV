import React from "react";
import { useAuth } from "react-oidc-context";

const AuthPage = () => {
  const auth = useAuth();

  return (
    <div className="flex flex-col items-center justify-center mt-20">
      <p>Please sign in to continue.</p>
      <button
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        onClick={() => auth.signinRedirect()}
      >
        Sign In
      </button>
    </div>
  );
};

export default AuthPage;
