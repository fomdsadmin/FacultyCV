import React, { useState } from "react";

// Custom Modal Component
export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, type = "confirm" }) => {
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

// Deactivated Users Modal Component
export const DeactivatedUsersModal = ({
  isOpen,
  onClose,
  deactivatedUsers,
  searchTerm,
  onSearchChange,
  departmentFilter,
  onDepartmentChange,
  onReactivateUser,
  onActivateAll,
  onDeleteUser,
  userRole = "",
  userDepartment = "",
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  if (!isOpen) return null;

  // Get unique departments for filter - handle role-based restrictions
  let departments = [];
  if (userRole === "Admin" || userRole === "Admin-All") {
    // Show all departments
    departments = Array.from(new Set(deactivatedUsers.map((user) => user.primary_department).filter(Boolean))).sort();
  } else if (userRole && userRole.startsWith("Admin-")) {
    // Show only the admin's department
    const adminDept = userRole.replace("Admin-", "");
    departments = deactivatedUsers.some((user) => user.primary_department === adminDept) ? [adminDept] : [];
  } else {
    // Fallback to all departments for other roles
    departments = Array.from(new Set(deactivatedUsers.map((user) => user.primary_department).filter(Boolean))).sort();
  }

  const filteredDeactivatedUsers = deactivatedUsers
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

      const matchesDepartment = !departmentFilter || user.primary_department === departmentFilter;

      // Role-based filtering
      let matchesRole = true;
      if (userRole && userRole.startsWith("Admin-") && userRole !== "Admin-All") {
        const adminDept = userRole.replace("Admin-", "");
        matchesRole = user.primary_department === adminDept;
      }

      return matchesSearch && matchesDepartment && matchesRole;
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

  const isLocked = userRole && userRole.startsWith("Admin-") && userRole !== "Admin-All";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Inactive Members ({filteredDeactivatedUsers.length} of {deactivatedUsers.length})
            </h3>
            {filteredDeactivatedUsers.length > 0 && (
              <button
                onClick={() => onActivateAll(filteredDeactivatedUsers.map((user) => user.user_id))}
                className="btn btn-primary btn-md text-white flex items-center gap-2 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Activate All {filteredDeactivatedUsers.length} Users
              </button>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 space-y-3 flex-shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="input input-bordered flex items-center">
              <input
                type="text"
                className="grow"
                placeholder="Search inactive members..."
                value={searchTerm}
                onChange={onSearchChange}
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
            <select className="select select-bordered" value={departmentFilter} onChange={onDepartmentChange}>
              <option value="">All Departments ({deactivatedUsers.length})</option>
              {departments.map((dept) => {
                const deptCount = deactivatedUsers.filter((user) => user.primary_department === dept).length;
                return (
                  <option key={dept} value={dept}>
                    {dept} ({deptCount})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-4">
          {filteredDeactivatedUsers.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  {searchTerm || departmentFilter
                    ? "No inactive members found matching your criteria."
                    : "No inactive members found."}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full overflow-hidden flex flex-col">
              <div className="overflow-auto flex-1">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        User
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Role
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Department
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        CWL
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDeactivatedUsers.map((user, index) => (
                      <tr
                        key={user.user_id}
                        className={`transition-colors duration-150 hover:bg-gray-50 ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <div className="text-sm font-semibold text-gray-900">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            {user.role === "Assistant" ? "Delegate" : user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.primary_department || <span className="text-gray-400 italic">Not specified</span>}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.cwl_username || <span className="text-gray-400 italic">Not specified</span>}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => onReactivateUser(user.user_id)}
                              className="btn btn-success btn-sm text-white"
                            >
                              Activate
                            </button>
                            {userRole === "Admin" && (
                              <button
                                onClick={() => setShowDeleteConfirm(user)}
                                className="btn btn-error btn-sm text-white flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700">
                  Are you sure you want to permanently delete user{" "}
                  <strong>
                    {showDeleteConfirm.first_name} {showDeleteConfirm.last_name}
                  </strong>
                  ?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This will completely remove their account and all associated data from the database.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => setShowDeleteConfirm(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDeleteUser(showDeleteConfirm);
                    setShowDeleteConfirm(null);
                  }}
                  className="btn btn-error text-white"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
