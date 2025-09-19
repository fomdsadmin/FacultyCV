import React from "react";
import { useState, useEffect } from "react";
import { useApp } from "../Contexts/AppContext.jsx";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import PageContainer from "./PageContainer.jsx";
import DepartmentAdminMenu from "../Components/DepartmentAdminMenu.jsx";
import ManageUser from "Components/ManageUser.jsx";
import { useAuditLogger, AUDIT_ACTIONS } from "Contexts/AuditLoggerContext.jsx";
import { useAdmin } from "../Contexts/AdminContext.jsx";
import { updateUserActiveStatus } from "../graphql/graphqlHelpers.js";
import { ConfirmModal, DeactivatedUsersModal, TerminatedUsersModal } from "../Components/AdminUsersModals.jsx";
import AdminUserTabs from "Components/AdminUserTabs.jsx";

const DepartmentAdminMembers = ({ userInfo, getCognitoUser, department, toggleViewMode }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [deactivatedUsers, setDeactivatedUsers] = useState([]);
  const [terminatedUsers, setTerminatedUsers] = useState([]);
  const [affiliations, setAffiliations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const params = useParams();
  const [activeFilters, setActiveFilters] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deactivatedSearchTerm, setDeactivatedSearchTerm] = useState("");
  const [terminatedSearchTerm, setTerminatedSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [deactivatedDepartmentFilter, setDeactivatedDepartmentFilter] = useState("");
  const [terminatedDepartmentFilter, setTerminatedDepartmentFilter] = useState("");
  const [isDeactivatedUsersModalOpen, setIsDeactivatedUsersModalOpen] = useState(false);
  const [isTerminatedUsersModalOpen, setIsTerminatedUsersModalOpen] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "confirm", onConfirm: null });
  const { startManagingUser } = useApp();
  const navigate = useNavigate();
  const { logAction } = useAuditLogger();
  const { allUsers, departmentAffiliations, isLoading: adminLoading, fetchAllUsers } = useAdmin();

  useEffect(() => {
    setLoading(adminLoading);
  }, [adminLoading]);

  // Helper functions for base64 encoding/decoding
  const encodeId = (id) => {
    try {
      return btoa(id);
    } catch {
      return id;
    }
  };
  const decodeId = (encoded) => {
    try {
      return atob(encoded);
    } catch {
      return encoded;
    }
  };

  useEffect(() => {
    setUsers(allUsers);
  }, [allUsers]);

  useEffect(() => {
    setAffiliations(departmentAffiliations);
  }, [departmentAffiliations]);

  useEffect(() => {
    // Only filter users if we actually have users loaded
    if (users.length > 0) {
      filterAllUsers();
    }
  }, [users, userInfo]);

  // Ensure activeUser is set when approvedUsers or params.userId changes
  useEffect(() => {
    if (params.userId && approvedUsers.length > 0) {
      const decodedId = decodeId(params.userId);
      const foundUser = approvedUsers.find((user) => user.user_id === decodedId);
      if (foundUser) {
        setActiveUser(foundUser);
      } else {
        setActiveUser(null);
      }
    } else {
      setActiveUser(null);
    }
  }, [approvedUsers, params.userId]);

  async function filterAllUsers() {
    try {
      let allFilteredUsers;
      setLoading(true);

      // Handle role-based filtering
      if (userInfo.role === "Admin") {
        // Regular Admin sees all approved users except other Admins
        allFilteredUsers = users.filter(
          (user) => user.role !== "Admin" && user.pending === false && user.approved === true
        );
      } else if (userInfo.role === "Admin-All") {
        // Admin-All sees all approved users except other Admins (same as regular Admin)
        allFilteredUsers = users.filter(
          (user) => user.role !== "Admin" && user.pending === false && user.approved === true
        );
      } else if (userInfo.role && userInfo.role.startsWith("Admin-")) {
        // Department admin sees only their department users
        const deptFromRole = userInfo.role.replace("Admin-", "");
        allFilteredUsers = users.filter(
          (user) =>
            user.primary_department === deptFromRole &&
            user.role !== "Admin" &&
            user.pending === false &&
            user.approved === true
        );
      } else {
        // Fallback to department parameter for backward compatibility
        if (department === "All") {
          allFilteredUsers = users.filter(
            (user) => user.role !== "Admin" && user.pending === false && user.approved === true
          );
        } else {
          allFilteredUsers = users.filter(
            (user) =>
              user.primary_department === department &&
              user.role !== "Admin" &&
              user.pending === false &&
              user.approved === true
          );
        }
      }

      // Filter approved users to only show active ones (not terminated)
      const approvedActiveUsers = allFilteredUsers.filter((user) => user.active === true && user.terminated !== true);

      // Filter deactivated users (inactive but not terminated)
      const deactivatedUsersList = allFilteredUsers.filter((user) => user.active === false && user.terminated !== true);

      // Filter terminated users
      const terminatedUsersList = allFilteredUsers.filter((user) => user.terminated === true);

      console.log("fetchAllUsers Debug:", {
        userRole: userInfo.role,
        totalUsers: users.length,
        allFilteredUsers: allFilteredUsers.length,
        approvedActiveUsers: approvedActiveUsers.length,
        deactivatedUsers: deactivatedUsersList.length,
        terminatedUsers: terminatedUsersList.length,
        sampleUsers: allFilteredUsers.slice(0, 3).map((u) => ({
          name: `${u.first_name} ${u.last_name}`,
          role: u.role,
          dept: u.primary_department,
          pending: u.pending,
          approved: u.approved,
          active: u.active,
          terminated: u.terminated,
        })),
      });

      setFilteredUsers(allFilteredUsers);
      setApprovedUsers(approvedActiveUsers);
      setDeactivatedUsers(deactivatedUsersList);
      setTerminatedUsers(terminatedUsersList);
    } catch (error) {
      console.error(error);
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
        // Parse the primary_unit string to JSON array
        const primaryUnits =
          typeof userAffiliation.primary_unit === "string"
            ? JSON.parse(userAffiliation.primary_unit)
            : userAffiliation.primary_unit;

        // Handle array of primary units - return first one's rank if available
        if (Array.isArray(primaryUnits) && primaryUnits.length > 0 && primaryUnits[0].rank) {
          return primaryUnits[0].rank;
        }
      } catch (error) {
        console.error("Error parsing primary_unit JSON:", error, userAffiliation.primary_unit);
      }
    }

    return null;
  };

  // Function to get secondary ranks for a user from affiliations data
  const getSecondaryRanks = (userId) => {
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

  // All unique roles for tabs and filters (excluding Admin)
  const filters = Array.from(
    new Set(approvedUsers.map((user) => (user.role === "Assistant" ? "Delegate" : user.role)))
  ).filter((role) => role !== "Admin");

  // Using the extracted AdminUserTabs component

  // When user clicks a tab, update the activeTab
  const handleTabSelect = (selectedRole) => {
    setActiveTab(selectedRole);
    setActiveFilters([]); // Optionally clear filters when switching tabs
  };

  const searchedUsers = approvedUsers
    .filter((user) => {
      const firstName = user.first_name || "";
      const lastName = user.last_name || "";
      const email = user.email || "";
      const fullName = `${firstName} ${lastName}`.toLowerCase();

      const matchesSearch =
        firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fullName.includes(searchTerm.toLowerCase());

      // Fix: If activeTab is 'Delegate', match users with role 'Assistant'
      const matchesTab = !activeTab || (activeTab === "Delegate" ? user.role === "Assistant" : user.role === activeTab);
      const matchesFilter = activeFilters.length === 0 || !activeFilters.includes(user.role);
      const matchesDepartment = !departmentFilter || user.primary_department === departmentFilter;

      return matchesSearch && matchesTab && matchesFilter && matchesDepartment;
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

  const handleManageClick = (value) => {
    const user = approvedUsers.filter((user) => user.user_id === value);
    setActiveUser(user[0]);
    const encodedId = encodeId(value);
    navigate(`/department-admin/members/${encodedId}/actions`);
  };

  const handleImpersonateClick = async (value) => {
    const user = approvedUsers.find((user) => user.user_id === value);

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

    if (user) {
      startManagingUser(user);
      navigate("/faculty/home");
    }
  };

  const handleBack = () => {
    setActiveUser(null);
    navigate("/department-admin/members");
  };

  const showModal = (title, message, type = "confirm", onConfirm = null) => {
    setModal({ isOpen: true, title, message, type, onConfirm });
  };

  const closeModal = () => {
    setModal({ isOpen: false, title: "", message: "", type: "confirm", onConfirm: null });
  };

  const handleRemoveUser = async (userId) => {
    const userToRemove = approvedUsers.find((user) => user.user_id === userId);

    if (!userToRemove) {
      console.error("User not found");
      return;
    }

    // Show confirmation dialog
    showModal(
      "Confirm User Deactivation",
      `Are you sure you want to deactivate user \n"${userToRemove.first_name} ${userToRemove.last_name}"?\n\nDeactivated users can be reactivated later.`,
      "confirm",
      async () => {
        try {
          console.log("Deactivating user:", userToRemove);

          // Call the updateUserActiveStatus function to set active: false
          const result = await updateUserActiveStatus(userToRemove.user_id, false);

          // Refresh the users list
          fetchAllUsers();

          // Show success message
          showModal(
            "User Deactivated Successfully",
            `User ${userToRemove.first_name} ${userToRemove.last_name} has been successfully deactivated.`,
            "success"
          );
        } catch (error) {
          console.error("Error deactivating user:", error);
          showModal("Error", "Failed to deactivate user. Please try again.", "error");
        }
      }
    );
  };

  const handleReactivateUser = async (userId) => {
    const userToReactivate = deactivatedUsers.find((user) => user.user_id === userId);

    if (!userToReactivate) {
      console.error("User not found");
      return;
    }

    // Show confirmation dialog
    showModal(
      "Confirm User Activation",
      `Are you sure you want to activate user: \n \n '${userToReactivate.first_name} ${userToReactivate.last_name}'`,
      "confirm",
      async () => {
        try {
          console.log("Reactivating user:", userToReactivate);

          // Call updateUserActiveStatus to set active: true
          const result = await updateUserActiveStatus(userToReactivate.user_id, true);

          // Refresh the users list
          fetchAllUsers();

          // Show success message
          showModal(
            "User Activated Successfully",
            `User ${userToReactivate.first_name} ${userToReactivate.last_name} has been successfully activated.`,
            "success"
          );
        } catch (error) {
          console.error("Error reactivating user:", error);
          showModal("Error", "Failed to reactivate user. Please try again.", "error");
        }
      }
    );
  };

  const handleActivateAll = (user_ids) => {
    const userCount = user_ids.length;

    // Show confirmation dialog
    showModal(
      "Confirm Bulk User Activation",
      `Are you sure you want to activate all ${userCount} filtered users?`,
      "confirm",
      async () => {
        try {
          console.log("Activating multiple users:", user_ids);

          // Call updateUserActiveStatus with array of user_ids
          const result = await updateUserActiveStatus(user_ids, true);

          // Refresh the users list
          fetchAllUsers();

          // Show success message
          showModal("Users Activated Successfully", `${userCount} users have been successfully activated.`, "success");
        } catch (error) {
          console.error("Error activating users:", error);
          showModal("Error", "Failed to activate users. Please try again.", "error");
        }
      }
    );
  };

  const handleDeactivatedSearchChange = (event) => {
    setDeactivatedSearchTerm(event.target.value);
  };

  const handleDepartmentFilterChange = (event) => {
    setDepartmentFilter(event.target.value);
  };

  const handleDeactivatedDepartmentFilterChange = (event) => {
    setDeactivatedDepartmentFilter(event.target.value);
  };

  const handleTerminatedSearchChange = (event) => {
    setTerminatedSearchTerm(event.target.value);
  };

  const handleTerminatedDepartmentFilterChange = (event) => {
    setTerminatedDepartmentFilter(event.target.value);
  };

  // Get unique departments for active users based on role
  let activeDepartments = [];
  let allowedDepartments = [];

  if (userInfo.role === "Admin" || userInfo.role === "Admin-All") {
    // Admin and Admin-All can see all departments
    activeDepartments = Array.from(
      new Set(approvedUsers.map((user) => user.primary_department).filter(Boolean))
    ).sort();
    allowedDepartments = activeDepartments;
  } else if (userInfo.role && userInfo.role.startsWith("Admin-")) {
    // Department admin can only see their specific department
    const deptFromRole = userInfo.role.replace("Admin-", "");
    activeDepartments = Array.from(
      new Set(approvedUsers.map((user) => user.primary_department).filter(Boolean))
    ).sort();
    allowedDepartments = activeDepartments.filter((dept) => dept === deptFromRole);

    // Auto-set department filter if they only have access to one department
    if (allowedDepartments.length === 1 && departmentFilter === "") {
      setDepartmentFilter(allowedDepartments[0]);
    }
  } else {
    activeDepartments = Array.from(
      new Set(approvedUsers.map((user) => user.primary_department).filter(Boolean))
    ).sort();
    allowedDepartments = activeDepartments;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full min-h-screen">
        <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
      </div>
    );
  }

  return (
    <PageContainer>
      <DepartmentAdminMenu
        userInfo
        getCognitoUser={getCognitoUser}
        userName={userInfo.preferred_name || userInfo.first_name}
        toggleViewMode={toggleViewMode}
        viewMode="department-admin"
      />
      <main className="px-16 overflow-auto custom-scrollbar w-full mb-4 mt-4">
        <div>
          {activeUser === null ? (
            <div className="!overflow-auto !h-full custom-scrollbar">
              <div className="flex flex-col justify-start align-left items-start mx-4 mb-4">
                <h1 className="text-left my-4 text-4xl font-bold text-zinc-600">
                  Active Members ({approvedUsers.length})
                </h1>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsDeactivatedUsersModalOpen(true)}
                    className="btn btn-secondary"
                    title="View Inactive Members"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Inactive Members ({deactivatedUsers.length})
                  </button>

                  <button
                    onClick={() => setIsTerminatedUsersModalOpen(true)}
                    className="btn btn-secondary"
                    title="View Terminated Members"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Terminated Members ({terminatedUsers.length})
                  </button>
                </div>
              </div>
              <div className="ml-4 flex mb-4 gap-2">
                {(userInfo.role === "Admin" || userInfo.role === "Admin-All" || allowedDepartments.length > 0) && (
                  <select
                    className="select select-bordered min-w-48"
                    value={departmentFilter}
                    onChange={handleDepartmentFilterChange}
                    disabled={
                      userInfo.role &&
                      userInfo.role.startsWith("Admin-") &&
                      userInfo.role !== "Admin-All" &&
                      allowedDepartments.length === 1
                    }
                  >
                    <option value="">
                      {userInfo.role === "Admin" || userInfo.role === "Admin-All"
                        ? `All Departments (${approvedUsers.length})`
                        : `${allowedDepartments[0] || "Department"} (${approvedUsers.length})`}
                    </option>
                    {allowedDepartments.map((dept) => {
                      const deptCount = approvedUsers.filter((user) => user.primary_department === dept).length;
                      return (
                        <option key={dept} value={dept}>
                          {dept} ({deptCount})
                        </option>
                      );
                    })}
                  </select>
                )}
                <label className="input input-bordered flex items-center flex-1">
                  <input
                    type="text"
                    className="grow"
                    placeholder="Search members..."
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
              <AdminUserTabs
                filters={filters}
                activeFilter={activeTab}
                onSelect={handleTabSelect}
                users={approvedUsers}
                searchTerm={searchTerm}
                departmentFilter={departmentFilter}
              />
              {/* Optionally keep Filters below if you want both */}
              {/* <Filters activeFilters={activeFilters} onFilterChange={setActiveFilters} filters={filters}></Filters> */}
              {loading ? (
                <div className="flex items-center justify-center w-full">
                  <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
                </div>
              ) : searchedUsers.length === 0 && !loading ? (
                <div className="flex items-center justify-center w-full">
                  <div className="block text-m mb-1 mt-6 text-zinc-600">No Users Found</div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 mx-4 overflow-auto max-h-[60vh]">
                  <table className="w-full table-fixed min-w-[750px] md:overflow-x-auto">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide w-1/4">
                          User
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wide w-1/6">
                          Role
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wide w-1/6">
                          Department
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wide w-1/6">
                          CWL
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wide w-1/6">
                          Primary Rank
                        </th>
                        <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wide w-1/4">
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
                          <td className="px-4 py-5 w-1/4">
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
                              {user.primary_department ? (
                                user.primary_department
                              ) : (
                                <span className="text-gray-400 italic">Not specified</span>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-5 text-center w-1/6">
                            <span className="text-sm font-medium text-gray-700">
                              {user.cwl_username ? (
                                user.cwl_username
                              ) : (
                                <span className="text-gray-400 italic">Not specified</span>
                              )}
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
                          <td className="px-4 py-5 w-1/4">
                            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row justify-center gap-2 items-stretch w-full">
                              <button
                                onClick={() => handleImpersonateClick(user.user_id)}
                                className="btn btn-accent btn-sm text-white text-xs whitespace-nowrap"
                              >
                                Impersonate
                              </button>
                              <button
                                onClick={() => handleManageClick(user.user_id)}
                                className="btn btn-primary btn-sm text-white text-xs whitespace-nowrap"
                              >
                                Quick Actions
                              </button>
                              <button
                                onClick={() => handleRemoveUser(user.user_id)}
                                className="btn btn-warning btn-sm text-white text-xs whitespace-nowrap"
                              >
                                Deactivate
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
              <ManageUser
                user={activeUser}
                onBack={handleBack}
                fetchAllUsers={fetchAllUsers}
                department={department}
              ></ManageUser>
            </div>
          )}
        </div>
      </main>

      <DeactivatedUsersModal
        isOpen={isDeactivatedUsersModalOpen}
        onClose={() => setIsDeactivatedUsersModalOpen(false)}
        deactivatedUsers={deactivatedUsers}
        searchTerm={deactivatedSearchTerm}
        onSearchChange={handleDeactivatedSearchChange}
        departmentFilter={deactivatedDepartmentFilter}
        onDepartmentChange={handleDeactivatedDepartmentFilterChange}
        onReactivateUser={handleReactivateUser}
        onActivateAll={handleActivateAll}
        userRole={userInfo.role}
      />

      <TerminatedUsersModal
        isOpen={isTerminatedUsersModalOpen}
        onClose={() => setIsTerminatedUsersModalOpen(false)}
        terminatedUsers={terminatedUsers}
        searchTerm={terminatedSearchTerm}
        onSearchChange={handleTerminatedSearchChange}
        departmentFilter={terminatedDepartmentFilter}
        onDepartmentChange={handleTerminatedDepartmentFilterChange}
        getPrimaryRank={getPrimaryRank}
        getJointRanks={getSecondaryRanks}
        userRole={userInfo.role}
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

export default DepartmentAdminMembers;
