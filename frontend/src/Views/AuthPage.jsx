import React from "react";
import PageContainer from "./PageContainer.jsx";
import "../CustomStyles/scrollbar.css";
import { fetchUserAttributes, fetchAuthSession } from "aws-amplify/auth";
import { signInWithRedirect } from "aws-amplify/auth";
import { useApp } from "Contexts/AppContext.jsx";
import { addUser, getAllUniversityInfo } from "graphql/graphqlHelpers.js";
import { useState, useEffect } from "react";

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
    // Check for required department and faculty
    if (!formData.primary_department || !formData.primary_faculty) {
      setFormError("Please select both a department and a faculty.");
      return;
    }
    setFormError(""); // Clear error if present
    setLoading(true);
    console.log("Submitting request with formData:", formData);
    try {
      await addUser(formData.first_name, formData.last_name, formData.email, formData.role, formData.username);
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
      username: name,
      email: email,
      first_name: given_name,
      last_name: family_name,
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
    if (!loading && isUserLoggedIn && isUserApproved && !isUserPending) {
      window.location.href = "/home";
    }
  }, [isUserApproved, isUserLoggedIn, isUserPending, loading]);

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
        <div className="w-3/5 flex flex-col items-center justify-center overflow-auto custom-scrollbar">
          <div className="text-2xl text-gray-500 font-bold m-4">Signup Page</div>
          {loading && (
            <div className="text-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          )}

          {!loading && isUserLoggedIn && !userExistsInSqlDatabase && (
            <form className="w-full max-w-md">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                  Username
                </label>
                <input
                  type="text"
                  id="name"
                  name="username"
                  value={formData.username}
                  readOnly
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
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
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="primary_department">
                  Primary Department
                </label>
                <select
                  id="primary_department"
                  name="primary_department"
                  value={formData.primary_department}
                  onChange={(e) => setFormData({ ...formData, primary_department: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="primary_faculty">
                  Primary Faculty
                </label>
                <select
                  id="primary_faculty"
                  name="primary_faculty"
                  value={formData.primary_faculty}
                  onChange={(e) => setFormData({ ...formData, primary_faculty: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Select Faculty</option>
                  {faculties.map((fac, idx) => (
                    <option key={idx} value={fac}>
                      {fac}
                    </option>
                  ))}
                </select>
              </div>
              {formError && (
                <div className="mb-4 text-red-600 text-sm">{formError}</div>
              )}
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
          {!loading && isUserLoggedIn && userExistsInSqlDatabase && !isUserPending && !isUserApproved && (
            <div className="text-center p-4 m-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <h2 className="text-lg font-bold">Account not approved</h2>
              <p className="mt-2">
                Your account has not been approved. Please contact the administrator for assistance.
              </p>
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
