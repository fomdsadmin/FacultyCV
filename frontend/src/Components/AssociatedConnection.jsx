import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserConnections, deleteUserConnection, getUser } from "../graphql/graphqlHelpers.js";
import { FaUser, FaTrash, FaCog } from "react-icons/fa";
import RemoveConnectionModal from "./RemoveConnectionModal.jsx";
import { useApp } from "../Contexts/AppContext.jsx";

const AssociatedConnection = ({ connection, refreshConnections }) => {
  const [enteringProfile, setEnteringProfile] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const navigate = useNavigate();
  const { startManagingUser } = useApp();

  const enterProfile = async () => {
    setEnteringProfile(true);
    try {
      // Only proceed if the connection is confirmed
      if (connection.status === "confirmed") {
        // Get the full faculty user info
        console.log("Entering profile for connection:", connection);
        const facultyUser = await getUser(connection.faculty_username);

        // Start managing the user
        startManagingUser(facultyUser);

        // Navigate to faculty home
        navigate("/faculty/home");
      } else {
        console.error("Error: Connection is not confirmed");
      }
    } catch (error) {
      console.error("Error:", error);
    }
    setEnteringProfile(false);
  };

  const handleRemoveConnection = async () => {
    setRemoving(true);
    try {
      await deleteUserConnection(connection.user_connection_id);
      if (refreshConnections) {
        refreshConnections();
      }
      setShowRemoveModal(false);
    } catch (error) {
      console.error("Error removing connection:", error);
      alert("Failed to remove connection. Please try again.");
    }
    setRemoving(false);
  };

  const getStatusBadge = () => {
    if (connection.status === "pending") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Pending
        </span>
      );
    }
    return (
      // <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      //     Active
      // </span>
      <></>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header with Avatar and Status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <FaUser className="text-gray-500 text-sm" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className="text-sm font-medium text-gray-900 truncate"
              title={`${connection.faculty_first_name} ${connection.faculty_last_name}`}
            >
              {connection.faculty_first_name} {connection.faculty_last_name}
            </h3>
            <p className="text-sm text-gray-600 truncate" title={connection.faculty_email}>
              {connection.faculty_email}
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {connection.status === "confirmed" && (
          <button
            onClick={enterProfile}
            disabled={enteringProfile}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors duration-200"
          >
            <FaCog className="text-xs" />
            {enteringProfile ? "Entering..." : "Manage"}
          </button>
        )}

        <button
          onClick={() => setShowRemoveModal(true)}
          disabled={removing}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 disabled:bg-red-25 disabled:text-red-400 rounded-md transition-colors duration-200"
          title="Remove connection"
        >
          <FaTrash className="text-xs" />
          Remove
        </button>
      </div>

      {/* Remove Confirmation Modal */}
      {showRemoveModal && (
        <RemoveConnectionModal
          connection={connection}
          onConfirm={handleRemoveConnection}
          onCancel={() => setShowRemoveModal(false)}
          isRemoving={removing}
        />
      )}
    </div>
  );
};

export default AssociatedConnection;
