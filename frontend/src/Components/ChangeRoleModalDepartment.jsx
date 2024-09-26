import React, { useState } from 'react';
import '../CustomStyles/scrollbar.css';
import '../CustomStyles/modal.css';
import { updateUser } from '../graphql/graphqlHelpers';
import { addToUserGroup, removeFromUserGroup } from '../graphql/graphqlHelpers';

const ChangeRoleModal = ({ userInfo, setIsModalOpen, fetchAllUsers, handleBack, department }) => {
  const [changingRole, setChangingRole] = useState(false);
  const [confirmChange, setConfirmChange] = useState(false);
  const [newRole, setNewRole] = useState(userInfo.role);

  async function changeRole() {
    setChangingRole(true);

    //put user in user group
    try {
      if (newRole.startsWith('Admin-')) {
        const result = await addToUserGroup(userInfo.email, 'DepartmentAdmin');
        
      } else {
        const result = await addToUserGroup(userInfo.email, newRole);
        
      }
    } catch (error) {
      
      return;
    }

    //remove user from user group
    try {
      if (userInfo.role.startsWith('Admin-')) {
        const result = await removeFromUserGroup(userInfo.email, 'DepartmentAdmin');
        
      } else {
        const result = await removeFromUserGroup(userInfo.email, userInfo.role);
        
      }
    } catch (error) {
      
      return;
    }

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
      
      fetchAllUsers();
      handleBack();
    } catch {
      console.error('Error changing role');
    }
    setChangingRole(false);
  }

  const handleRoleChange = (event) => {
    const selectedRole = event.target.value;
    setNewRole(selectedRole);
    if (selectedRole !== userInfo.role) {
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
            <option value={`Admin-${department}`}>{department} Admin</option>
          </select>

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
