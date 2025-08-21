import React, { useState, useEffect } from "react";
import "../CustomStyles/scrollbar.css";
import "../CustomStyles/modal.css";
import { updateUser } from "../graphql/graphqlHelpers";
import { addToUserGroup, removeFromUserGroup, getAllUniversityInfo } from "../graphql/graphqlHelpers";
import { useAuditLogger, AUDIT_ACTIONS } from "../Contexts/AuditLoggerContext";

const ChangeRoleModal = ({ userInfo, setIsModalOpen, fetchAllUsers, handleBack }) => {
  const [changingRole, setChangingRole] = useState(false);
  const [confirmChange, setConfirmChange] = useState(false);
  const [newRole, setNewRole] = useState(userInfo.role.startsWith("Admin-") ? "Admin-" : userInfo.role);
  const [selectedDepartment, setSelectedDepartment] = useState(
    userInfo.role.startsWith("Admin-") ? userInfo.role.slice(6) : ""
  );
  const [selectedFaculty, setSelectedFaculty] = useState(
    userInfo.role.startsWith("FacultyAdmin-") ? userInfo.role.split("FacultyAdmin-")[1] : ""
  );
  const [isDepartmentAdmin, setIsDepartmentAdmin] = useState(userInfo.role.startsWith("Admin-") ? true : false);
  const [isFacultyAdmin, setIsFacultyAdmin] = useState(userInfo.role.startsWith("FacultyAdmin-") ? true : false);
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);

  const { logAction } = useAuditLogger();
  useEffect(() => {
    fetchUniversityInfo();
  }, []);

  useEffect(() => {
    if (isDepartmentAdmin) {
      handleRoleChange({ target: { value: "Admin-" } });
    }
  }, [selectedDepartment]);

  const fetchUniversityInfo = async () => {
    getAllUniversityInfo().then((result) => {
      let departments = [];
      let faculties = [];

      result.forEach((element) => {
        if (element.type === "Department") {
          departments.push(element.value);
        } else if (element.type === "Faculty") {
          faculties.push(element.value);
        }
      });

      departments.sort();
      faculties.sort();

      setDepartments(departments);
      setFaculties(faculties);
    });
  };

  const handleDepartmentInputChange = (event) => {
    const departmentName = event.target.value;
    setSelectedDepartment(departmentName);
  };

  const handleFacultyInputChange = (event) => {
    const facultyName = event.target.value;
    setSelectedFaculty(facultyName);
  };

  async function changeRole() {
    const oldRole = userInfo.role;
    const updatedRole =
      newRole === "Admin-"
        ? `${newRole}${selectedDepartment}`
        : newRole === "FacultyAdmin-"
        ? `${newRole}${selectedFaculty}`
        : newRole;
    setChangingRole(true);

    if (updatedRole.startsWith("Admin-") && userInfo.role.startsWith("Admin-")) {
    } else {
      //put user in user group
      try {
        if (updatedRole.startsWith("Admin-")) {
          const result = await addToUserGroup(userInfo.username, "DepartmentAdmin");
        } else if (updatedRole.startsWith("FacultyAdmin-")) {
          const result = await addToUserGroup(userInfo.username, "FacultyAdmin");
        } else {
          const result = await addToUserGroup(userInfo.username, updatedRole);
        }
      } catch (error) {
        return;
      }

      //remove user from user group
      try {
        if (userInfo.role.startsWith("Admin-")) {
          const result = await removeFromUserGroup(userInfo.username, "DepartmentAdmin");
        } else if (userInfo.role.startsWith("FacultyAdmin-")) {
          const result = await removeFromUserGroup(userInfo.username, "FacultyAdmin");
        } else {
          const result = await removeFromUserGroup(userInfo.username, userInfo.role);
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
        userInfo.institution,
        userInfo.primary_department,
        userInfo.primary_faculty,
        userInfo.campus,
        userInfo.keywords,
        userInfo.institution_user_id,
        userInfo.scopus_id,
        userInfo.orcid_id
      );

      fetchAllUsers();
      handleBack();

      // Log the role change action
      const roleChangeInfo = JSON.stringify({
        from: oldRole,
        to: updatedRole,
        userId: userInfo.user_id,
        username: userInfo.username,
        email: userInfo.email,
      });
      await logAction(AUDIT_ACTIONS.CHANGE_USER_ROLE, roleChangeInfo);
    } catch (error) {
      console.error("Error changing role", error);
    }
    setChangingRole(false);
  }

  const handleRoleChange = (event) => {
    const selectedRole = event.target.value;
    setNewRole(selectedRole);
    setIsDepartmentAdmin(selectedRole === "Admin-");
    setIsFacultyAdmin(selectedRole === "FacultyAdmin-");
    const updatedRole =
      selectedRole === "Admin-"
        ? `${selectedRole}${selectedDepartment}`
        : selectedRole === "FacultyAdmin-"
        ? `${selectedRole}${selectedFaculty}`
        : selectedRole;

    if (
      updatedRole !== userInfo.role ||
      (updatedRole === "Admin-" && selectedDepartment !== userInfo.role.slice(6)) ||
      (updatedRole === "FacultyAdmin-" && selectedFaculty !== userInfo.role.slice(15))
    ) {
      setConfirmChange(true);
    } else {
      setConfirmChange(false);
    }
  };

  return (
    <div className="modal-dialog ml-4 min-h-[15vh]">
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
            className="dropdown p-3 text-md w-full border border-gray-300 rounded-md"
            value={newRole}
            onChange={handleRoleChange}
          >
            {/* If user is Admin, show all options */}
            {userInfo.role === "Admin" ? (
              <>
                <option value="Faculty">Faculty</option>
                <option value="Assistant">Assistant</option>
                <option value="Admin-">Department Admin</option>
                <option value="FacultyAdmin-">Faculty Admin</option>
                <option value="Admin">Admin</option>
              </>
            ) : userInfo.role.startsWith("Admin-") ? (
              <>
                <option value="Faculty">Faculty</option>
                <option value="Assistant">Assistant</option>
                <option value="Admin-">Department Admin</option>
              </>
            ) : userInfo.role.startsWith("FacultyAdmin-") ? (
              <>
                <option value="Faculty">Faculty</option>
                <option value="Assistant">Assistant</option>
                <option value="FacultyAdmin-">Faculty Admin</option>
              </>
            ) : (
              <>
                <option value=""></option>
              </>
            )}
          </select>

          {isDepartmentAdmin && (
            <div className="department-input">
              <label className="block mt-4">Select department:</label>
              <select
                value={selectedDepartment}
                onChange={handleDepartmentInputChange}
                className="w-full rounded text-md p-3 border border-gray-300"
              >
                <option value="">-</option>
                {departments.map((department, index) => (
                  <option key={index} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isFacultyAdmin && (
            <div className="faculty-input">
              <label className="block mt-4">Select faculty:</label>
              <select
                value={selectedFaculty}
                onChange={handleFacultyInputChange}
                className="w-full rounded text-md p-3 border border-gray-300"
              >
                <option value="">-</option>
                {faculties.map((faculty, index) => (
                  <option key={index} value={faculty}>
                    {faculty}
                  </option>
                ))}
              </select>
            </div>
          )}

          {confirmChange && (
            <div>
              <p className="mt-10">
                {newRole === "Admin-" && selectedDepartment === ""
                  ? "Please select a department above"
                  : newRole === "FacultyAdmin-" && selectedFaculty === ""
                  ? "Please select a faculty above"
                  : newRole === "Admin-" && selectedDepartment !== ""
                  ? `Are you sure you want to change the role of this user to Admin-${selectedDepartment}?`
                  : newRole === "FacultyAdmin-" && selectedFaculty !== ""
                  ? `Are you sure you want to change the role of this user to FacultyAdmin-${selectedFaculty}?`
                  : `Are you sure you want to change the role of this user to ${newRole}?`}
              </p>
              <button
                type="button"
                className="text-white btn btn-warning mt-10 min-h-0 h-8 leading-tight"
                onClick={changeRole}
                disabled={
                  changingRole ||
                  (newRole === "Admin-" && selectedDepartment === "") ||
                  (newRole === "FacultyAdmin-" && selectedFaculty === "")
                }
              >
                {changingRole ? "Changing role..." : "Confirm"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangeRoleModal;
