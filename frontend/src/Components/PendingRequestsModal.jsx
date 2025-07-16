import React, { useState, useEffect } from "react";
import { updateUserPermissions } from "graphql/graphqlHelpers";

const PendingRequestsModal = ({
  isOpen,
  onClose,
  pendingUsers,
  setPendingUsers,
  rejectedUsers,
  setRejectedUsers,
  refreshUsers,
}) => {
  const [showRejected, setShowRejected] = useState(false);

  const handleAccept = async (userId) => {
    // TODO: Implement accept logic
    console.log("Accepting user:", userId);
    // Remove from pending list
    setPendingUsers((prev) => prev.filter((user) => (user.user_id || user.id) !== userId));
    await updateUserPermissions(userId, false, true);
    refreshUsers();
  };

  const handleReject = async (userId) => {
    // TODO: Implement reject logic
    console.log("Rejecting user:", userId);
    // Move from pending to rejected
    const userToReject = pendingUsers.find((user) => user.user_id === userId);
    if (userToReject) {
      setPendingUsers((prev) => prev.filter((user) => (user.user_id || user.id) !== userId));
      setRejectedUsers((prev) => [...prev, userToReject]);
      await updateUserPermissions(userId, false, false);
      refreshUsers();
    }
  };

  const handleApprove = async (userId) => {
    // TODO: Implement approve logic for rejected users
    console.log("Approving previously rejected user:", userId);
    // Remove from rejected list
    setRejectedUsers((prev) => prev.filter((user) => (user.user_id || user.id) !== userId));
    await updateUserPermissions(userId, false, true);
    refreshUsers();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-zinc-600">
              {showRejected ? "Rejected Requests" : "Pending User Requests"}
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              {showRejected
                ? "Previously rejected user access requests - you can approve them to grant access"
                : "Review and manage user access requests to the system"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setShowRejected(false)}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${
              !showRejected
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Pending Requests
              {pendingUsers.length > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {pendingUsers.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setShowRejected(true)}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${
              showRejected
                ? "text-red-600 border-b-2 border-red-600 bg-red-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                />
              </svg>
              Rejected Requests
              {rejectedUsers.length > 0 && (
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                  {rejectedUsers.length}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* User List */}
          <div className="space-y-3">
            {(showRejected ? rejectedUsers : pendingUsers).length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  {showRejected ? "No rejected requests" : "No pending requests"}
                </h3>
                <p className="text-gray-500">
                  {showRejected
                    ? "All rejected requests have been cleared or approved."
                    : "All user requests have been processed."}
                </p>
              </div>
            ) : (
              (showRejected ? rejectedUsers : pendingUsers).map((user) => (
                <div
                  key={user.user_id || user.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-white font-semibold text-sm">
                          {user.first_name[0] || ""}
                          {user.last_name[0] || ""}
                        </span>
                      </div>

                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-semibold text-gray-800 text-lg">
                            {user.first_name || "User"} {user.last_name || ""}
                          </h4>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role === "Faculty"
                                ? "bg-green-100 text-green-800"
                                : user.role === "Student"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {user.role}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{user.email}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m0 0h4a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1h4m0 0V3a1 1 0 011-1h2a1 1 0 011 1v4"
                              />
                            </svg>
                            Joined:{" "}
                            {user.joined_timestamp ? new Date(user.joined_timestamp).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {showRejected ? (
                        <button
                          onClick={() => handleApprove(user.user_id)}
                          className="btn btn-success flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Approve
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleAccept(user.user_id)}
                            className="btn btn-success flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Accept
                          </button>
                          <button
                            onClick={() => handleReject(user.user_id)}
                            className="btn btn-error text-white flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingRequestsModal;
