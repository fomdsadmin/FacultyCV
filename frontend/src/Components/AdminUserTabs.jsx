import React from "react";

const AdminUserTabs = ({ filters, activeFilter, onSelect, users }) => {
  return (
    <div className="flex flex-wrap gap-4 mb-4 px-4 max-w-full">
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
          // Count users for this tab, mapping 'Delegate' back to 'Assistant' for counting
          const count = users.filter((u) =>
            filter === "Delegate" ? u.role === "Assistant" : u.role === filter
          ).length;
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
