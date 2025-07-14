import React, { useState } from "react";
import { adminCreateUser, addUser, updateUser, getUser } from "../graphql/graphqlHelpers.js";

const AddUserModal = ({ isOpen, onClose, onSuccess }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [cwl, setCwl] = useState("");
  const [vpp, setVpp] = useState("");
  const [role, setRole] = useState("Faculty");
  const [isDepartmentAdmin, setIsDepartmentAdmin] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRoleChange = (event) => {
    setRole("");
    const selectedRole = event.target.value;
    if (selectedRole === "Department Admin") {
      setIsDepartmentAdmin(true);
    } else {
      setIsDepartmentAdmin(false);
      setRole(selectedRole);
    }
  };

  const handleDepartmentInputChange = (event) => {
    const departmentName = event.target.value;
    setSelectedDepartment(departmentName);
    setRole(`Admin-${departmentName}`);
  };

  const handleSignUp = async (event) => {
    event.preventDefault();

    // Username specification
    const usernameRegex = /@[\w-]+\.ubc\.ca$/;
    const username2Regex = /@ubc\.ca$/;

    if (!usernameRegex.test(username) && !username2Regex.test(username)) {
      setError("Email must end with @ubc.ca or @[department].ubc.ca");
      return;
    }

    setError("");

    try {
      setLoading(true);
      console.log("Creating user:", {
        username,
        firstName,
        lastName,
        cwl,
        vpp,
        role,
      });

      // Step 1: Create user in Cognito using admin APIs
      const response = await adminCreateUser(firstName, lastName, username, role);
      
      // Parse the response (it returns a JSON string)
      const result = JSON.parse(response);
      
      if (result.statusCode !== 200) {
        throw new Error(result.error || "Failed to create user");
      }
      
      console.log("User created in Cognito:", result);

    //   // Step 2: Add user to database
    //   await addUser(
    //     firstName,
    //     lastName,
    //     "",
    //     username,
    //     role,
    //     "",
    //     "",
    //     "",
    //     "",
    //     "",
    //     "",
    //     "",
    //     "",
    //     "",
    //     "",
    //     "",
    //     "",
    //     "",
    //     ""
    //   );

    //   // Step 3: Update user info in database
    //   const user = await getUser(username);
    //   await updateUser(
    //     user.user_id,
    //     firstName,
    //     lastName,
    //     "",
    //     username,
    //     role,
    //     "",
    //     "",
    //     "",
    //     "",
    //     "",
    //     "",
    //     "",
    //     "",
    //     "",
    //     "",
    //     "",
    //     "",
    //     "",
    //     ""
    //   );

      setLoading(false);

      // Notify parent component of success
      onSuccess({
        type: "user_created",
        username: username,
        firstName: firstName,
        lastName: lastName,
        cwl: cwl,
        vpp: vpp,
        role: role,
        temporaryPassword: result.temporaryPassword,
      });

    } catch (error) {
      console.error("Error creating user:", error);
      if (error.name === "UsernameExistsException") {
        setError("An account with this email already exists.");
      } else if (error.name === "InvalidPasswordException") {
        setError("Password does not meet requirements.");
      } else {
        setError("An error occurred during user creation. Please try again.");
      }
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setUsername("");
    setCwl("");
    setVpp("");
    setRole("Faculty");
    setIsDepartmentAdmin(false);
    setSelectedDepartment("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
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

        {!loading && (
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
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Email"
                type="email"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                A temporary password will be generated and provided after user creation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CWL</label>
                <input
                  className="input input-bordered w-full text-sm"
                  value={cwl}
                  onChange={(e) => setCwl(e.target.value)}
                  placeholder="CWL"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VPP</label>
                <input
                  className="input input-bordered w-full text-sm"
                  value={vpp}
                  onChange={(e) => setVpp(e.target.value)}
                  placeholder="VPP"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <div className="space-y-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                <input
                  className="input input-bordered w-full text-sm"
                  value={selectedDepartment}
                  onChange={handleDepartmentInputChange}
                  placeholder="Department Name"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Should be exactly the same as name in list of departments provided during deployment
                </p>
              </div>
            )}

            {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={handleClose} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
                {loading ? "Creating..." : "Create Account"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddUserModal;
