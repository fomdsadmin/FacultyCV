import React from "react";
import { useState, useEffect } from "react";
import PageContainer from "./PageContainer.jsx";
import DepartmentAdminMenu from "../Components/DepartmentAdminMenu.jsx";
import Filters from "../Components/Filters.jsx";
import ManageDepartmentUser from "../Components/ManageDepartmentUser.jsx";
import UserCard from "../Components/UserCard.jsx";
import { getAllUsers } from "../graphql/graphqlHelpers.js";

const DepartmentAdminUsers = ({ userInfo, getCognitoUser, department, toggleViewMode }) => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [activeFilters, setActiveFilters] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAllUsers();
  }, []);

  async function fetchAllUsers() {
    setLoading(true);
    try {
      const users = await getAllUsers();

      let filteredUsers;
      if (department === "All") {
        // Show all users except the current user
        filteredUsers = users.filter((user) => user.email !== userInfo.email);
      } else {
        filteredUsers = users.filter(
          (user) =>
            (user.primary_department === department ||
              user.secondary_department === department ||
              user.role === `Admin-${department}` ||
              user.role === "Assistant")
        );
      }

      setUsers(filteredUsers);
    } catch (error) {}
    setLoading(false);
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // All unique roles for tabs and filters
  const filters = Array.from(new Set(users.map((user) => user.role)));

  // Tab bar for roles (copied and adapted from Sections.jsx)
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
        .map((filter) => (
          <button
            key={filter}
            className={`text-md font-bold px-5 py-2 rounded-lg transition-colors duration-200 min-w-max whitespace-nowrap ${
              activeFilter === filter
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => onSelect(filter)}
          >
            {filter}
          </button>
        ))}
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
  };

  const handleBack = () => {
    setActiveUser(null);
  };

  return (
    <PageContainer>
      <DepartmentAdminMenu
        userInfo
        getCognitoUser={getCognitoUser}
        userName={userInfo.preferred_name || userInfo.first_name}
        toggleViewMode={toggleViewMode}
        viewMode="department-admin"
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
                <h1 className="text-left m-4 text-4xl font-bold text-zinc-600">{department} Users</h1>
                <div className="m-4 flex">
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
                  searchedUsers.map((user) => (
                    <UserCard
                      onClick={handleManageClick}
                      key={user.user_id}
                      id={user.user_id}
                      firstName={user.first_name}
                      lastName={user.last_name}
                      email={user.email}
                      role={user.role}
                    ></UserCard>
                  ))
                )}
              </div>
            ) : (
              <div className="!overflow-auto !h-full custom-scrollbar">
                <ManageDepartmentUser
                  user={activeUser}
                  onBack={handleBack}
                  fetchAllUsers={fetchAllUsers}
                  department={department}
                ></ManageDepartmentUser>
              </div>
            )}
          </div>
        )}
      </main>
    </PageContainer>
  );
};

export default DepartmentAdminUsers;
