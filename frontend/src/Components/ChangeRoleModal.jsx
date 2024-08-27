import React, { useState, useEffect } from 'react';
import '../CustomStyles/scrollbar.css';
import '../CustomStyles/modal.css';
import { updateUser } from '../graphql/graphqlHelpers';
import { addUserConnection, getUser, getAllUniversityInfo } from '../graphql/graphqlHelpers';

const ChangeRoleModal = ({ userInfo, setIsModalOpen, fetchAllUsers, handleBack }) => {
  const [changingRole, setChangingRole] = useState(false);
  const [confirmChange, setConfirmChange] = useState(false);
  const [newRole, setNewRole] = useState(userInfo.role);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [isDepartmentAdmin, setIsDepartmentAdmin] = useState(false);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchUniversityInfo();
  }, []);

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
    setNewRole(`Admin-${departmentName}`);
  };

  async function changeRole() {
    console.log(newRole);
    // setChangingRole(true);
    // try {
    //   const updatedUser = await updateUser(
    //     userInfo.user_id,
    //     userInfo.first_name,
    //     userInfo.last_name,
    //     userInfo.preferred_name,
    //     userInfo.email,
    //     newRole,
    //     userInfo.bio,
    //     userInfo.rank,
    //     userInfo.primary_department,
    //     userInfo.secondary_department,
    //     userInfo.primary_faculty,
    //     userInfo.secondary_faculty,
    //     userInfo.campus,
    //     userInfo.keywords,
    //     userInfo.institution_user_id,
    //     userInfo.scopus_id,
    //     userInfo.orcid_id
    //   );
    //   console.log('Updated user:', updatedUser);
    //   fetchAllUsers();
    //   handleBack();
    // } catch {
    //   console.error('Error changing role');
    // }
    // setChangingRole(false);
  }

  const handleRoleChange = (event) => {
    const selectedRole = event.target.value;
    setNewRole(selectedRole);
    setIsDepartmentAdmin(selectedRole === 'Department Admin');
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
            <option value="Department Admin">Department Admin</option>
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
                  {newRole === 'Department Admin' || newRole === 'Admin-' 
                    ? 'Please select a department above'
                    : `Are you sure you want to change the role of this user to ${newRole}?`}
                </p>              
                <button type="button" className="text-white btn btn-warning mt-10 min-h-0 h-8 leading-tight" onClick={changeRole} disabled={changingRole || newRole==='Department Admin' || newRole==='Admin-'}>
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
