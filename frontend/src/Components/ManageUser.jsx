import React, { useState, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import ConnectionCard from "./ConnectionCard";
import AssociatedUser from "./AssociatedUser";
import ConnectionInviteModal from "./ConnectionInviteModal";
import ChangeRoleModal from "./ChangeRoleModal";
import UpdateUserModal from "./UpdateUserModal";
import { getUserConnections } from "../graphql/graphqlHelpers";
import { IoMdAddCircleOutline } from "react-icons/io";
import DepartmentAdminUserInsights from "../Views/DepartmentAdminUserInsights"; // Use the same insights component

const ManageUser = ({ user, onBack, fetchAllUsers, department }) => {
  const [currentUser, setCurrentUser] = useState(user);
  const [loading, setLoading] = useState(true);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);
  const [isUpdateUserModalOpen, setIsUpdateUserModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingConnections, setPendingConnections] = useState([]);
  const [confirmedConnections, setConfirmedConnections] = useState([]);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    getAllUserConnections();
    // eslint-disable-next-line
  }, [searchTerm]);

  async function getAllUserConnections() {
    setLoading(true);
    try {
      let retrievedUserConnections;
      if (currentUser.role === "Faculty") {
        retrievedUserConnections = await getUserConnections(currentUser.user_id);
      } else {
        retrievedUserConnections = await getUserConnections(currentUser.user_id, false);
      }

      const filteredUserConnections = retrievedUserConnections.filter(
        (connection) =>
          connection.assistant_first_name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
          connection.assistant_last_name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
          connection.assistant_email.toLowerCase().startsWith(searchTerm.toLowerCase())
      );

      setPendingConnections(filteredUserConnections.filter((connection) => connection.status === "pending"));
      setConfirmedConnections(filteredUserConnections.filter((connection) => connection.status === "confirmed"));
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleBack = () => {
    onBack();
  };

  const handleChangeRole = () => {
    setIsChangeRoleModalOpen(true);
  };

  const handleUpdateUser = () => {
    setIsUpdateUserModalOpen(true);
  };

  const handleUpdateSuccess = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center">
        <button onClick={handleBack} className="text-zinc-800 btn btn-ghost min-h-0 h-8 leading-tight mr-4">
          <FaArrowLeft className="h-6 w-6 text-zinc-800" />
        </button>
      </div>

      {/* User Info */}
      <div className="bg-white rounded-lg shadow px-12 py-4 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-1">
          <h3 className="text-xl font-semibold text-zinc-700 mb-2">
            {currentUser.first_name} {currentUser.last_name}
          </h3>
          <div className="text-zinc-500 text-sm">
            Joined: {currentUser.joined_timestamp ? new Date(currentUser.joined_timestamp).toLocaleDateString() : "N/A"}
          </div>
        </div>
        <div className="text-zinc-500 text-sm mb-2">{currentUser.email}</div>
        <div className="text-zinc-500 text-sm mb-2">Role: {currentUser.role}</div>
        <div className="text-zinc-500 text-sm mb-2">Faculty: {currentUser.primary_faculty}</div>
        <div className="text-zinc-500 text-sm">Primary Department: {currentUser.primary_department}</div>
        <div className="flex flex-wrap justify-end gap-x-2">
          <button onClick={handleUpdateUser} className="btn btn-primary h-9 px-5 text-white font-semibold">
            Update User
          </button>
          <button onClick={handleChangeRole} className="btn btn-info h-9 px-5 text-white font-semibold">
            Change Role
          </button>
        </div>
      </div>

      {/* Connections */}
      <div className="bg-white rounded-lg shadow py-6 px-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-xl font-semibold text-zinc-700">Connections</h3>
          <div className="flex items-center gap-2">
            <label className="input input-bordered flex items-center gap-2">
              <input
                type="text"
                className="grow"
                placeholder="Search connections"
                value={searchTerm}
                onChange={handleSearchChange}
                aria-label="Search connections"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-4 w-4 opacity-70"
              >
                <path
                  fillRule="evenodd"
                  d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </label>
            <button
              onClick={() => setIsConnectionModalOpen(true)}
              className="btn btn-ghost"
              title="Add Connection"
              aria-label="Add Connection"
            >
              <IoMdAddCircleOutline className="h-7 w-7 text-blue-600" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <span className="text-lg text-zinc-600">Loading...</span>
          </div>
        ) : (
          <div>
            {(currentUser.role === "Faculty" || currentUser.role === "Assistant") && (
              <>
                {pendingConnections.length === 0 && confirmedConnections.length === 0 ? (
                  <div className="text-center py-4 text-lg text-zinc-500">No connections found.</div>
                ) : (
                  <>
                    {pendingConnections.length > 0 && (
                      <section className="mb-6">
                        <h4 className="text-lg font-semibold text-zinc-700 mb-2">
                          {currentUser.role === "Faculty" ? "Invitations" : "Pending Connections"}
                        </h4>
                        <div className="flex flex-wrap gap-4">
                          {pendingConnections.map((connection) =>
                            currentUser.role === "Faculty" ? (
                              <AssociatedUser
                                key={connection.user_connection_id}
                                connection={connection}
                                getAllUserConnections={getAllUserConnections}
                              />
                            ) : (
                              <ConnectionCard
                                key={connection.user_connection_id}
                                connection={connection}
                                getAllUserConnections={getAllUserConnections}
                              />
                            )
                          )}
                        </div>
                      </section>
                    )}
                    {confirmedConnections.length > 0 && (
                      <section>
                        <h4 className="text-lg font-semibold text-zinc-700 mb-2">Active Connections</h4>
                        <div className="flex flex-wrap gap-4">
                          {confirmedConnections.map((connection) =>
                            currentUser.role === "Faculty" ? (
                              <AssociatedUser
                                key={connection.user_connection_id}
                                connection={connection}
                                getAllUserConnections={getAllUserConnections}
                              />
                            ) : (
                              <ConnectionCard
                                key={connection.user_connection_id}
                                connection={connection}
                                getAllUserConnections={getAllUserConnections}
                              />
                            )
                          )}
                        </div>
                      </section>
                    )}
                  </>
                )}
              </>
            )}

            {/* Modals */}
            {isConnectionModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <ConnectionInviteModal
                  userInfo={currentUser}
                  getAllUserConnections={getAllUserConnections}
                  setIsModalOpen={setIsConnectionModalOpen}
                  admin={true}
                />
              </div>
            )}
            {isChangeRoleModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <ChangeRoleModal
                  userInfo={currentUser}
                  setIsModalOpen={setIsChangeRoleModalOpen}
                  fetchAllUsers={fetchAllUsers}
                  handleBack={handleBack}
                />
              </div>
            )}
            {isUpdateUserModalOpen && (
              <UpdateUserModal
                isOpen={isUpdateUserModalOpen}
                onClose={() => setIsUpdateUserModalOpen(false)}
                onBack={() => setIsUpdateUserModalOpen(false)}
                existingUser={currentUser}
                onUpdateSuccess={handleUpdateSuccess}
              />
            )}
          </div>
        )}
      </div>

      {/* User Insights Section */}
      <div className="bg-white rounded-lg shadow w-full">
        {(currentUser.role === "Faculty" || currentUser.role.startsWith("Admin-")) && (
          <DepartmentAdminUserInsights user={currentUser} department={currentUser.primary_department} />
        )}
      </div>
    </div>
  );
};

export default ManageUser;
