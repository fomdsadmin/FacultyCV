import React from "react";

const AdminUserTabs = ({ filters, activeFilter, onSelect, users, searchTerm = "", departmentFilter = "" }) => {
  // Function to filter users based on search and department filter
  const getFilteredUsers = (roleFilter = null) => {
    return users.filter((user) => {
      const firstName = user.first_name || "";
      const lastName = user.last_name || "";
      const email = user.email || "";
      const fullName = `${firstName} ${lastName}`.toLowerCase();

      const matchesSearch =
        firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fullName.includes(searchTerm.toLowerCase());

      const matchesRole = !roleFilter || (roleFilter === "Delegate" ? user.role === "Assistant" : user.role === roleFilter);
      const matchesDepartment = !departmentFilter || user.primary_department === departmentFilter;

      return matchesSearch && matchesRole && matchesDepartment;
    });
  };

  return (
    <div className="flex flex-wrap gap-4 mb-4 px-4 max-w-full">
      <button
        className={`text-md font-bold px-5 py-2 rounded-lg transition-colors duration-200 min-w-max whitespace-nowrap ${
          activeFilter === null ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
        onClick={() => onSelect(null)}
      >
        All ({getFilteredUsers().length})
      </button>
      {[...filters]
        .sort((a, b) => a.localeCompare(b))
        .map((filter) => {
          // Count users for this tab with proper filtering
          const count = getFilteredUsers(filter).length;
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
};

export default AdminUserTabs;
