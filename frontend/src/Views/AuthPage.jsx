import React from "react";
import PageContainer from "./PageContainer.jsx";
import "../CustomStyles/scrollbar.css";
import { fetchUserAttributes, fetchAuthSession } from "aws-amplify/auth";
import { signInWithRedirect } from "aws-amplify/auth";
import { useApp } from "Contexts/AppContext.jsx";
import { addUser, getAllUniversityInfo, changeUsername, updateUser, getUser } from "graphql/graphqlHelpers.js";
import { useState, useEffect } from "react";
import { signOut } from "aws-amplify/auth";

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
    doesUserNeedToReLogin, // Use this here
    doesUserHaveAProfileInDatabase,
    setDoesUserHaveAProfileInDatabase,
    userProfileMatches,
    setUserProfileMatches,
  } = useApp();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    role: "Faculty",
    primary_department: "",
    primary_faculty: "",
  });

  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [formError, setFormError] = useState(""); // Add error state
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [claimFormData, setClaimFormData] = useState({
    first_name: "",
    last_name: "",
    cwl_username: "",
  });
  const [manualVPPUsername, setManualVPPUsername] = useState("");

  // Handle claiming a profile
  const handleClaimProfile = async (profile) => {
    // Open modal with profile data
    setSelectedProfile(profile);

    // Get current user attributes for the form
    try {
      const { given_name, family_name, name } = await fetchUserAttributes();
      // if name ends with @ubc.ca, set as cwl_username
      if (name && name.endsWith("@ubc.ca")) {
        setClaimFormData({
          first_name: given_name || "",
          last_name: family_name || "",
          cwl_username: name || "",
        });
      } else {
      }
    } catch (error) {
      console.error("Error fetching user attributes:", error);
    }

    setShowClaimModal(true);
  };

  // Handle confirming the profile claim
  const handleConfirmClaim = async () => {
    setLoading(true);
    try {
      const result = await changeUsername(selectedProfile.user_id, claimFormData.cwl_username);
      // console.log("Updated user profile username: ", result);

      const oldUserInfo = await getUser(claimFormData.cwl_username);
      function sanitizeInput(input) {
        if (!input) return "";
        return input
          .replace(/\\/g, "\\\\") // escape backslashes
          .replace(/"/g, '\\"') // escape double quotes
          .replace(/\n/g, "\\n"); // escape newlines
      }
      const other_result = await updateUser(
        oldUserInfo.user_id,
        claimFormData.first_name,
        claimFormData.last_name,
        oldUserInfo.preferred_name,
        oldUserInfo.email,
        oldUserInfo.role,
        sanitizeInput(oldUserInfo.bio),
        oldUserInfo.institution,
        oldUserInfo.primary_department,
        oldUserInfo.primary_faculty,
        oldUserInfo.campus,
        oldUserInfo.keywords,
        oldUserInfo.institution_user_id,
        oldUserInfo.scopus_id,
        oldUserInfo.orcid_id
      );

      // After username is set, function as normal approved user entering the website
      setUserExistsInSqlDatabase(true);
      setIsUserPending(false);
      setIsUserApproved(true);
      setDoesUserHaveAProfileInDatabase(false);
      setShowClaimModal(false);

      // Refresh the page after successful claim
    } catch (error) {
      console.error("Error claiming profile:", error);
      setFormError("Failed to claim profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle canceling the profile claim
  const handleCancelClaim = () => {
    setShowClaimModal(false);
    setSelectedProfile(null);
    setClaimFormData({
      first_name: "",
      last_name: "",
      cwl_username: "",
    });
  };

  useEffect(() => {
    const helper = async () => {
      if (isUserLoggedIn && !userExistsInSqlDatabase) {
        await setUpForm();
      }
    };
    helper();
  }, [isUserLoggedIn, userExistsInSqlDatabase]);

  // Fetch university info when userInfo changes
  useEffect(() => {
    sortUniversityInfo();
  }, []);

  // Sort university info
  const sortUniversityInfo = () => {
    getAllUniversityInfo().then((result) => {
      const depts = [];
      const facs = [];

      result.forEach((element) => {
        if (element.type === "Department") {
          depts.push(element.value);
        } else if (element.type === "Faculty") {
          facs.push(element.value);
        }
      });
      setDepartments(depts.sort());
      setFaculties(facs.sort());
      setLoading(false);
    });
  };

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
      await addUser(
        formData.first_name,
        formData.last_name,
        formData.email,
        formData.role,
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
    if (!loading && isUserLoggedIn && isUserApproved && !isUserPending && !doesUserNeedToReLogin) {
      window.location.href = "/home";
    }
  }, [isUserApproved, isUserLoggedIn, isUserPending, loading, doesUserNeedToReLogin]);

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
        <div className="w-3/5 flex flex-col items-center justify-start overflow-auto custom-scrollbar mt-16">
          {loading && (
            <div className="text-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          )}

          {!loading && isUserLoggedIn && !userExistsInSqlDatabase && !doesUserHaveAProfileInDatabase && (
            <div className="bg-stone-100 p-8 w-full h-full max-w-[70%] max-h-[80vh] border border-black overflow-y-auto rounded-2xl shadow-xl" >
              <form className="w-full max-w-2xl">
                <div className="text-3xl text-gray-500  font-bold my-4">SIGN UP</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="first_name">
                      <label className=" text-red-600 text-sm font-bold" htmlFor="first_name">
                        *{" "}
                      </label>
                      First Name
                    </label>
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      readOnly
                      disabled
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline cursor-not-allowed"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="last_name">
                      <label className=" text-red-600 text-sm font-bold" htmlFor="last_name">
                        *{" "}
                      </label>
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      readOnly
                      disabled
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline cursor-not-allowed"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cwl_username">
                      <label className=" text-red-600 text-sm font-bold" htmlFor="cwl_username">
                        *{" "}
                      </label>
                      CWL Username
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="cwl_username"
                      value={formData.cwl_username}
                      readOnly
                      disabled
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline cursor-not-allowed"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                      <label className=" text-red-600 text-sm font-bold" htmlFor="last_name">
                        *{" "}
                      </label>
                      Email
                    </label>
                    <input
                      type="text"
                      id="email"
                      name="email"
                      value={formData.email}
                      readOnly
                      disabled
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline cursor-not-allowed"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="vpp_username">
                      VPP Username
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="vpp_username"
                      value={manualVPPUsername}
                      onChange={(e) => setManualVPPUsername(e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="primary_faculty">
                    <label className=" text-red-600 text-sm font-bold" htmlFor="last_name">
                      *{" "}
                    </label>
                    Primary Faculty
                  </label>
                  <select
                    id="primary_faculty"
                    name="primary_faculty"
                    value={formData.primary_faculty}
                    onChange={(e) => setFormData({ ...formData, primary_faculty: e.target.value })}
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                      formError.toLowerCase().includes("faculty") ? "border-red-500" : ""
                    }`}
                  >
                    <option value="">Select Faculty</option>
                    {faculties.map((fac, idx) => (
                      <option key={idx} value={fac}>
                        {fac}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="primary_department">
                    <label className=" text-red-600 text-sm font-bold" htmlFor="last_name">
                      *{" "}
                    </label>
                    Primary Department
                  </label>
                  <select
                    id="primary_department"
                    name="primary_department"
                    value={formData.primary_department}
                    onChange={(e) => setFormData({ ...formData, primary_department: e.target.value })}
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                      formError.toLowerCase().includes("department") ? "border-red-500" : ""
                    }`}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept, idx) => (
                      <option key={idx} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
                    Role
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="">
                      <input
                        type="radio"
                        name="role"
                        value="Faculty"
                        checked={formData.role === "Faculty"}
                        className="m-2"
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      />
                      Faculty
                    </label>
                    <label className="">
                      <input
                        type="radio"
                        name="role"
                        value="Assistant"
                        checked={formData.role === "Assistant"}
                        className="m-2"
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      />
                      Delegate
                    </label>
                  </div>
                </div>
                {formError && <div className="mb-4 text-red-600 text-sm">{formError}</div>}

                <button
                  type="button"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 focus:outline-none mt-4 disabled:opacity-50"
                  onClick={submitRequest}
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit Request"}
                </button>
              </form>
            </div>
          )}

          {!loading && isUserLoggedIn && !userExistsInSqlDatabase && doesUserHaveAProfileInDatabase && (
            <div className="w-full max-w-2xl mt-12">
              {/* <div className="text-2xl text-gray-500 font-bold m-4 text-center">Profile Found</div> */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-blue-800">Similar Profiles Found</h3>
                </div>
                <p className="text-blue-700">
                  We found existing user profiles in our database that match your name. Please review the profiles below
                  and claim yours if you find it.
                </p>
              </div>

              <div className="space-y-4 mb-6">
                {userProfileMatches && Array.isArray(userProfileMatches) && userProfileMatches.length > 0 ? (
                  userProfileMatches.map((match, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-800 mb-2">
                            {match.first_name} {match.last_name}
                          </h4>

                          <div className="space-y-2 text-sm text-gray-600">
                            {match.role && match.role !== "" && match.role !== "null" && match.role !== "undefined" && (
                              <div className="flex items-center">
                                <span className="font-medium w-40">Role:</span>
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                  {match.role}
                                </span>
                              </div>
                            )}

                            {match.email &&
                              match.email !== "" &&
                              match.email !== "null" &&
                              match.email !== "undefined" && (
                                <div className="flex items-center">
                                  <span className="font-mediu w-40">Email:</span>
                                  <span>{match.email}</span>
                                </div>
                              )}

                            {match.primary_department &&
                              match.primary_department !== "" &&
                              match.primary_department !== "null" &&
                              match.primary_department !== "undefined" && (
                                <div className="flex items-center">
                                  <span className="font-mediu w-40">Dept:</span>
                                  <span>{match.primary_department}</span>
                                </div>
                              )}

                            {match.primary_faculty &&
                              match.primary_faculty !== "" &&
                              match.primary_faculty !== "null" &&
                              match.primary_faculty !== "undefined" && (
                                <div className="flex items-center">
                                  <span className="font-mediu w-40">Faculty:</span>
                                  <span>{match.primary_faculty}</span>
                                </div>
                              )}

                            {match.cwl_username &&
                              match.cwl_username !== "" &&
                              match.cwl_username !== "null" &&
                              match.cwl_username !== "undefined" && (
                                <div className="flex items-center">
                                  <span className="font-mediu w-40">CWL Username:</span>
                                  <span className="font-mono text-xs bg-gray-100 px-1 rounded">{match.cwl_username}</span>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <button
                          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors font-medium"
                          onClick={() => handleClaimProfile(match)}
                        >
                          <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Claim This Profile
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No profile matches found.</p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600">Don't see your profile above?</p>
                </div>
                <button
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors font-medium"
                  onClick={() => setDoesUserHaveAProfileInDatabase(false)}
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create New Profile Instead
                </button>
              </div>
            </div>
          )}

          {!loading && isUserLoggedIn && userExistsInSqlDatabase && isUserPending && !doesUserNeedToReLogin && (
            <div className="flex flex-col justify-center text-center p-4 m-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
              <h2 className="text-lg font-bold">Your request has been received!</h2>
              <p className="mt-2">It will be processed in a few days. Thank you for your patience.</p>
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
                  Your account has not been approved. Please contact the administrator for assistance.
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
                  <h2 className="text-lg font-bold">Account Approved</h2>
                  <p className="mt-2">
                    Your account has been approved and your permissions have been updated.
                    <br />
                    Please sign out and sign in again to continue.
                  </p>
                  {/* <button
                    onClick={handleSignOut}
                    className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none transition disabled:opacity-50"
                  >
                    Sign Out &amp; Sign In Again
                  </button> */}
                </div>
              </div>
            )}
        </div>
        <div
          className="w-2/5"
          style={{ backgroundImage: "url(/UBC.jpg)", backgroundRepeat: "no-repeat", backgroundSize: "cover" }}
        ></div>
      </div>

      {/* Claim Profile Modal */}
      {showClaimModal && selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Claim Profile</h2>
              <button onClick={handleCancelClaim} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">Profile Information</h3>

              {/* Display profile fields (read-only) */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                {selectedProfile.role &&
                  selectedProfile.role !== "" &&
                  selectedProfile.role !== "null" &&
                  selectedProfile.role !== "undefined" && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Role:</span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        {selectedProfile.role}
                      </span>
                    </div>
                  )}

                {selectedProfile.email &&
                  selectedProfile.email !== "" &&
                  selectedProfile.email !== "null" &&
                  selectedProfile.email !== "undefined" && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Email:</span>
                      <span className="text-gray-800">{selectedProfile.email}</span>
                    </div>
                  )}

                {selectedProfile.primary_department &&
                  selectedProfile.primary_department !== "" &&
                  selectedProfile.primary_department !== "null" &&
                  selectedProfile.primary_department !== "undefined" && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Department:</span>
                      <span className="text-gray-800">{selectedProfile.primary_department}</span>
                    </div>
                  )}

                {selectedProfile.primary_faculty &&
                  selectedProfile.primary_faculty !== "" &&
                  selectedProfile.primary_faculty !== "null" &&
                  selectedProfile.primary_faculty !== "undefined" && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Faculty:</span>
                      <span className="text-gray-800">{selectedProfile.primary_faculty}</span>
                    </div>
                  )}
              </div>

              {/* Editable fields */}
              <h4 className="text-md font-semibold mb-3 text-gray-700">Your Information</h4>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="claim_username">
                  Username
                </label>
                <input
                  type="text"
                  id="claim_username"
                  value={claimFormData.cwl_username}
                  readOnly
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="claim_first_name">
                  First Name
                </label>
                <input
                  type="text"
                  id="claim_first_name"
                  value={claimFormData.first_name}
                  onChange={(e) => setClaimFormData({ ...claimFormData, first_name: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="claim_last_name">
                  Last Name
                </label>
                <input
                  type="text"
                  id="claim_last_name"
                  value={claimFormData.last_name}
                  onChange={(e) => setClaimFormData({ ...claimFormData, last_name: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelClaim}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 focus:outline-none transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClaim}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Processing..." : "Confirm Claim"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default AuthPage;
