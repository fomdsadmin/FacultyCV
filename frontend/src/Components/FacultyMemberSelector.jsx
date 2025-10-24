import React from "react";

const FacultyMemberSelector = ({
  departmentUsers = [],
  selectedUsers = [],
  onUserToggle,
  selectAll = false,
  onSelectAll,
  userSearchTerm = "",
  onUserSearchChange,
  showSelectAll = true,
}) => {
  // Filter users based on search term
  const filteredUsers = departmentUsers
    .filter(user => 
      (user.first_name && user.first_name.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
      (user.last_name && user.last_name.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
      (user.username && user.username.toLowerCase().includes(userSearchTerm.toLowerCase()))
    );

  return (
    <div className="flex-1">
      <label className="block text-sm font-medium text-gray-700 mb-2">Select Faculty Members</label>
      {/* Search and Select All Controls */}
      <div className="space-y-4 mb-4">
        <input
          type="text"
          className="input input-bordered w-full text-sm font-medium"
          placeholder="Search by name, email, or username..."
          value={userSearchTerm}
          onChange={onUserSearchChange}
        />
        {showSelectAll && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="checkbox"
              checked={selectAll}
              onChange={onSelectAll}
            />
            <label className="text-sm font-medium text-gray-700">
              Select All ({departmentUsers.length} faculty members)
            </label>
          </div>
        )}
      </div>
      {/* Faculty List */}
      <div className="border rounded-lg max-h-[36vh] overflow-y-auto custom-scrollbar bg-white">
        {filteredUsers.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {userSearchTerm ? "No faculty members match your search" : "No faculty members found"}
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.user_id} className="flex items-center gap-2 px-4 py-3 border-b hover:bg-gray-50">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-secondary"
                checked={selectedUsers.includes(user.user_id)}
                onChange={() => onUserToggle(user.user_id)}
              />
              <div className="flex-1">
                <div className="text-sm text-gray-900">
                  {(user.first_name) + " " + user.last_name}
                </div>
                {user.email && user.email.trim() !== "" && user.email !== "null" && user.email !== "undefined" && (
                  <div className="text-xs text-gray-500">{user.email}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {/* Selected Count */}
      <div className="mt-2 text-sm text-gray-600 align-right text-right">
        {departmentUsers.length} users to select from
      </div>
    </div>
  );
};

export default FacultyMemberSelector;
