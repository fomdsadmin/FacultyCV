import React from "react";
import { useState, useEffect } from "react";
import PageContainer from "./PageContainer.jsx";
import DepartmentAdminMenu from "../Components/DepartmentAdminMenu.jsx";
import FacultyMemberSelector from "../Components/FacultyMemberSelector.jsx";
import "../CustomStyles/scrollbar.css";
import { useNotification } from "../Contexts/NotificationContext.jsx";
import { useAuditLogger, AUDIT_ACTIONS } from "../Contexts/AuditLoggerContext.jsx";
import { useAdmin } from "Contexts/AdminContext.jsx";
import { buildHtml } from "../Pages/ReportsPage/HtmlFunctions/HtmlBuilder.js";
import CVGenerationComponent from "../Pages/ReportsPage/CVGenerationComponent/CVGenerationComponent.jsx";
import ReportPreview from "../Pages/ReportsPage/CVGenerationComponent/ReportPreview.jsx";

const DepartmentAdminGenerateCV = ({ getCognitoUser, userInfo }) => {

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [templates, setTemplates] = useState([]);
  const [startYear, setStartYear] = useState(new Date().getFullYear() - 10);
  const [endYear, setEndYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [allDepartments, setAllDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectAll, setSelectAll] = useState(false);

  const { setNotification } = useNotification();
  const { logAction } = useAuditLogger();
  const yearOptions = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);
  const { loading, allUsers, allTemplates } = useAdmin();

  const [pdfUrl, setPdfUrl] = useState(null);

  // Get users list from context
  useEffect(() => {
    setUsers(allUsers);
  }, [allUsers]);

  // Get templates list from context
  useEffect(() => {
    setTemplates(allTemplates);
  }, [allTemplates]);

  // Extract unique, valid departments from users list
  useEffect(() => {
    if (users && users.length > 0) {
      const deptSet = new Set();
      users.forEach((user) => {
        const dept = user.primary_department;
        if (
          dept &&
          typeof dept === "string" &&
          dept.trim() !== "" &&
          dept.toLowerCase() !== "null" &&
          dept.toLowerCase() !== "undefined"
        ) {
          deptSet.add(dept.trim());
        }
      });
      setAllDepartments(Array.from(deptSet).sort());
    } else {
      setAllDepartments([]);
    }
  }, [users]);

  // Set default department and department users based on role
  useEffect(() => {
    if (userInfo && users.length > 0) {
      if (userInfo.role === "Admin") {
        setSelectedDepartment("All");
        setDepartmentUsers(
          users.filter(
            (user) =>
              user.role && (user.role.toLowerCase().includes("faculty") || user.role.toLowerCase().includes("admin-"))
          )
        );
      } else if (userInfo.role.startsWith("Admin-")) {
        const dept = userInfo.role.split("-")[1];
        setSelectedDepartment(dept);
        setDepartmentUsers(
          users.filter(
            (user) =>
              user.primary_department === dept &&
              user.role &&
              (user.role.toLowerCase().includes("faculty") || user.role.toLowerCase().includes("admin-"))
          )
        );
      }
      setSelectedUsers([]);
    }
  }, [userInfo, users]);

  // Update department users when selectedDepartment changes (for Admin only)
  useEffect(() => {
    if (userInfo && userInfo.role === "Admin" && users.length > 0 && selectedDepartment) {
      let usersInDepartment;
      if (selectedDepartment === "All") {
        usersInDepartment = users.filter(
          (user) =>
            user.role && (user.role.toLowerCase().includes("faculty") || user.role.toLowerCase().includes("admin-"))
        );
      } else {
        usersInDepartment = users.filter(
          (user) =>
            user.primary_department === selectedDepartment &&
            user.role &&
            (user.role.toLowerCase().includes("faculty") || user.role.toLowerCase().includes("admin-"))
        );
      }
      setDepartmentUsers(usersInDepartment);
      setSelectedUsers([]);
    }
  }, [selectedDepartment, users, userInfo]);

  // Reset template if no user selected
  useEffect(() => {
    if (selectedUsers.length === 0) {
      setSelectedTemplate("");
    }
  }, [selectedUsers]);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  const handleUserSearchChange = (event) => {
    setUserSearchTerm(event.target.value);
  };

  const handleUserToggle = (userId) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
      setSelectAll(false);
    } else {
      setSelectedUsers(departmentUsers.map((user) => user.user_id));
      setSelectAll(true);
    }
  };

  const searchedTemplates = templates
    .filter((template) => template.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.title.localeCompare(b.title));

  // Function to generate HTML for CVGenerationComponent
  const getHtml = async () => {
    if (selectedUsers.length === 0 || !selectedTemplate) {
      throw new Error("Please select both users and a template");
    }

    try {
      // Get selected user objects
      const selectedUserObjects = selectedUsers.map(userId => 
        departmentUsers.find(user => user.user_id === userId)
      ).filter(user => user !== undefined);

      // Update template with selected date range
      const templateWithDates = {
        ...selectedTemplate,
        start_year: startYear,
        end_year: endYear,
      };

      console.log('🔄 Generating HTML for users:', selectedUserObjects.map(u => `${u.first_name} ${u.last_name}`));

      // Generate HTML content (supports both single user and multiple users)
      const htmlContent = await buildHtml(selectedUserObjects, templateWithDates);

      // Log the action
      await logAction(AUDIT_ACTIONS.GENERATE_CV, {
        userIds: selectedUserObjects.map(u => u.user_id),
        userNames: selectedUserObjects.map(u => `${u.first_name} ${u.last_name}`),
        reportName: selectedTemplate.title,
        action: 'BULK_CV_GENERATION',
        userCount: selectedUserObjects.length
      });

      setNotification({
        message: "HTML generated successfully! Starting PDF and DOCX generation...",
        type: 'success'
      });

      return htmlContent;

    } catch (error) {
      console.error("Error generating HTML:", error);
      setNotification({
        message: "An error occurred while generating the HTML. Please try again.",
        type: 'error'
      });
      throw error;
    }
  };

  return (
    <PageContainer>
      <DepartmentAdminMenu getCognitoUser={getCognitoUser} userName={userInfo.first_name} />
      <main className="px-16 overflow-auto custom-scrollbar w-full mb-4">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <div className="">
            <h1 className="text-left my-4 text-4xl font-bold text-zinc-600">Generate Bulk CV</h1>

            {/* Main Content Layout - Left sidebar and Right preview */}
            <div className="flex gap-6 mb-8 h-[80vh]">
              {/* Left Section - Controls */}
              <div className="w-1/3 space-y-6">
                {/* Department Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  {userInfo.role === "Admin" ? (
                    <select
                      className="select select-bordered w-full"
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                    >
                      <option value="All">All</option>
                      {allDepartments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="input input-bordered w-full bg-gray-100"
                      value={userInfo.role.startsWith("Admin-") ? userInfo.role.split("-")[1] : ""}
                      disabled
                    />
                  )}
                </div>

                {/* Templates Dropdown */}
                <div>
                  <h2 className="text-sm font-medium text-gray-700 mb-2">Templates</h2>
                  <select
                    className={`select select-bordered w-full ${
                      selectedUsers.length === 0 ? "select-disabled bg-gray-100" : ""
                    }`}
                    value={selectedTemplate?.template_id || ""}
                    onChange={(e) => {
                      const templateId = e.target.value;
                      const template = searchedTemplates.find((t) => t.template_id === templateId);
                      handleTemplateSelect(template || "");
                    }}
                    disabled={selectedUsers.length === 0}
                  >
                    <option value="">Choose a template...</option>
                    {searchedTemplates.map((template) => (
                      <option key={template.template_id} value={template.template_id}>
                        {template.title}
                      </option>
                    ))}
                  </select>
                  
                  {/* Date Range Picker */}
                  {selectedTemplate && (
                    <div className="my-4">
                      <label className="block font-medium text-zinc-600 mb-2">Select Date Range (Year)</label>
                      <div className="flex space-x-2">
                        <select
                          className="border rounded px-3 py-2 flex-1"
                          value={startYear}
                          onChange={(e) => setStartYear(Number(e.target.value))}
                        >
                          {yearOptions.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                        <span className="self-center">to</span>
                        <select
                          className="border rounded px-3 py-2 flex-1"
                          value={endYear}
                          onChange={(e) => setEndYear(Number(e.target.value))}
                        >
                          {yearOptions.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Faculty Member Selector */}
                <div>
                  <FacultyMemberSelector
                    departmentUsers={departmentUsers}
                    selectedUsers={selectedUsers}
                    onUserToggle={handleUserToggle}
                    selectAll={selectAll}
                    onSelectAll={handleSelectAll}
                    userSearchTerm={userSearchTerm}
                    onUserSearchChange={handleUserSearchChange}
                    showSelectAll={true}
                  />
                </div>

                {/* Selected Users Summary */}
                {selectedUsers.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-zinc-700 mb-3">
                      Selected Faculty Members ({selectedUsers.length})
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-32 overflow-y-auto">
                      <div className="grid grid-cols-1 gap-1">
                        {selectedUsers.map(userId => {
                          const user = departmentUsers.find(u => u.user_id === userId);
                          return user ? (
                            <div key={userId} className="text-sm text-gray-700">
                              {user.first_name} {user.last_name}
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* CV Generation Component */}
                <CVGenerationComponent
                  getHtml={getHtml}
                  optionalKey="deptadmin"
                  selectedTemplate={selectedTemplate}
                  setPdfPreviewUrl={setPdfUrl}
                  pdfGenerationCompleteMessage={`PDF for bulk CV "${selectedTemplate.title}" finsihed generating!`}
                  docxGenerationCompleteMessage={`DOCX for bulk CV "${selectedTemplate.title}" finsihed generating!`}
                />
              </div>

              {/* Right Section - Report Preview */}
              <div className="flex-1 bg-gray-50 rounded-lg shadow-md p-6 overflow-hidden">
                <ReportPreview pdfUrl={pdfUrl} />
              </div>
            </div>
          </div>
        )}
      </main>
    </PageContainer>
  );
};

export default DepartmentAdminGenerateCV;
