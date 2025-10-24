import React, { useState, useEffect } from "react";
import PageContainer from "./PageContainer.jsx";
import FacultyAdminMenu from "../Components/FacultyAdminMenu.jsx";
import ManageUser from "../Components/ManageUser.jsx";
import AddUserModal from "../Components/AddUserModal.jsx";
import { getAllUsers, getDepartmentAffiliations } from "../graphql/graphqlHelpers.js";

const FacultyAdminUsers = ({ userInfo, getCognitoUser, toggleViewMode }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeUser, setActiveUser] = useState(null);
  const [activeFilters, setActiveFilters] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [faculty, setFaculty] = useState("");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [affiliations, setAffiliations] = useState([]);

  // Determine which faculty this admin manages
  useEffect(() => {
    if (userInfo?.role) {
      if (userInfo.role === "Admin") {
        setFaculty("All");
      } else if (userInfo.role.startsWith("FacultyAdmin-")) {
        setFaculty(userInfo.role.split("FacultyAdmin-")[1]);
      }
    }
  }, [userInfo]);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  async function fetchAllUsers() {
    setLoading(true);
    try {
      // Get faculty name for affiliations data
      let facultyName = "All";
      if (userInfo.role === "Admin") {
        facultyName = "All";
      } else if (userInfo.role.startsWith("FacultyAdmin-")) {
        facultyName = userInfo.role.split("FacultyAdmin-")[1];
      }

      const [allUsers, affiliationsData] = await Promise.all([
        getAllUsers(),
        getDepartmentAffiliations(facultyName)
      ]);

      let filteredUsers;
      if (userInfo.role === "Admin") {
        // Admin can see all users except themselves
        filteredUsers = allUsers.filter((user) => user.email !== userInfo.email);
      } else if (userInfo.role.startsWith("FacultyAdmin-")) {
        // FacultyAdmin can only see users in their faculty, excluding themselves
        const facultyName = userInfo.role.split("FacultyAdmin-")[1];
        filteredUsers = allUsers.filter(
          (user) =>
            user.email !== userInfo.email &&
            (user.primary_faculty === facultyName || user.secondary_faculty === facultyName)
        );
      }

      setUsers(filteredUsers);
      setAffiliations(affiliationsData || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }

  // Helper function to get primary rank for a user
  const getPrimaryRank = (userId) => {
    const userAffiliations = affiliations.filter(
      (affiliation) => affiliation.user_id === userId
    );
    
    if (userAffiliations.length === 0) return null;
    
    for (const affiliation of userAffiliations) {
      try {
        let primaryUnit = affiliation.primary_unit;
        
        if (typeof primaryUnit === 'string') {
          primaryUnit = JSON.parse(primaryUnit);
        }
        
        if (primaryUnit && primaryUnit.rank) {
          return primaryUnit.rank;
        }
      } catch (error) {
        console.error('Error parsing primary_unit:', error);
      }
    }
    
    return null;
  };

  // Helper function to get joint ranks for a user
  const getJointRanks = (userId) => {
    const userAffiliations = affiliations.filter(
      (affiliation) => affiliation.user_id === userId
    );
    
    if (userAffiliations.length === 0) return null;
    
    let allJointRanks = [];
    
    for (const affiliation of userAffiliations) {
      try {
        let jointUnits = affiliation.joint_units;
        
        if (typeof jointUnits === 'string') {
          jointUnits = JSON.parse(jointUnits);
        }
        
        if (Array.isArray(jointUnits)) {
          const jointRanks = jointUnits
            .filter(unit => unit && unit.rank)
            .map(unit => unit.rank);
          allJointRanks.push(...jointRanks);
        }
      } catch (error) {
        console.error('Error parsing joint_units:', error);
      }
    }
    
    // Remove duplicates and filter out primary rank if it exists in joint ranks
    const primaryRank = getPrimaryRank(userId);
    const uniqueJointRanks = [...new Set(allJointRanks)].filter(rank => rank !== primaryRank);
    
    return uniqueJointRanks.length > 0 ? uniqueJointRanks.join(', ') : null;
  };

  // All unique roles for tabs and filters
  const filters = Array.from(new Set((users || []).map((user) => user.role === "Assistant" ? "Delegate" : user.role)));

  // Tab bar for roles
  const UserTabs = ({ filters, activeFilter, onSelect }) => (
    <div className="flex flex-wrap gap-4 mb-6 px-4 max-w-full">
      <button
        className={`text-md font-bold px-5 py-2 rounded-lg transition-colors duration-200 min-w-max whitespace-nowrap ${
          activeFilter === null ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
        onClick={() => onSelect(null)}
      >
        All
      </button>
      {[...filters]
        .sort((a, b) => a.localeCompare(b))
        .map((filter) => {
          // Count users for this tab, mapping 'Delegate' back to 'Assistant' for counting
          const count = (users || []).filter(u => (filter === "Delegate" ? u.role === "Assistant" : u.role === filter)).length;
          return (
            <button
              key={filter}
              className={`text-md font-bold px-5 py-2 rounded-lg transition-colors duration-200 min-w-max whitespace-nowrap ${
                activeFilter === filter ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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

  const searchedUsers = (users || [])
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

  const handleManageClick = (value) => {
    const user = (users || []).filter((user) => user.user_id === value);
    setActiveUser(user[0]);
  };

  const handleImpersonateClick = (value) => {
    // TODO
  };

  const handleBack = () => {
    setActiveUser(null);
  };

  const handleAddUserSuccess = () => {
    setIsAddUserModalOpen(false);
    fetchAllUsers(); // Refresh users list
  };

  return (
    <PageContainer>
      <FacultyAdminMenu
        getCognitoUser={getCognitoUser}
        userName={userInfo.preferred_name || userInfo.first_name}
        userInfo={userInfo}
        toggleViewMode={toggleViewMode}
      />
      <main className="px-12 overflow-auto custom-scrollbar w-full mb-4 mt-4">
        {loading ? (
          <div className="flex items-center justify-center w-full">
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <div>
            {activeUser === null ? (
              <div className="!overflow-auto !h-full custom-scrollbar">
                <h1 className="text-left m-4 text-4xl font-bold text-zinc-600">{faculty} Faculty Users</h1>
                <div className="m-4 flex">
                  <label className="input input-bordered flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      className="grow"
                      placeholder="Search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
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
                {/* <div className="m-4 flex justify-end">
                  <button
                    onClick={() => setIsAddUserModalOpen(true)}
                    className="btn btn-primary min-w-max"
                  >
                    Add User
                  </button>
                </div> */}

                <UserTabs filters={filters} activeFilter={activeTab} onSelect={handleTabSelect} />
                {searchedUsers.length === 0 ? (
                  <div className="flex items-center justify-center w-full">
                    <div className="block text-m mb-1 mt-6 text-zinc-600">No {faculty} Faculty Users Found</div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mx-4">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            User
                          </th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Role
                          </th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Primary Rank
                          </th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Joint Rank
                          </th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wide">
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
                            <td className="px-6 py-5">
                              <div className="flex flex-col">
                                <div className="text-sm font-semibold text-gray-900 mb-1">
                                  {user.first_name} {user.last_name}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                {user.role === "Assistant" ? "Delegate" : user.role}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span className="text-sm font-medium text-gray-700">
                                {getPrimaryRank(user.user_id) ? (
                                  getPrimaryRank(user.user_id)
                                ) : (
                                  <span className="text-gray-400 italic">Not specified</span>
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span className="text-sm font-medium text-gray-700">
                                {getJointRanks(user.user_id) ? (
                                  getJointRanks(user.user_id)
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-5">
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
              <ManageUser user={activeUser} fetchAllUsers={fetchAllUsers} onBack={handleBack} />
            )}
          </div>
        )}

        {/* Add User Modal */}
        <AddUserModal
          isOpen={isAddUserModalOpen}
          onClose={() => setIsAddUserModalOpen(false)}
          onSuccess={handleAddUserSuccess}
        />
      </main>
    </PageContainer>
  );
};

export default FacultyAdminUsers;
