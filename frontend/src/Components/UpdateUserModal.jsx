import React, { useState, useEffect } from "react";
import { changeUsername, getUser, updateUser } from "../graphql/graphqlHelpers.js";
import { get } from "aws-amplify/api";

const UpdateUserModal = ({ isOpen, onClose, onBack, existingUser, onUpdateSuccess }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (existingUser) {
      setFirstName(existingUser.first_name || "");
      setLastName(existingUser.last_name || "");
      setUsername(existingUser.username);
      setEmail(existingUser.email || "");
      setError("");
      // Don't clear success message here to allow it to persist after update
    }
  }, [existingUser]);

  // Clear success message when modal opens
  useEffect(() => {
    if (isOpen) {
      setSuccessMessage("");
      setError("");
    }
  }, [isOpen]);

  const handleUpdateSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      // Update user in database (keeping existing role)
      await updateUser(
        existingUser.user_id,
        firstName,
        lastName,
        existingUser.preferred_name || "",
        email,
        existingUser.role, // Keep existing role
        existingUser.bio || "",
        existingUser.rank || "",
        existingUser.institution || "",
        existingUser.primary_department || "",
        existingUser.secondary_department || "",
        existingUser.primary_faculty || "",
        existingUser.secondary_faculty || "",
        existingUser.primary_affiliation || "",
        existingUser.secondary_affiliation || "",
        existingUser.campus || "",
        existingUser.keywords || "",
        existingUser.institution_user_id || "",
        existingUser.scopus_id || "",
        existingUser.orcid_id || ""
      );

      await changeUsername(existingUser.user_id, username);

      const newResult = await getUser(existingUser.username);
      console.log("User updated successfully:", newResult);

      // Store the updated user data
      onUpdateSuccess(newResult);
      // Set success message after updating the user data
      setSuccessMessage("User Successfully Updated");
    } catch (error) {
      console.error("Error updating user:", error);
      setError("An error occurred while updating user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleBack = () => {
    onBack();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-xl h-[500px] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-zinc-600">Update User</h2>
          </div>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 text-xl">
            ×
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="text-zinc-600">Updating...</div>
          </div>
        ) : (
          <form onSubmit={handleUpdateSubmit} className="space-y-4 flex-1 flex flex-col overflow-y-auto">
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
                className="input input-bordered w-full text-sm bg-gray-50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                className="input input-bordered w-full text-sm bg-gray-50"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                type="username"
              />
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

            {successMessage && <div className="text-sm text-green-600 bg-green-50 p-2 rounded">{successMessage}</div>}

            <div className="flex gap-3 pt-4 mt-auto">
              <button type="button" onClick={handleBack} className="btn btn-secondary flex-1">
                Back
              </button>
              <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
                {loading ? "Updating..." : "Update User"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UpdateUserModal;
