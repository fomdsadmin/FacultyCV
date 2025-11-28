import React from "react";
import { FaTrash } from "react-icons/fa";

const AdminUsersTable = ({ 
  searchedUsers, 
  getPrimaryRank, 
  handleImpersonateClick, 
  handleManageClick, 
  handleRemoveUser 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mx-4 overflow-auto max-h-[60vh]">
      <table className="w-full table-fixed min-w-[650px] md:overflow-x-auto">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide w-1/6">
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
              <td className="px-4 py-5 w-1/6">
                <div className="flex flex-col min-w-0 break-words">
                  <div className="text-sm font-semibold text-gray-900 mb-1 truncate">
                    {user.first_name} {user.last_name}
                  </div>
                  <div className="text-sm text-gray-500 truncate">{user.email}</div>
                </div>
              </td>
              <td className="px-4 py-2 text-center w-1/6">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                  {user.role === "Assistant" ? "Delegate" : user.role}
                </span>
              </td>
              <td className="px-4 py-2 text-center w-1/6">
                <span className="text-sm font-medium text-gray-700">
                  {user.primary_department ? (
                    user.primary_department
                  ) : (
                    <span className="text-gray-400 italic">Not specified</span>
                  )}
                </span>
              </td>
              <td className="px-4 py-2 text-center w-1/6">
                <span className="text-sm font-medium text-gray-700">
                  {user.cwl_username ? (
                    user.cwl_username
                  ) : (
                    <span className="text-gray-400 italic">Not specified</span>
                  )}
                </span>
              </td>
              <td className="px-4 py-2 text-center w-1/6">
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
                    className="btn btn-accent btn-sm text-white shadow text-xs whitespace-nowrap"
                    disabled={user.role !== "Faculty"}
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
                    <FaTrash className="inline" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUsersTable;
