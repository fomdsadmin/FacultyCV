import React from "react";
import PageContainer from "./PageContainer.jsx";
import "../CustomStyles/scrollbar.css";
import { fetchUserAttributes, fetchAuthSession } from "aws-amplify/auth";
import { signInWithRedirect } from "aws-amplify/auth";
import { useApp } from "Contexts/AppContext.jsx";
import { addUser } from "graphql/graphqlHelpers.js";
import { useState, useEffect } from "react";
import { signOut } from "aws-amplify/auth";
import MyAccount from "../Components/MyAccount/MyAccount.jsx";

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
    setIsUserApproved,
    isUserActive,
    setIsUserActive,
  doesUserNeedToReLogin, // Use this here
  } = useApp();

  const handleSignOut = async () => {
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

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    role: "Faculty",
    primary_department: "",
    primary_faculty: "",
  });

  const [formError, setFormError] = useState(""); // Add error state
  const [manualVPPUsername, setManualVPPUsername] = useState("");

  useEffect(() => {
    const helper = async () => {
      if (isUserLoggedIn && !userExistsInSqlDatabase) {
        await setUpForm();
      }
    };
    helper();
  }, [isUserLoggedIn, userExistsInSqlDatabase]);

  const submitRequest = async () => {
    // Trim and validate
    const missingFields = [];
    if (!formData.primary_faculty.trim()) missingFields.push("Primary Faculty");
    if (!formData.primary_department.trim()) missingFields.push("Primary Department");

    if (missingFields.length > 0) {
      setFormError(`Please select an option for the field(s): ${missingFields.join(", ")}`);
      return;
    }
    setFormError(""); // Clear error if present
    setLoading(true);
    try {
      console.log(formData)
      await addUser(
        formData.first_name,
        formData.last_name,
        formData.email,
        formData.role,
        true, // pending
        false, // approved
        formData.cwl_username,
        manualVPPUsername && manualVPPUsername.trim() !== "" ? manualVPPUsername.trim() : "",
        formData.primary_department,
        formData.primary_faculty
      );
      setUserExistsInSqlDatabase(true);
      setIsUserPending(true);
      setIsUserApproved(false);
    } catch (error) {
      console.error("Error submitting request:", error);
    } finally {
      setLoading(false);
    }
  };

  const setUpForm = async () => {
    // console.log(await fetchUserAttributes());
    const { given_name, family_name, email, name } = await fetchUserAttributes();
    setFormData({
      first_name: given_name,
      last_name: family_name,
      cwl_username: name,
      email: email,
      role: "Faculty",
      primary_department: "",
      primary_faculty: "",
    });
  };

  useEffect(() => {
    const helper = async () => {
      if (!loading && !isUserLoggedIn) {
        signIn();
      }
    };
    helper();
  }, [loading, isUserLoggedIn]);

  useEffect(() => {
    if (!loading && isUserLoggedIn && isUserApproved && !isUserPending && isUserActive && !doesUserNeedToReLogin) {
      window.location.href = "/home";
    }
  }, [isUserApproved, isUserLoggedIn, isUserPending, isUserActive, loading, doesUserNeedToReLogin]);

  const signIn = async () => {
    // console.log("Filter: User redirected to keycloak page");
    await signInWithRedirect({
      provider: {
        custom: process.env.REACT_APP_COGNITO_CLIENT_NAME,
      },
    });
    // console.log("Filter: User redirected back from keycloak page");
    await setUpForm();
    setIsUserLoggedIn(true);
  };

  return (
    <PageContainer>
      <div className="flex w-full rounded-lg mx-auto shadow-lg overflow-hidden bg-gray-100">
        <div className="w-3/5 flex flex-col items-center justify-center overflow-auto custom-scrollbar px-8 mb-12">
          {loading && (
            <div className="text-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          )}

          {!loading && isUserLoggedIn && !userExistsInSqlDatabase && (
            <div className="w-full max-w-3xl mx-auto bg-gray-50 p-8 rounded-xl shadow-md mb-24">
              <MyAccount
                formData={formData}
                setFormData={setFormData}
                onSubmit={submitRequest}
                loading={loading}
                formError={formError}
                manualVPPUsername={manualVPPUsername}
                setManualVPPUsername={setManualVPPUsername}
              />
            </div>
          )}


          {!loading && isUserLoggedIn && userExistsInSqlDatabase && isUserPending && !doesUserNeedToReLogin && (
            <div className="flex flex-col justify-center text-center p-4 m-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
              <h2 className="text-lg font-bold">Your request has been received!</h2>
              <p className="mt-2">It will be processed in a few days. Thank you for your patience. <br />
                Please contact the administrator at xyz@ubc.ca for other inquiries.</p>
            </div>
          )}
          {!loading &&
            isUserLoggedIn &&
            userExistsInSqlDatabase &&
            !isUserPending &&
            !isUserApproved &&
            !doesUserNeedToReLogin && (
              <div className="text-center p-4 m-4 bg-red-100 border border-red-400 text-red-700 rounded">
                <h2 className="text-lg font-bold">Account not approved</h2>
                <p className="mt-2">
                  Your account has not been approved and has been rejected access. <br /> Please contact the administrator at xyz@ubc.ca for further assistance.
                </p>
              </div>
            )}
          {!loading &&
            isUserLoggedIn &&
            userExistsInSqlDatabase &&
            isUserApproved &&
            !isUserPending &&
            !isUserActive &&
            !doesUserNeedToReLogin && (
              <div className="flex flex-col items-center justify-center align-center p-4 m-4 text-center bg-orange-100 border border-orange-400 text-orange-700 rounded">
                <h2 className="text-lg font-bold">Account Inactive</h2>
                <p className="mt-2">
                  Your account is currently inactive. Please contact the administrator at xyz@ubc.ca for access.
                </p>
              </div>
            )}
          {!loading &&
            isUserLoggedIn &&
            userExistsInSqlDatabase &&
            isUserPending &&
            !isUserApproved &&
            doesUserNeedToReLogin && (
              <div className="w-3/5 flex flex-col items-center justify-center overflow-auto custom-scrollbar">
                <div className="flex flex-col justify-center text-center p-4 m-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
                  <h2 className="text-lg font-bold">Account Permissions Updated</h2>
                  <p className="mt-2">
                    Your account has been approved and your permissions have been updated.
                    <br />
                    Please sign out and sign in again to continue.
                  </p>
                  <button
                    onClick={handleSignOut}
                    className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none transition disabled:opacity-50"
                  >
                    Sign Out &amp; Sign In Again
                  </button>
                </div>
              </div>
            )}
        </div>
        <div
          className="w-2/5"
          style={{ backgroundImage: "url(/UBC.jpg)", backgroundRepeat: "no-repeat", backgroundSize: "cover" }}
        ></div>
      </div>

    </PageContainer>
  );
};

export default AuthPage;
