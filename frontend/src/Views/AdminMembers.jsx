import { React, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../Contexts/AppContext.jsx";
import { useAdmin } from "../Contexts/AdminContext.jsx";
import { useAuditLogger, AUDIT_ACTIONS } from "../Contexts/AuditLoggerContext.jsx";
import { updateUserActiveStatus } from "../graphql/graphqlHelpers.js";
import PageContainer from "./PageContainer.jsx";
import AdminMenu from "../Components/AdminMenu.jsx";
import DepartmentAdminMenu from "../Components/DepartmentAdminMenu.jsx";
import ManageUser from "../Components/ManageUser.jsx";
import AddUserModal from "../Components/AddUserModal.jsx";
import ImportUserModal from "../Components/ImportUserModal.jsx";
import PendingRequestsModal from "../Components/PendingRequestsModal.jsx";
import { ConfirmModal, DeactivatedUsersModal, TerminatedUsersModal } from "../Components/AdminUsersModals.jsx";
import AdminUserTabs from "Components/AdminUserTabs.jsx";
import AdminUsersTable from "Components/AdminUsersTable.jsx";

/**
 * Unified Admin Users Component
 * Handles both full Admin and Department Admin views
 *
 * @param {Object} userInfo - Current user information
 * @param {Function} getCognitoUser - Function to get Cognito user
 * @param {string} viewMode - 'admin' or 'department-admin' to determine which view/menu to show
 * @param {string} department - Department name (used for department admin filtering)
 * @param {Function} toggleViewMode - Function to toggle between view modes (department admin only)
 * @param {string} currentViewRole - Override role for department admins viewing as different role
 */
const AdminUsers = ({ userInfo, getCognitoUser, viewMode = "admin", department, toggleViewMode, currentViewRole }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [deactivatedUsers, setDeactivatedUsers] = useState([]);
  const [terminatedUsers, setTerminatedUsers] = useState([]);
  const [affiliations, setAffiliations] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [rejectedUsers, setRejectedUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const params = useParams();
  const [activeTab, setActiveTab] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isPendingRequestsModalOpen, setIsPendingRequestsModalOpen] = useState(false);
  const [isImportUsersModalOpen, setIsImportUsersModalOpen] = useState(false);
  const [isDeactivatedUsersModalOpen, setIsDeactivatedUsersModalOpen] = useState(false);
  const [isTerminatedUsersModalOpen, setIsTerminatedUsersModalOpen] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "confirm", onConfirm: null });
  const { startManagingUser } = useApp();
  const navigate = useNavigate();

  // Determine if this is admin view (full admin with add/import/pending features)
  const isAdminView = viewMode === "admin";
  const isDepartmentAdminView = viewMode === "department-admin";

  const { logAction } = useAuditLogger();
  const { isLoading, setIsLoading, allUsers, departmentAffiliations, fetchAllUsers } = useAdmin();

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    setUsers(allUsers);
  }, [allUsers]);

  useEffect(() => {
    // Only filter users if we actually have users loaded
    if (users.length > 0) {
      filterAllUsers();
    }
  }, [users]);

  useEffect(() => {
    setAffiliations(departmentAffiliations);
  }, [departmentAffiliations]);

  // Ensure activeUser is set when approvedUsers or params.userId changes (for routing)
  useEffect(() => {
    if (params.userId && approvedUsers.length > 0) {
      const foundUser = approvedUsers.find((user) => user.user_id === params.userId);
      if (foundUser) {
        setActiveUser(foundUser);
      } else {
        setActiveUser(null);
      }
    }
  }, [approvedUsers, params.userId]);

  async function filterAllUsers() {
    setLoading(true);
    try {
      // Determine the role to check based on view mode
      const roleToCheck = isDepartmentAdminView ? currentViewRole || userInfo.role : userInfo.role;

      // For admin view, handle pending/rejected users
      if (isAdminView) {
        const pendingUsersList = [];
        const approvedUsersList = [];
        const rejectedUsersList = [];
        const deactivatedUsersList = [];
        const terminatedUsersList = [];

        users.forEach((user) => {
          if (user.terminated === true && user.active === false) {
            terminatedUsersList.push(user);
          } else if (user.pending === true && user.approved === false) {
            pendingUsersList.push(user);
          } else if (user.pending === false && user.approved === false) {
            rejectedUsersList.push(user);
          } else if (user.pending === false && user.approved === true) {
            // Filter based on active field
            if (user.active === true && user.terminated === false) {
              approvedUsersList.push(user);
            } else {
              deactivatedUsersList.push(user);
            }
          }
        });

        setApprovedUsers(approvedUsersList);
        setPendingUsers(pendingUsersList);
        setRejectedUsers(rejectedUsersList);
        setDeactivatedUsers(deactivatedUsersList);
        setTerminatedUsers(terminatedUsersList);
      }
      // For department admin view, filter by role and department
      else if (isDepartmentAdminView) {
        let allFilteredUsers;

        if (roleToCheck === "Admin" || roleToCheck === "Admin-All") {
          // Regular Admin sees all approved users except other Admins
          allFilteredUsers = users.filter(
            (user) => user.role !== "Admin" && user.pending === false && user.approved === true
          );
        } else if (roleToCheck && roleToCheck.startsWith("Admin-")) {
          // Department admin sees only their department users
          const deptFromRole = roleToCheck.replace("Admin-", "");
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
        const deactivatedUsersList = allFilteredUsers.filter((user) => user.active === false && !user.terminated);

        // Filter terminated users
        const terminatedUsersList = allFilteredUsers.filter((user) => user.terminated === true);

        setApprovedUsers(approvedActiveUsers);
        setDeactivatedUsers(deactivatedUsersList);
        setTerminatedUsers(terminatedUsersList);
        setPendingUsers([]); // Department admins don't see pending users
        setRejectedUsers([]); // Department admins don't see rejected users
      }
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

  // All unique roles for tabs and filters
  // Admin view shows all roles, Department admin view excludes Admin role
  const filters = Array.from(
    new Set(approvedUsers.map((user) => (user.role === "Assistant" ? "Delegate" : user.role)))
  ).filter((role) => (isDepartmentAdminView ? role !== "Admin" : true));

  // Tab bar for roles (copied and adapted from DepartmentAdminUsers)
  // When user clicks a tab, update the activeTab
  const handleTabSelect = (selectedRole) => {
    setActiveTab(selectedRole);
  };

  const handleManageClick = (value) => {
    const user = approvedUsers.filter((user) => user.user_id === value);
    setActiveUser(user[0]);

    // Navigate to actions page for both admin and department admin
    if (isDepartmentAdminView) {
      navigate(`/department-admin/members/${value}/actions`);
    } else {
      navigate(`/admin/users/${value}/actions`);
    }
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
      const fullName = `${firstName} ${lastName}`.toLowerCase();

      const matchesSearch =
        firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fullName.includes(searchTerm.toLowerCase());

      // Fix: If activeTab is 'Delegate', match users with role 'Assistant'
      const matchesTab = !activeTab || (activeTab === "Delegate" ? user.role === "Assistant" : user.role === activeTab);
      const matchesDepartment = !departmentFilter || user.primary_department === departmentFilter;

      return matchesSearch && matchesTab && matchesDepartment;
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

    // Navigate back to the appropriate list view
    if (isDepartmentAdminView) {
      navigate("/department-admin/members");
    } else {
      navigate("/admin/users");
    }
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

  const handleDepartmentFilterChange = (event) => {
    setDepartmentFilter(event.target.value);
  };

  // Get unique departments for active users based on role
  let activeDepartments = [];
  let allowedDepartments = [];

  const roleToCheck = isDepartmentAdminView ? currentViewRole || userInfo.role : userInfo.role;

  if (isAdminView || roleToCheck === "Admin" || roleToCheck === "Admin-All") {
    // Admin views can see all departments
    activeDepartments = Array.from(
      new Set(approvedUsers.map((user) => user.primary_department).filter(Boolean))
    ).sort();
    allowedDepartments = activeDepartments;
  } else if (roleToCheck && roleToCheck.startsWith("Admin-")) {
    // Department admin can only see their specific department
    const deptFromRole = roleToCheck.replace("Admin-", "");
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

  // Early loading return for initial load
  if (loading && users.length === 0) {
    return (
      <PageContainer>
        {isAdminView ? (
          <AdminMenu getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} />
        ) : (
          <DepartmentAdminMenu
            getCognitoUser={getCognitoUser}
            userName={userInfo.preferred_name || userInfo.first_name}
            toggleViewMode={toggleViewMode}
            viewMode="department-admin"
          />
        )}
        <main
          className={
            isAdminView
              ? "overflow-auto custom-scrollbar w-full mb-4 px-12 mt-4"
              : "px-16 overflow-auto custom-scrollbar w-full mb-4 mt-4"
          }
        >
          <div className="flex items-center justify-center w-full min-h-screen">
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        </main>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {isAdminView ? (
        <AdminMenu getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} />
      ) : (
        <DepartmentAdminMenu
          getCognitoUser={getCognitoUser}
          userName={userInfo.preferred_name || userInfo.first_name}
          toggleViewMode={toggleViewMode}
          viewMode="department-admin"
        />
      )}
      <main
        className={
          isAdminView
            ? "overflow-auto custom-scrollbar w-full mb-4 px-12 mt-4"
            : "px-12 overflow-auto custom-scrollbar w-full mb-4 mt-4"
        }
      >
        {loading ? (
          <div className="flex items-center justify-center w-full">
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <div>
            {activeUser === null ? (
              <div className="!overflow-auto !h-full custom-scrollbar">
                <div className="flex flex-col justify-start align-left items-start mb-4">
                  <h1 className="text-left mb-4 mt-2 text-4xl font-bold text-zinc-600 ml-4">
                    Active Members ({approvedUsers.length})
                  </h1>
                  <div className="flex gap-2">
                    {/* Admin-only buttons */}
                    {isAdminView && (
                      <>
                        <button
                          onClick={() => setIsAddUserModalOpen(true)}
                          className="btn btn-primary ml-4"
                          title="Add New User"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                          </svg>
                          Add New User
                        </button>
                        <button
                          onClick={() => setIsPendingRequestsModalOpen(true)}
                          className="btn btn-primary ml-2"
                          title={`Pending Requests`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
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
                          className="btn btn-primary ml-2"
                          title={`Import Users`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M10 2a1 1 0 011 1v5.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 8.586V3a1 1 0 011-1z" />
                            <path d="M3 14a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                          </svg>
                          Import Users
                        </button>
                      </>
                    )}

                    {/* Common buttons for both Admin + Dept. Admins */}
                    <button
                      onClick={() => setIsDeactivatedUsersModalOpen(true)}
                      className={`btn btn-secondary ${isAdminView ? "ml-2" : "ml-4"}`}
                      title="View Inactive Members"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
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
                      className={`btn btn-secondary ml-2`}
                      title="View Terminated Members"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
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

                {/* Filter and Search*/}
                <div className={`${isAdminView ? "mx-4" : "ml-4"} flex mb-4 gap-2`}>
                  {/* Filter dropdown*/}
                  {(isAdminView ||
                    roleToCheck === "Admin" ||
                    roleToCheck === "Admin-All" ||
                    allowedDepartments.length > 0) && (
                    <select
                      className="select select-bordered min-w-48"
                      value={departmentFilter}
                      onChange={handleDepartmentFilterChange}
                      disabled={
                        isDepartmentAdminView &&
                        roleToCheck &&
                        roleToCheck.startsWith("Admin-") &&
                        roleToCheck !== "Admin-All" &&
                        allowedDepartments.length === 1
                      }
                    >
                      <option value="">
                        {isAdminView || roleToCheck === "Admin" || roleToCheck === "Admin-All"
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
                  {/* Search bar*/}
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

                {loading ? (
                  <div className="flex items-center justify-center w-full">
                    <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
                  </div>
                ) : searchedUsers.length === 0 ? (
                  <div className="flex items-center justify-center w-full">
                    <div className="block text-m mb-1 mt-6 text-zinc-600">No Users Found</div>
                  </div>
                ) : (
                  <AdminUsersTable
                    searchedUsers={searchedUsers}
                    getPrimaryRank={getPrimaryRank}
                    handleImpersonateClick={handleImpersonateClick}
                    handleManageClick={handleManageClick}
                    handleRemoveUser={handleRemoveUser}
                  />
                )}
              </div>
            ) : (
              <div className="!overflow-auto !h-full custom-scrollbar">
                <ManageUser
                  user={activeUser}
                  onBack={handleBack}
                  fetchAllUsers={fetchAllUsers}
                  department={isDepartmentAdminView ? department : undefined}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Admin-only modals */}
      {isAdminView && (
        <>
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
        </>
      )}

      {/* Common modals for both views */}
      <DeactivatedUsersModal
        isOpen={isDeactivatedUsersModalOpen}
        onClose={() => setIsDeactivatedUsersModalOpen(false)}
        deactivatedUsers={deactivatedUsers}
        fetchAllUsers={fetchAllUsers}
        showModal={showModal}
        userRole={isDepartmentAdminView ? currentViewRole || userInfo.role : userInfo.role}
      />

      <TerminatedUsersModal
        isOpen={isTerminatedUsersModalOpen}
        onClose={() => setIsTerminatedUsersModalOpen(false)}
        terminatedUsers={terminatedUsers}
        getPrimaryRank={getPrimaryRank}
        userRole={isDepartmentAdminView ? currentViewRole || userInfo.role : userInfo.role}
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
