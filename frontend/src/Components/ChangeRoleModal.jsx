import React, { useState } from 'react';
import '../CustomStyles/scrollbar.css';
import '../CustomStyles/modal.css';
import { updateUser } from '../graphql/graphqlHelpers';
import { addUserConnection, getUser } from '../graphql/graphqlHelpers';

const ChangeRoleModal = ({ userInfo, setIsModalOpen, fetchAllUsers, handleBack }) => {
  const [changingRole, setChangingRole] = useState(false);
  const [confirmChange, setConfirmChange] = useState(false);
  const [newRole, setNewRole] = useState(userInfo.role);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [isDepartmentAdmin, setIsDepartmentAdmin] = useState(false);

  const handleDepartmentInputChange = (event) => {
    const departmentName = event.target.value;
    setSelectedDepartment(departmentName);
    setNewRole(`Admin-${departmentName}`);
  };

  async function changeRole() {
    setChangingRole(true);
    try {
      const updatedUser = await updateUser(
        userInfo.user_id,
        userInfo.first_name,
        userInfo.last_name,
        userInfo.preferred_name,
        userInfo.email,
        newRole,
        userInfo.bio,
        userInfo.rank,
        userInfo.primary_department,
        userInfo.secondary_department,
        userInfo.primary_faculty,
        userInfo.secondary_faculty,
        userInfo.campus,
        userInfo.keywords,
        userInfo.institution_user_id,
        userInfo.scopus_id,
        userInfo.orcid_id
      );
      console.log('Updated user:', updatedUser);
      fetchAllUsers();
      handleBack();
    } catch {
      console.error('Error changing role');
    }
    setChangingRole(false);
  }

  const handleRoleChange = (event) => {
    setNewRole(event.target.value);
    if (event.target.value !== userInfo.role) {
      setConfirmChange(true);
    } else {
      setConfirmChange(false);
    }
  };

  return (
    <dialog className="modal-dialog" open>
      <div className="modal-content">
        <div>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            onClick={() => setIsModalOpen(false)}
          >
            ✕
          </button>
          <h2 className="text-xl font-bold mb-4">Change Role</h2>

          <select
            className="dropdown p-3 text-lg w-full border border-gray-300 rounded-md"
            value={newRole}
            onChange={handleRoleChange}
          >
            <option value="Faculty">Faculty</option>
            <option value="Assistant">Assistant</option>
            <option value="Department Admin" selected={isDepartmentAdmin}>Department Admin</option>
            <option value="Admin">Admin</option>
          </select>

          {isDepartmentAdmin && (
            <div className="department-input">
              <label className="block text-xs mt-4">Enter department name (Should be exactly the same as name in list of departments provided during deployment):</label>
              <input
                className="input input-bordered mt-1 h-10 w-full text-xs"
                value={selectedDepartment}
                onChange={handleDepartmentInputChange}
                placeholder="Department Name"
                required
              />
            </div>
          )}

          {confirmChange && (
            <div>
              <p className='mt-10'>Are you sure you want to change the role of this user to {newRole}?</p>
              <button type="button" className="text-white btn btn-warning mt-10 min-h-0 h-8 leading-tight" onClick={changeRole} disabled={changingRole}>
                {changingRole ? 'Changing role...' : 'Confirm'}
              </button>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
};

export default ChangeRoleModal;
