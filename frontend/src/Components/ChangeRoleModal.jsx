import React, { useState, useEffect } from 'react';
import '../CustomStyles/scrollbar.css';
import '../CustomStyles/modal.css';
import { updateUser } from '../graphql/graphqlHelpers';
import { addToUserGroup, removeFromUserGroup, getAllUniversityInfo } from '../graphql/graphqlHelpers';
import { useAuditLogger, AUDIT_ACTIONS } from "../Contexts/AuditLoggerContext";

const ChangeRoleModal = ({ userInfo, setIsModalOpen, fetchAllUsers, handleBack }) => {
  const [changingRole, setChangingRole] = useState(false);
  const [confirmChange, setConfirmChange] = useState(false);
  const [newRole, setNewRole] = useState(
    userInfo.role.startsWith('Admin-') ? 'Admin-' : userInfo.role
  );
  const [selectedDepartment, setSelectedDepartment] = useState(
    userInfo.role.startsWith('Admin-') ? userInfo.role.slice(6) : ''
  );
  const [isDepartmentAdmin, setIsDepartmentAdmin] = useState(
    userInfo.role.startsWith('Admin-') ? true : false
  );
  const [departments, setDepartments] = useState([]);

  const { logAction } = useAuditLogger();
  useEffect(() => {
    fetchUniversityInfo();
  }, []);

  useEffect(() => {
    if (isDepartmentAdmin) {
      handleRoleChange({ target: { value: 'Admin-' } });
    }
  }, [selectedDepartment]);

  const fetchUniversityInfo = async () => {
    getAllUniversityInfo().then(result => {
      let departments = [];
      let faculties = [];
      let campuses = [];
      let ranks = [];

      result.forEach(element => {
        if (element.type === 'Department') {
          departments.push(element.value);
        } else if (element.type === 'Faculty') {
          faculties.push(element.value);
        } else if (element.type === 'Campus') {
          campuses.push(element.value);
        } else if (element.type === 'Rank') {
          ranks.push(element.value);
        }
      });

      departments.sort();
      faculties.sort();
      campuses.sort();
      ranks.sort();

      setDepartments(departments);
    });
  };

  const handleDepartmentInputChange = (event) => {
    const departmentName = event.target.value;
    setSelectedDepartment(departmentName);
  };

  async function changeRole() {
    const updatedRole = newRole === 'Admin-' ? `${newRole}${selectedDepartment}` : newRole;
    
    setChangingRole(true);

    if (updatedRole.startsWith('Admin-') && userInfo.role.startsWith('Admin-')) {

    } else {
      //put user in user group
      try {
        if (updatedRole.startsWith('Admin-')) {
          const result = await addToUserGroup(userInfo.email, 'DepartmentAdmin');
          
        } else {
          const result = await addToUserGroup(userInfo.email, updatedRole);
          
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
    }

    try {
      const updatedUser = await updateUser(
        userInfo.user_id,
        userInfo.first_name,
        userInfo.last_name,
        userInfo.preferred_name,
        userInfo.email,
        updatedRole,
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
        userInfo.orcid_id,
        userInfo.cwl,
        userInfo.vpp
      );
      
      fetchAllUsers();
      handleBack();
      // Log the role change action
      await logAction(AUDIT_ACTIONS.CHANGE_USER_ROLE, userInfo.email);
     
    } catch {
      console.error('Error changing role');
    }
    setChangingRole(false);
  }

  const handleRoleChange = (event) => {
    const selectedRole = event.target.value;
    setNewRole(selectedRole);
    setIsDepartmentAdmin(selectedRole === 'Admin-');
    const updatedRole = selectedRole === 'Admin-' ? `${selectedRole}${selectedDepartment}` : selectedRole;
    if (updatedRole !== userInfo.role || (updatedRole === 'Admin-' && selectedDepartment !== userInfo.role.slice(6))) {
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
            <option value="Admin-">Department Admin</option>
            <option value="Admin">Admin</option>
          </select>

          {isDepartmentAdmin && (
            <div className="department-input">
              <label className="block mt-4">Select department:</label>
              <select
                value={selectedDepartment}
                onChange={handleDepartmentInputChange}
                className="w-full rounded text-sm px-3 py-2 border border-gray-300"
              >
                <option value="">-</option>
                {departments.map((department, index) => (
                  <option key={index} value={department}>{department}</option>
                ))}
              </select>
            </div>
          )}

          {confirmChange && (
            <div>
                <p className='mt-10'>
                  {newRole === 'Admin-' && selectedDepartment === '' ? (
                    'Please select a department above'
                  ) : newRole === 'Admin-' && selectedDepartment !== '' ? (
                    `Are you sure you want to change the role of this user to Admin-${selectedDepartment}?`
                  ) : (
                    `Are you sure you want to change the role of this user to ${newRole}?`
                  )}
                </p>
                <button type="button" className="text-white btn btn-warning mt-10 min-h-0 h-8 leading-tight" onClick={changeRole} disabled={changingRole || (newRole === 'Admin-' && selectedDepartment === '')}>
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
