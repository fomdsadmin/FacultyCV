import React, { useState, useEffect } from "react";
import { addUser, getUser, getAllUniversityInfo, addToUserGroup, updateUser } from "../graphql/graphqlHelpers.js";

const AddUserModal = ({ isOpen, onClose, onSuccess }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Faculty");
  const [isDepartmentAdmin, setIsDepartmentAdmin] = useState(false);
  const [isFacultyAdmin, setIsFacultyAdmin] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [institution, setInstitution] = useState("University of British Columbia"); // NEW: institution state
  const [department, setDepartment] = useState("");
  const [faculty, setFaculty] = useState(""); // NEW: faculty state
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [existingUser, setExistingUser] = useState(null);
  const [showUpdateRole, setShowUpdateRole] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [createdUser, setCreatedUser] = useState(null);

  // Fetch departments and faculties when component mounts
  useEffect(() => {
    const fetchUniversityInfo = async () => {
      try {
        const universityInfo = await getAllUniversityInfo();
        const departmentList = universityInfo
          .filter((item) => item.type === "Department")
          .map((item) => item.value)
          .sort();
        const facultyList = universityInfo
          .filter((item) => item.type === "Faculty")
          .map((item) => item.value)
          .sort();
        setDepartments(departmentList);
        setFaculties(facultyList);
      } catch (error) {
        console.error("Error fetching university info:", error);
      }
    };

    if (isOpen) {
      fetchUniversityInfo();
    }
  }, [isOpen]);

  const handleRoleChange = (event) => {
    setRole("");
    const selectedRole = event.target.value;
    if (selectedRole === "Department Admin") {
      setIsDepartmentAdmin(true);
      setIsFacultyAdmin(false);
    } else if (selectedRole === "Faculty Admin") {
      setIsFacultyAdmin(true);
      setIsDepartmentAdmin(false);
    } else {
      setIsDepartmentAdmin(false);
      setIsFacultyAdmin(false);
      setRole(selectedRole);
    }
  };

  const handleDepartmentInputChange = (event) => {
    const departmentName = event.target.value;
    setSelectedDepartment(departmentName);
    setRole(`Admin-${departmentName}`);
  };

  const handleFacultyInputChange = (event) => {
    const facultyName = event.target.value;
    setSelectedFaculty(facultyName);
    setRole(`FacultyAdmin-${facultyName}`);
  };

  const handleFacultyChange = (e) => {
    setFaculty(e.target.value);
  };

  const handleSignUp = async (event) => {
    event.preventDefault();

    // Username specification
    const usernameRegex = /@[\w-]+\.ubc\.ca$/;
    const username2Regex = /@ubc\.ca$/;

    if (!usernameRegex.test(email) && !username2Regex.test(email)) {
      setError("Email must end with @ubc.ca or @[department].ubc.ca");
      return;
    }

    if (isFacultyAdmin && !selectedFaculty) {
      setError("Please select a faculty");
      return;
    }

    setError("");
    setExistingUser(null);
    setShowUpdateRole(false);
    setShowUpdateModal(false);
    setSuccessMessage("");
    setCreatedUser(null);

    try {
      setLoading(true);
      console.log("Checking if user exists in database :", username);

      // Step 1: Check if user already exists in database
      try {
        const userExists = await getUser(username);

        if (userExists) {
          console.log("User already exists in database:", userExists);
          setExistingUser(userExists);
          setShowUpdateRole(true);
          setError("");
          setLoading(false);
          return;
        }
      } catch (error) {
        console.log("Used not found in database");
      }

      // Step 2: Add user to Cognito user group
      console.log("First adding user to Cognito group and checking if user in Cognito pool");
      let result2;
      if (role.includes("FacultyAdmin")) {
        result2 = await addToUserGroup(username, "FacultyAdmin");
      } else {
        result2 = await addToUserGroup(username, role);
      }

      // const result2obj = JSON.parse(result2str);

      // Check if there was an error with Cognito
      if (result2.includes("FAILURE")) {
        console.log("Error adding user to Cognito group, statusCode 500");
        setError(`User not found in Cognito pool and was not added to database `);
        setLoading(false);
        return;
      } else if (result2.includes("SUCCESS")) {
        // Step 2: Add user to database (since they don't exist)
        console.log("User found in pool, added to Cognito group, statusCode 200 OK");
        const pending = true; // Default to pending
        const approved = false; // Default to not approved
        console.log("Adding user to database with details:", {
          firstName,
          lastName,
          email,
          username,
          role,
          pending,
          approved,
        });
        const result = await addUser(firstName, lastName, email, role, username, department, faculty);
        console.log("User added to database successfully");

        // Set success message and user details
        setSuccessMessage("User has been successfully added to database");
        setCreatedUser({
          username: username,
          firstName: firstName,
          lastName: lastName,
          email: email,
          role: role,
          department: department,
          faculty: faculty, // NEW: add faculty to createdUser
        });
        // Notify parent component of success
        onSuccess({
          type: "user_created",
          username: username,
          firstName: firstName,
          lastName: lastName,
          email: email,
          role: role,
          department: department,
          faculty: faculty, // NEW: add faculty to onSuccess
        });

        // Step 3: Update user with department and faculty information
      } else if (result2.includes("ALREADY_EXISTS")) {
        setError(
          "User already exists in Cognito pool with correct group membership, but not in database.. Please remove the group membership in AWS to add to database"
        );
        setLoading(false);
        return;
      } else {
        setError("Something went wrong while adding user to Cognito group. Please try again.");
        setLoading(false);
        return;
      }

      setLoading(false);

      // Clear form fields but keep success message
      setFirstName("");
      setLastName("");
      setUsername("");
      setEmail("");
      setRole("Faculty");
      setIsDepartmentAdmin(false);
      setIsFacultyAdmin(false);
      setSelectedDepartment("");
      setSelectedFaculty("");
      setDepartment("");
      setFaculty(""); // NEW: reset faculty
      setError("");
    } catch (error) {
      console.error("Error creating user:", error);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setUsername("");
    setEmail("");
    setRole("Faculty");
    setIsDepartmentAdmin(false);
    setIsFacultyAdmin(false);
    setSelectedDepartment("");
    setSelectedFaculty("");
    setDepartment("");
    setFaculty(""); // NEW: reset faculty
    setError("");
    setExistingUser(null);
    setShowUpdateRole(false);
    setShowUpdateModal(false);
    setSuccessMessage("");
    setCreatedUser(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-zinc-600">Add New User</h2>
            <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 text-xl">
              ×
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="text-zinc-600">Loading...</div>
            </div>
          )}

          {successMessage && createdUser && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center">
                <div className="text-green-800 text-sm font-medium">✅ {successMessage}</div>
              </div>
              <div className="text-sm text-green-700">
                <p>
                  <strong>Name:</strong> {createdUser.firstName} {createdUser.lastName}
                </p>
                <p>
                  <strong>Email:</strong> {createdUser.email}
                </p>
                <p>
                  <strong>Username:</strong> {createdUser.username}
                </p>
                {department && (
                  <p>
                    <strong>Department:</strong> {createdUser.department}
                  </p>
                )}
                {faculty && (
                  <p>
                    <strong>Faculty:</strong> {createdUser.faculty}
                  </p>
                )}
                <p>
                  <strong>Role:</strong> {createdUser.role}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={handleClose} className="btn btn-primary btn-sm">
                  Close
                </button>
              </div>
            </div>
          )}

          {!loading && !successMessage && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    className="input input-bordered w-full text-sm"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    className="input input-bordered w-full text-sm"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  className="input input-bordered w-full text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  type="email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  className="input input-bordered w-full text-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  type="username"
                  required
                />
              </div>
              {/* TODO: Ask about primary and joint*/}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  className="input input-sm input-bordered w-full text-sm "
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  // removed required to make optional
                >
                  <option value="">Select a department...</option>
                  {departments.map((dept, index) => (
                    <option key={index} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              {/* NEW: Faculty dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Faculty</label>
                <select
                  className="input input-sm input-bordered w-full text-sm"
                  value={faculty}
                  onChange={handleFacultyChange}
                  // removed required to make optional
                >
                  <option value="">Select a faculty...</option>
                  {faculties.map((fac, index) => (
                    <option key={index} value={fac}>
                      {fac}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                  <input
                    className="input input-sm input-bordered w-full text-sm"
                    value={institution || ""}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Institution"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="faculty"
                      name="role"
                      value="Faculty"
                      checked={role === "Faculty"}
                      onChange={handleRoleChange}
                    />
                    <label htmlFor="faculty" className="ml-2 text-sm">
                      Faculty
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="assistant"
                      name="role"
                      value="Assistant"
                      checked={role === "Assistant"}
                      onChange={handleRoleChange}
                    />
                    <label htmlFor="assistant" className="ml-2 text-sm">
                      Assistant
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="department-admin"
                      name="role"
                      value="Department Admin"
                      checked={isDepartmentAdmin}
                      onChange={handleRoleChange}
                    />
                    <label htmlFor="department-admin" className="ml-2 text-sm">
                      Department Admin
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="faculty-admin"
                      name="role"
                      value="Faculty Admin"
                      checked={isFacultyAdmin}
                      onChange={handleRoleChange}
                    />
                    <label htmlFor="faculty-admin" className="ml-2 text-sm">
                      Faculty Admin
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="admin"
                      name="role"
                      value="Admin"
                      checked={role === "Admin"}
                      onChange={handleRoleChange}
                    />
                    <label htmlFor="admin" className="ml-2 text-sm">
                      Admin
                    </label>
                  </div>
                </div>
              </div>

              {isDepartmentAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    className="input input-bordered w-full text-sm"
                    value={selectedDepartment}
                    onChange={handleDepartmentInputChange}
                    required
                  >
                    <option value="">Select a department...</option>
                    {departments.map((department, index) => (
                      <option key={index} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Select the department for this admin role</p>
                </div>
              )}

              {isFacultyAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Faculty</label>
                  <select
                    className="input input-bordered w-full text-sm"
                    value={selectedFaculty}
                    onChange={handleFacultyInputChange}
                    required
                  >
                    <option value="">Select a faculty...</option>
                    {faculties.map((faculty, index) => (
                      <option key={index} value={faculty}>
                        {faculty}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Select the faculty for this admin role</p>
                </div>
              )}

              {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

              {existingUser && showUpdateRole && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center">
                    <div className="text-yellow-800 text-sm font-medium">
                      ⚠️ User with this email already exists in the database.
                    </div>
                  </div>
                  <div className="text-sm text-yellow-700">
                    <p>
                      <strong>Name:</strong> {existingUser.first_name} {existingUser.last_name}
                    </p>
                    <p>
                      <strong>Email:</strong> {existingUser.email}
                    </p>
                    <p>
                      <strong>Role:</strong> {existingUser.role}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={
                    showUpdateRole
                      ? () => {
                          setShowUpdateRole(false);
                          setExistingUser(null);
                          setError("");
                        }
                      : handleClose
                  }
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>

                {!showUpdateRole && (
                  <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
                    {loading ? "Creating..." : "Create Account"}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default AddUserModal;
