import React, { useState, useEffect } from "react";
import { addUser, getUser, getAllUniversityInfo, addToUserGroup, updateUser } from "../graphql/graphqlHelpers.js";
import { useAuditLogger, AUDIT_ACTIONS } from "../Contexts/AuditLoggerContext";

const AddUserModal = ({ isOpen, onClose, onSuccess }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cwl_username, setCWLUsername] = useState("");
  const [vpp_username, setVPPUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Faculty");
  const [isDepartmentAdmin, setIsDepartmentAdmin] = useState(false);
  const [isFacultyAdmin, setIsFacultyAdmin] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [department, setDepartment] = useState("");
  const [faculty, setFaculty] = useState(""); // NEW: faculty state
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [existingUser, setExistingUser] = useState(null);
  const [showUpdateRole, setShowUpdateRole] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [createdUser, setCreatedUser] = useState(null);

  const { logAction } = useAuditLogger();

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

  const validateForm = () => {
    const errors = {};

    if (!cwl_username.trim()) {
      errors.cwl_username = "CWL username is required";
    } else {
      const usernameRegex = /@ubc\.ca$/;
      if (!usernameRegex.test(cwl_username)) {
        errors.cwl_username = "CWL Username must end with @ubc.ca";
      }
    }

    if (!department.trim()) {
      errors.department = "Department is required";
    }

    if (!faculty.trim()) {
      errors.faculty = "Faculty is required";
    }

    if (isDepartmentAdmin && !selectedDepartment) {
      errors.selectedDepartment = "Please select a department for admin role";
    }

    if (isFacultyAdmin && !selectedFaculty) {
      errors.selectedFaculty = "Please select a faculty for admin role";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignUp = async (event) => {
    event.preventDefault();

    // Clear previous errors
    setError("");
    setFieldErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    setExistingUser(null);
    setShowUpdateRole(false);
    setShowUpdateModal(false);
    setSuccessMessage("");
    setCreatedUser(null);
    setLoading(true);

    try {
      // Step 1: Check if user already exists in database
      const userExists = await getUser(cwl_username);
      if (userExists) {
        console.log("User with this CWL already exists in database:", userExists);
        setExistingUser(userExists);
        setShowUpdateRole(true);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.log("No user found with same CWL, proceeding with creation", error);
    } finally {
      setLoading(false);
    }

    // Step 2: Create user in database
    try {
      // Special case: make these approved when added with Admin page
      let pending = false;
      let approved = true;
      const result = await addUser(firstName, lastName, email, role, pending, approved, cwl_username, vpp_username, department, faculty);
      console.log("User added to database successfully:", result);

      setSuccessMessage("User has been successfully added to database");
      
      // Step 6: Log the user creation action
      await logAction(AUDIT_ACTIONS.ADD_USER, { ...result });

      // Step 7: Call onSuccess to refresh the users list
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.log("Error in user creation process:", error);
      setError(`Failed to create user: ${error.message || "Unknown error occurred"}`);
    } finally {
      setLoading(false);
    }
  };

  const resetFormFields = () => {
    setFirstName("");
    setLastName("");
    setCWLUsername("");
    setVPPUsername("");
    setEmail("");
    setRole("Faculty");
    setIsDepartmentAdmin(false);
    setIsFacultyAdmin(false);
    setSelectedDepartment("");
    setSelectedFaculty("");
    setDepartment("");
    setFaculty("");
  };

  const resetForm = () => {
    resetFormFields();
    setError("");
    setFieldErrors({});
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

          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <div className="text-green-800 text-sm font-medium">✅ {successMessage}</div>
              </div>
            </div>
          )}

          {!loading && (
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* First Row: First Name + Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    className={`input input-bordered w-full text-sm ${
                      fieldErrors.firstName ? "border-red-500 bg-red-50" : ""
                    }`}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                  />
                  {fieldErrors.firstName && <p className="text-xs text-red-600 mt-1">{fieldErrors.firstName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    className={`input input-bordered w-full text-sm ${
                      fieldErrors.lastName ? "border-red-500 bg-red-50" : ""
                    }`}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                  />
                  {fieldErrors.lastName && <p className="text-xs text-red-600 mt-1">{fieldErrors.lastName}</p>}
                </div>
              </div>

              {/* Second Row: CWL Username (full width) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CWL Username <span className="text-red-500">*</span> (must end with{" "}
                  <b>
                    <i>@ubc.ca</i>
                  </b>
                  )
                </label>
                <input
                  className={`input input-bordered w-full text-sm bg-gray-100 ${
                    fieldErrors.cwl_username ? "border-red-500 bg-red-50" : ""
                  }`}
                  value={cwl_username}
                  onChange={(e) => setCWLUsername(e.target.value)}
                  placeholder="Eg. CWL@ubc.ca"
                  type="text"
                  required
                />
                {fieldErrors.cwl_username && <p className="text-xs text-red-600 mt-1">{fieldErrors.cwl_username}</p>}
              </div>

              {/* Third Row: VPP Username + Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">VCH/PHSA/PHC Username</label>
                  <input
                    className="input input-bordered w-full text-sm bg-gray-100"
                    value={vpp_username}
                    onChange={(e) => setVPPUsername(e.target.value)}
                    placeholder="VPP Username"
                    type="text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    className={`input input-bordered w-full text-sm ${
                      fieldErrors.email ? "border-red-500 bg-red-50" : ""
                    }`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    type="email"
                  />
                  {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
                </div>
              </div>
              {/* TODO: Ask about primary and joint*/}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  className={`input input-sm input-bordered w-full text-sm ${
                    fieldErrors.department ? "border-red-500 bg-red-50" : ""
                  }`}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                >
                  <option value="">Select a department...</option>
                  {departments.map((dept, index) => (
                    <option key={index} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                {fieldErrors.department && <p className="text-xs text-red-600 mt-1">{fieldErrors.department}</p>}
              </div>
              {/* Faculty dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Faculty <span className="text-red-500">*</span>
                </label>
                <select
                  className={`input input-sm input-bordered w-full text-sm ${
                    fieldErrors.faculty ? "border-red-500 bg-red-50" : ""
                  }`}
                  value={faculty}
                  onChange={handleFacultyChange}
                  required
                >
                  <option value="">Select a faculty...</option>
                  {faculties.map((fac, index) => (
                    <option key={index} value={fac}>
                      {fac}
                    </option>
                  ))}
                </select>
                {fieldErrors.faculty && <p className="text-xs text-red-600 mt-1">{fieldErrors.faculty}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 space-y-2 ${
                    fieldErrors.role ? "border border-red-500 bg-red-50 p-2 rounded" : ""
                  }`}
                >
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
                {fieldErrors.role && <p className="text-xs text-red-600 mt-1">{fieldErrors.role}</p>}
              </div>

              {isDepartmentAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`input input-bordered w-full text-sm ${
                      fieldErrors.selectedDepartment ? "border-red-500 bg-red-50" : ""
                    }`}
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
                  {fieldErrors.selectedDepartment && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.selectedDepartment}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Select the department for this admin role</p>
                </div>
              )}

              {isFacultyAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Faculty <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`input input-bordered w-full text-sm ${
                      fieldErrors.selectedFaculty ? "border-red-500 bg-red-50" : ""
                    }`}
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
                  {fieldErrors.selectedFaculty && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.selectedFaculty}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Select the faculty for this admin role</p>
                </div>
              )}

              {existingUser && showUpdateRole && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center">
                    <div className="text-yellow-800 text-sm font-medium">
                      ⚠️ User with this CWL already exists in the database.
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
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
