import React, { useState, useEffect } from "react";
import { changeUsername, getUser, updateUser, getAllUniversityInfo } from "../graphql/graphqlHelpers.js";
import { useAuditLogger } from "../Contexts/AuditLoggerContext";
import { AUDIT_ACTIONS } from "../Contexts/AuditLoggerContext";
import { get } from "aws-amplify/api";

const UpdateUserModal = ({ isOpen, onClose, onBack, existingUser, onUpdateSuccess }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cwl_username, setCWLUsername] = useState("");
  const [vpp_username, setVPPUsername] = useState("");
  const [email, setEmail] = useState("");
  const [primaryDepartment, setPrimaryDepartment] = useState("");
  const [primaryFaculty, setPrimaryFaculty] = useState("");
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  //audit logger
  const { logAction } = useAuditLogger();

  useEffect(() => {
    if (existingUser) {
      setFirstName(existingUser.first_name || "");
      setLastName(existingUser.last_name || "");
      setCWLUsername(existingUser.cwl_username || "");
      setVPPUsername(existingUser.vpp_username || "");
      setEmail(existingUser.email || "");
      setPrimaryDepartment(existingUser.primary_department || "");
      setPrimaryFaculty(existingUser.primary_faculty || "");
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

  // Fetch university info (departments and faculties)
  useEffect(() => {
    const fetchUniversityInfo = async () => {
      try {
        const result = await getAllUniversityInfo();
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
      } catch (error) {
        console.error("Error fetching university info:", error);
      }
    };

    if (isOpen) {
      fetchUniversityInfo();
    }
  }, [isOpen]);

  const handleUpdateSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      function sanitizeInput(input) {
        if (!input) return "";
        return input
          .replace(/\\/g, "\\\\") // escape backslashes
          .replace(/"/g, '\\"') // escape double quotes
          .replace(/\n/g, "\\n"); // escape newlines
      }

      // Update user in database (keeping existing role)
      await updateUser(
        existingUser.user_id,
        firstName,
        lastName,
        existingUser.preferred_name || "",
        email,
        existingUser.role, // Keep existing role
        sanitizeInput(existingUser.bio || ""),
        existingUser.institution || "",
        primaryDepartment,
        primaryFaculty,
        existingUser.campus || "",
        existingUser.keywords || "",
        existingUser.institution_user_id || "",
        existingUser.scopus_id,
        existingUser.orcid_id
      );

      await changeUsername(existingUser.user_id, cwl_username, vpp_username);

      const newResult = await getUser(existingUser.cwl_username);
      console.log("User updated successfully:", newResult);

      // Store the updated user data
      onUpdateSuccess(newResult);
      // Set success message after updating the user data
      setSuccessMessage("User Successfully Updated");
      // Log the user update action to audit logs
      await logAction(AUDIT_ACTIONS.UPDATE_USER, {
        userID: existingUser.user_id,
        firstName,
        lastName,
      });
      window.location.reload(); // Refresh the page on close
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
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 px-4">
      <div className="bg-white rounded-lg p-8 w-full max-w-xl  flex flex-col my-auto">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CWL Username</label>
                <input
                  className="input input-bordered w-full text-sm bg-gray-100"
                  value={cwl_username}
                  onChange={(e) => setCWLUsername(e.target.value)}
                  placeholder="CWL Username"
                  type="text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VPP Username</label>
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
                  className="input input-bordered w-full text-sm "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  type="email"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Faculty</label>
                <select
                  className="select select-bordered w-full text-sm"
                  value={primaryFaculty}
                  onChange={(e) => setPrimaryFaculty(e.target.value)}
                >
                  <option value="">Select Faculty</option>
                  {faculties.map((fac, idx) => (
                    <option key={idx} value={fac}>
                      {fac}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Department</label>
                <select
                  className="select select-bordered w-full text-sm"
                  value={primaryDepartment}
                  onChange={(e) => setPrimaryDepartment(e.target.value)}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept, idx) => (
                    <option key={idx} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
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
