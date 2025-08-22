import React from "react";
import { useState, useEffect } from "react";
import { useApp } from "../Contexts/AppContext.jsx";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import PageContainer from "./PageContainer.jsx";
import DepartmentAdminMenu from "../Components/DepartmentAdminMenu.jsx";
import { getAllUsers, getDepartmentAffiliations } from "../graphql/graphqlHelpers.js";
import ManageUser from "Components/ManageUser.jsx";
import { useAuditLogger, AUDIT_ACTIONS } from "Contexts/AuditLoggerContext.jsx";

const DepartmentAdminMembers = ({ userInfo, getCognitoUser, department, toggleViewMode }) => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [affiliations, setAffiliations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const params = useParams();
  const location = useLocation();
  const [activeFilters, setActiveFilters] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { startManagingUser } = useApp();
  const navigate = useNavigate();
  const { logAction } = useAuditLogger();

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
    fetchAllUsers();
  }, [userInfo, department]);

  // Ensure activeUser is set when users or params.userId changes
  useEffect(() => {
    if (params.userId && users.length > 0) {
      const decodedId = decodeId(params.userId);
      const foundUser = users.find((user) => user.user_id === decodedId);
      if (foundUser) {
        setActiveUser(foundUser);
      } else {
        setActiveUser(null);
      }
    } else {
      setActiveUser(null);
    }
  }, [users, params.userId]);

  async function fetchAllUsers() {
    setLoading(true);
    try {
      const [users, affiliationsData] = await Promise.all([getAllUsers(), getDepartmentAffiliations(department)]);

      let filteredUsers;
      if (department === "All") {
        // Show all users except Admin users
        filteredUsers = users.filter((user) => user.role !== "Admin");
      } else {
        filteredUsers = users.filter(
          (user) =>
            (user.primary_department === department ||
              user.secondary_department === department ||
              user.role === `Admin-${department}` ||
              user.role === "Assistant") &&
            user.role !== "Admin"
        );
      }

      setUsers(filteredUsers);
      setAffiliations(affiliationsData);
    } catch (error) {
      console.error(error)
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
  const filters = Array.from(new Set(users.map((user) => user.role))).filter((role) => role !== "Admin");

  // Tab bar for roles (copied and adapted from Sections.jsx)
  const UserTabs = ({ filters, activeFilter, onSelect }) => (
    <div className="flex flex-wrap gap-4 mb-6 px-4 max-w-full">
      <button
        className={`text-md font-bold px-5 py-2 rounded-lg transition-colors duration-200 min-w-max whitespace-nowrap ${
          activeFilter === null ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
        onClick={() => onSelect(null)}
      >
        All ({users.length})
      </button>
      {[...filters]
        .sort((a, b) => a.localeCompare(b))
        .map((filter) => {
          const count = users.filter((u) => u.role === filter).length;
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

  const searchedUsers = users
    .filter((user) => {
      const firstName = user.first_name || "";
      const lastName = user.last_name || "";
      const email = user.email || "";
      const matchesSearch =
        firstName.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
        lastName.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
        email.toLowerCase().startsWith(searchTerm.toLowerCase());

      const matchesTab = !activeTab || user.role === activeTab;
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

  const handleManageClick = (value) => {
    const user = users.filter((user) => user.user_id === value);
    setActiveUser(user[0]);
    const encodedId = encodeId(value);
    navigate(`/department-admin/members/${encodedId}/actions`);
  };

  const handleImpersonateClick = async (value) => {
    const user = users.find((user) => user.user_id === value);

    // Log the impersonation action with the impersonated user details
          await logAction(AUDIT_ACTIONS.IMPERSONATE, {
            impersonated_user: {
              user_id: user.user_id,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              role: user.role
            }
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
        {loading ? (
          <div className="flex items-center justify-center w-full">
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <div>
            {activeUser === null ? (
              <div className="!overflow-auto !h-full custom-scrollbar">
                <h1 className="text-left my-4 text-4xl font-bold text-zinc-600  mx-4">{department} Members</h1>
                <div className="my-4 flex  mx-4">
                  <label className="input input-bordered flex items-center gap-2 flex-1">
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
                    <div className="block text-m mb-1 mt-6 text-zinc-600">No {department} Users Found</div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 mx-4 overflow-auto max-h-[60vh]">
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
                                {user.role}
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
                                {getSecondaryRanks(user.user_id) ? (
                                  getSecondaryRanks(user.user_id)
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-5 w-1/6">
                              <div className="grid grid-cols-1 xl:grid-cols-2 justify-center gap-2 items-stretch w-full">
                                <button
                                  onClick={() => handleImpersonateClick(user.user_id)}
                                  className="btn btn-accent btn-sm text-white min-w-full text-xs lg:text-md"
                                >
                                  Impersonate
                                </button>
                                <button
                                  onClick={() => handleManageClick(user.user_id)}
                                  className="btn btn-primary btn-sm text-white min-w-full text-xs lg:text-md"
                                >
                                  Quick Actions
                                </button>
                                {/* <button className="btn btn-error btn-sm text-white">Remove</button> */}
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
        )}
      </main>
    </PageContainer>
  );
};

export default DepartmentAdminMembers;
