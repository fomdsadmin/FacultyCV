import React, { useState } from "react";
import { signUp } from "aws-amplify/auth";

const AddUserModal = ({ isOpen, onClose, onSuccess }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
    const confirmPassword = event.target.confirmPassword.value;

    // Password specifications
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^\s]{8,}$/;

    // Username specification
    const usernameRegex = /@[\w-]+\.ubc\.ca$/;
    const username2Regex = /@ubc\.ca$/;

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    } else if (!passwordRegex.test(password)) {
      setError(
        "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number."
      );
      return;
    } else if (!usernameRegex.test(username) && !username2Regex.test(username)) {
      setError("Email must end with @ubc.ca or @[department].ubc.ca");
      return;
    }

    setError("");

    try {
        setLoading(true);
        console.log("Signing up user:", {
            username,
            firstName,
            lastName,
            role,
            password
        });
    //   const { isSignUpComplete, userId, nextStep } = await signUp({
    //     username: username,
    //     password: password,
    //     attributes: {
    //       email: username,
    //     },
    //   });
      setLoading(false);

    //   if (!isSignUpComplete) {
    //     // User needs to confirm their email
    //     onSuccess({
    //       type: "confirmation_required",
    //       username: username,
    //       firstName: firstName,
    //       lastName: lastName,
    //       role: role,
    //     });
    //   } else {
    //     // Sign up complete
    //     onSuccess({
    //       type: "signup_complete",
    //       username: username,
    //       firstName: firstName,
    //       lastName: lastName,
    //       role: role,
    //     });
    //   }
    } catch (error) {
      console.error("Error:", error);
      if (error.name === "UsernameExistsException") {
        setError("An account with this email already exists.");
      } else if (error.name === "InvalidPasswordException") {
        setError("Password does not meet requirements.");
      } else {
        setError("An error occurred during sign up. Please try again.");
      }
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setUsername("");
    setPassword("");
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                className="input input-bordered w-full text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                type="password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                className="input input-bordered w-full text-sm"
                name="confirmPassword"
                placeholder="Confirm Password"
                type="password"
                required
              />
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
