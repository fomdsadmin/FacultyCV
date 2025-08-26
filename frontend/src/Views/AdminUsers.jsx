import React from "react";
import { useState, useEffect } from "react";
import { useApp } from "../Contexts/AppContext.jsx";
import { useNavigate } from "react-router-dom";
import PageContainer from "./PageContainer.jsx";
import AdminMenu from "../Components/AdminMenu.jsx";
import Filters from "../Components/Filters.jsx";
import ManageUser from "../Components/ManageUser.jsx";
import AddUserModal from "../Components/AddUserModal.jsx";
import ImportUserModal from "../Components/ImportUserModal.jsx";
import PendingRequestsModal from "../Components/PendingRequestsModal.jsx";
import { getAllUsers, removeUser, getDepartmentAffiliations } from "../graphql/graphqlHelpers.js";
import { useAuditLogger, AUDIT_ACTIONS } from "../Contexts/AuditLoggerContext.jsx";
import { useAdmin } from "Contexts/AdminContext.jsx";

// Custom Modal Component
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, type = "confirm" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
        <p className="text-gray-600 mb-6 whitespace-pre-line">{message}</p>
        <div className="flex justify-end gap-3">
          {type === "confirm" && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={type === "confirm" ? onConfirm : onClose}
            className={`px-4 py-2 rounded-lg text-white transition-colors ${
              type === "confirm"
                ? "bg-red-600 hover:bg-red-700"
                : type === "error"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {type === "confirm" ? "Confirm" : "OK"}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminUsers = ({ userInfo, getCognitoUser }) => {
  const [users, setUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [affiliations, setAffiliations] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [rejectedUsers, setRejectedUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [activeFilters, setActiveFilters] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isPendingRequestsModalOpen, setIsPendingRequestsModalOpen] = useState(false);
  const [isImportUsersModalOpen, setIsImportUsersModalOpen] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "confirm", onConfirm: null });
  const { startManagingUser } = useApp();
  const navigate = useNavigate();

  const { logAction } = useAuditLogger();
  const { loading, setLoading, allUsers, departmentAffiliations } = useAdmin();

  useEffect(() => {
    setUsers(allUsers);
  }, [allUsers]);

  useEffect(() => {
    fetchAllUsers();
  }, [users]);

  useEffect(() => {
    setAffiliations(departmentAffiliations);
  }, [departmentAffiliations]);


  async function fetchAllUsers() {
    try {
      // Clear and rebuild the arrays
      const pendingUsersList = [];
      const approvedUsersList = [];
      const rejectedUsersList = [];

      users.forEach((user) => {
        if (user.pending === true && user.approved === false) {
          pendingUsersList.push(user);
        } else if (user.pending == false && user.approved === false) {
          rejectedUsersList.push(user);
        } else if (user.pending == false && user.approved === true) {
          approvedUsersList.push(user);
        }
      });

      setApprovedUsers(approvedUsersList);
      setPendingUsers(pendingUsersList);
      setRejectedUsers(rejectedUsersList);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
    setLoading(false);
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Function to get primary rank for a user from affiliations data
  const getPrimaryRank = (userId) => {
    const userAffiliation = affiliations.find((aff) => aff.user_id === userId);

    if (userAffiliation && userAffiliation.primary_unit) {
      try {
        // Parse the primary_unit string to JSON object
        const primaryUnit =
          typeof userAffiliation.primary_unit === "string"
            ? JSON.parse(userAffiliation.primary_unit)
            : userAffiliation.primary_unit;

        if (primaryUnit && primaryUnit.rank) {
          return primaryUnit.rank;
        }
      } catch (error) {
        console.error("Error parsing primary_unit JSON:", error, userAffiliation.primary_unit);
      }
    }

    return null;
  };

  // Function to get joint ranks for a user from affiliations data
  const getJointRanks = (userId) => {
    const userAffiliation = affiliations.find((aff) => aff.user_id === userId);

    if (userAffiliation && userAffiliation.joint_units) {
      try {
        // Parse the joint_units string to JSON array
        const jointUnits =
          typeof userAffiliation.joint_units === "string"
            ? JSON.parse(userAffiliation.joint_units)
            : userAffiliation.joint_units;

        if (Array.isArray(jointUnits) && jointUnits.length > 0) {
          // Extract ranks from joint units and filter out empty ones
          const ranks = jointUnits.map((unit) => unit.rank).filter((rank) => rank && rank.trim() !== "");

          if (ranks.length > 0) {
            // Remove duplicates by converting to Set and back to array
            const uniqueRanks = [...new Set(ranks)];
            return uniqueRanks.join(", ");
          }
        }
      } catch (error) {
        console.error("Error parsing joint_units JSON:", error, userAffiliation.joint_units);
      }
    }

    return null;
  };

  // All unique roles for tabs and filters
  const filters = Array.from(new Set(approvedUsers.map((user) => (user.role === "Assistant" ? "Delegate" : user.role))));

  // Tab bar for roles (copied and adapted from DepartmentAdminUsers)
  const UserTabs = ({ filters, activeFilter, onSelect }) => (
    <div className="flex flex-wrap gap-4 mb-6 px-4 max-w-full">
      <button
        className={`text-md font-bold px-5 py-2 rounded-lg transition-colors duration-200 min-w-max whitespace-nowrap ${
          activeFilter === null ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
        onClick={() => onSelect(null)}
      >
        All ({approvedUsers.length})
      </button>
      {[...filters]
        .sort((a, b) => a.localeCompare(b))
        .map((filter) => {
          // Count users for this tab, mapping 'Delegate' back to 'Assistant' for counting
          const count = approvedUsers.filter((u) =>
            filter === "Delegate" ? u.role === "Assistant" : u.role === filter
          ).length;
          return (
            <button
              key={filter}
              className={`text-md font-bold px-5 py-2 rounded-lg transition-colors duration-200 min-w-max whitespace-nowrap ${
                activeFilter === filter
                  ? "bg-blue-600 text-white shadow"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => onSelect(filter)}
            >
              {filter} ({count})
            </button>
          );
        })}
    </div>
  );

  // When user clicks a tab, update the activeTab
  const handleTabSelect = (selectedRole) => {
    setActiveTab(selectedRole);
    setActiveFilters([]); // Optionally clear filters when switching tabs
  };

  const handleManageClick = (value) => {
    const user = approvedUsers.filter((user) => user.user_id === value);
    setActiveUser(user[0]);
  };

  const handleImpersonateClick = async (value) => {
    const user = approvedUsers.find((user) => user.user_id === value);
    if (user) {
      // Log the impersonation action with the impersonated user details
      await logAction(AUDIT_ACTIONS.IMPERSONATE, {
        impersonated_user: {
          user_id: user.user_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
        },
      });

      startManagingUser(user);
      navigate("/faculty/home");
    }
  };

  const searchedUsers = approvedUsers
    .filter((user) => {
      const firstName = user.first_name || "";
      const lastName = user.last_name || "";
      const email = user.email || "";

      const matchesSearch =
        firstName.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
        lastName.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
        email.toLowerCase().startsWith(searchTerm.toLowerCase());

      // Fix: If activeTab is 'Delegate', match users with role 'Assistant'
      const matchesTab = !activeTab || (activeTab === "Delegate" ? user.role === "Assistant" : user.role === activeTab);
      const matchesFilter = activeFilters.length === 0 || !activeFilters.includes(user.role);

      return matchesSearch && matchesTab && matchesFilter;
    })
    .sort((a, b) => {
      const firstNameA = a.first_name.toLowerCase();
      const firstNameB = b.first_name.toLowerCase();
      const lastNameA = a.last_name.toLowerCase();
      const lastNameB = b.last_name.toLowerCase();

      if (firstNameA < firstNameB) return -1;
      if (firstNameA > firstNameB) return 1;
      if (lastNameA < lastNameB) return -1;
      if (lastNameA > lastNameB) return 1;
      return 0;
    });

  const handleBack = () => {
    setActiveUser(null);
  };

  const showModal = (title, message, type = "confirm", onConfirm = null) => {
    setModal({ isOpen: true, title, message, type, onConfirm });
  };

  const closeModal = () => {
    setModal({ isOpen: false, title: "", message: "", type: "confirm", onConfirm: null });
  };

  const handleAddUserSuccess = (result) => {
    console.log("User created successfully");
    // Refresh the users list
    fetchAllUsers();
  };

  const handleRemoveUser = async (userId) => {
    const userToRemove = approvedUsers.find((user) => user.user_id === userId);

    if (!userToRemove) {
      console.error("User not found");
      return;
    }

    // Show confirmation dialog
    showModal(
      "Confirm User Removal",
      `Are you sure you want to remove user "${userToRemove.first_name} ${userToRemove.last_name}" (${userToRemove.email})?\n\nThis action cannot be undone.`,
      "confirm",
      async () => {
        try {
          console.log("Removing user:", userToRemove);

          // Call the removeUser function
          const result = await removeUser(
            userToRemove.user_id,
            userToRemove.email,
            userToRemove.first_name,
            userToRemove.last_name
          );

          // Refresh the users list
          fetchAllUsers();

          // Show success message
          showModal(
            "User Removed Successfully",
            `User ${userToRemove.first_name} ${userToRemove.last_name} has been successfully removed.`,
            "success"
          );
        } catch (error) {
          console.error("Error removing user:", error);
          showModal("Error", "Failed to remove user. Please try again.", "error");
        }
      }
    );
  };

  return (
    <PageContainer>
      <AdminMenu getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} />
      <main className="overflow-auto custom-scrollbar w-full mb-4 px-12 mt-4">
        {loading ? (
          <div className="flex items-center justify-center w-full">
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <div>
            {activeUser === null ? (
              <div className="!overflow-auto !h-full custom-scrollbar">
                <h1 className="text-left mx-4 text-4xl font-bold text-zinc-600">All Members ({approvedUsers.length})</h1>
                <button
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="btn btn-primary ml-4"
                  title="Add New User"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                  Add New User
                </button>
                <button
                  onClick={() => setIsPendingRequestsModalOpen(true)}
                  className="btn btn-primary ml-4"
                  title={`Pending Requests`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Pending Requests ({pendingUsers.length})
                </button>
                <button
                  onClick={() => setIsImportUsersModalOpen(true)}
                  className="btn btn-primary m-4"
                  title={`Import Users`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a1 1 0 011 1v5.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 8.586V3a1 1 0 011-1z" />
                    <path d="M3 14a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                  </svg>
                  Import Users
                </button>
                <div className="m-4 flex">
                  <label className="input input-bordered flex items-center flex-1">
                    <input
                      type="text"
                      className="grow"
                      placeholder="Search"
                      value={searchTerm}
                      onChange={handleSearchChange}
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
                </div>
                <UserTabs filters={filters} activeFilter={activeTab} onSelect={handleTabSelect} />
                {/* Optionally keep Filters below if you want both */}
                {/* <Filters activeFilters={activeFilters} onFilterChange={setActiveFilters} filters={filters}></Filters> */}
                {searchedUsers.length === 0 ? (
                  <div className="flex items-center justify-center w-full">
                    <div className="block text-m mb-1 mt-6 text-zinc-600">No Users Found</div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 mx-4 overflow-auto max-h-[55vh]">
                    <table className="w-full table-fixed min-w-[750px] md:overflow-x-auto">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide w-1/3 md:w-1/4 lg:w-1/5">
                            User
                          </th>
                          <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wide w-1/6">
                            Role
                          </th>
                          <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wide w-1/6">
                            Primary Rank
                          </th>
                          <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wide w-1/6">
                            Joint Rank
                          </th>
                          <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wide w-1/6">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {searchedUsers.map((user, index) => (
                          <tr
                            key={user.user_id}
                            className={`transition-colors duration-150 hover:bg-blue-50/50 ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                            }`}
                          >
                            <td className="px-4 py-5 w-1/3 md:w-1/4 lg:w-1/5">
                              <div className="flex flex-col min-w-0 break-words">
                                <div className="text-sm font-semibold text-gray-900 mb-1 truncate">
                                  {user.first_name} {user.last_name}
                                </div>
                                <div className="text-sm text-gray-500 truncate">{user.email}</div>
                              </div>
                            </td>
                            <td className="px-4 py-5 text-center w-1/6">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                {user.role === "Assistant" ? "Delegate" : user.role}
                              </span>
                            </td>
                            <td className="px-4 py-5 text-center w-1/6">
                              <span className="text-sm font-medium text-gray-700">
                                {getPrimaryRank(user.user_id) ? (
                                  getPrimaryRank(user.user_id)
                                ) : (
                                  <span className="text-gray-400 italic">Not specified</span>
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-5 text-center w-1/6">
                              <span className="text-sm font-medium text-gray-700">
                                {getJointRanks(user.user_id) ? (
                                  getJointRanks(user.user_id)
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-5 w-1/6">
                              <div className="grid grid-cols-1 xl:grid-cols-3 justify-center gap-2 items-stretch w-full">
                                <button
                                  onClick={() => handleImpersonateClick(user.user_id)}
                                  className="btn btn-accent btn-sm min-w-full text-xs lg:text-md text-white shadow"
                                >
                                  Impersonate
                                </button>
                                <button
                                  onClick={() => handleManageClick(user.user_id)}
                                  className="btn btn-primary btn-sm text-white min-w-full text-xs lg:text-md"
                                >
                                  Quick Actions
                                </button>
                                <button
                                  onClick={() => handleRemoveUser(user.user_id)}
                                  className="btn btn-error btn-sm text-white min-w-full text-xs lg:text-md"
                                >
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="!overflow-auto !h-full custom-scrollbar">
                <ManageUser user={activeUser} onBack={handleBack} fetchAllUsers={fetchAllUsers}></ManageUser>
              </div>
            )}
          </div>
        )}
      </main>

      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSuccess={handleAddUserSuccess}
      />

      <ImportUserModal
        isOpen={isImportUsersModalOpen}
        onClose={() => setIsImportUsersModalOpen(false)}
        onSuccess={handleAddUserSuccess}
      />

      <PendingRequestsModal
        isOpen={isPendingRequestsModalOpen}
        pendingUsers={pendingUsers}
        setPendingUsers={setPendingUsers}
        rejectedUsers={rejectedUsers}
        setRejectedUsers={setRejectedUsers}
        refreshUsers={fetchAllUsers}
        onClose={() => setIsPendingRequestsModalOpen(false)}
      />

      <ConfirmModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={modal.onConfirm}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </PageContainer>
  );
};

export default AdminUsers;
