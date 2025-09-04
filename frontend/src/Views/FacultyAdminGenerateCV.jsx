import React from "react";
import { useState, useEffect, useRef } from "react";
import PageContainer from "./PageContainer.jsx";
import FacultyAdminMenu from "../Components/FacultyAdminMenu.jsx";
import FacultyMemberSelector from "../Components/FacultyMemberSelector.jsx";
import "../CustomStyles/scrollbar.css";
import { useNotification } from "../Contexts/NotificationContext.jsx";
import { useAuditLogger, AUDIT_ACTIONS } from "../Contexts/AuditLoggerContext.jsx";
import { getAllTemplates, getAllUsers, getAllUniversityInfo } from "../graphql/graphqlHelpers.js";
import { buildHtml } from "../Pages/ReportsPage/HtmlFunctions/HtmlBuilder.js";
import CVGenerationComponent from "../Pages/ReportsPage/CVGenerationComponent/CVGenerationComponent.jsx";
import ReportPreview from "../Pages/ReportsPage/CVGenerationComponent/ReportPreview.jsx";

const FacultyAdminGenerateCV = ({ getCognitoUser, userInfo, toggleViewMode }) => {
  // State Management
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [facultyUsers, setFacultyUsers] = useState([]);
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startYear, setStartYear] = useState(new Date().getFullYear() - 10);
  const [endYear, setEndYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [departments, setDepartments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allFaculties, setAllFaculties] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const notificationShownRef = useRef(false);

  // Hooks
  const { setNotification } = useNotification();
  const { logAction } = useAuditLogger();

  // Constants
  const yearOptions = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);
  const MAX_SELECTION_LIMIT = 10;

  // Load initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const templatesData = await getAllTemplates();
        setTemplates(templatesData);

        const universityInfo = await getAllUniversityInfo();
        const facultyList = universityInfo
          .filter((info) => info.type === "Faculty")
          .map((info) => info.value)
          .sort();
        setAllFaculties(facultyList);

        const departmentList = universityInfo
          .filter((info) => info.type === "Department")
          .map((info) => info.value)
          .sort();
        setDepartments(departmentList);

        const users = await getAllUsers();
        setAllUsers(users);

        // Set initial faculty selection based on role
        if (userInfo?.role === "Admin") {
          setSelectedFaculty("");
        } else if (userInfo?.role?.startsWith("FacultyAdmin-")) {
          setSelectedFaculty(userInfo.role.split("FacultyAdmin-")[1]);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
      setLoading(false);
    };
    fetchInitialData();
  }, [userInfo]);

  // Filter faculty users when selectedFaculty changes
  useEffect(() => {
    if (userInfo?.role === "Admin" && selectedFaculty === "") {
      // All faculties
      const usersInFaculty = allUsers.filter(
        (user) => (user.email !== userInfo.email && user.role.toLowerCase().includes("faculty")) ||
          (user.role.toLowerCase().includes("admin-"))
      );
      setFacultyUsers(usersInFaculty);
      setSelectedDepartment("");
      setDepartmentUsers(usersInFaculty);
      setSelectedUsers([]);
      return;
    }

    if (!selectedFaculty) {
      setFacultyUsers([]);
      setSelectedDepartment("");
      setDepartmentUsers([]);
      setSelectedUsers([]);
      return;
    }

    // Filter users in selected faculty
    const usersInFaculty = allUsers.filter(
      (user) =>
        (user.primary_faculty === selectedFaculty || user.secondary_faculty === selectedFaculty) &&
        user.email !== userInfo.email
    );
    setFacultyUsers(usersInFaculty);
    setSelectedDepartment("");
    setDepartmentUsers(usersInFaculty);
    setSelectedUsers([]);
  }, [selectedFaculty, allUsers, userInfo]);

  // Filter department users when selectedDepartment changes
  useEffect(() => {
    if (!selectedDepartment) {
      setDepartmentUsers(facultyUsers);
    } else {
      const usersInDept = facultyUsers.filter(
        (user) =>
          user.primary_department === selectedDepartment ||
          user.secondary_department === selectedDepartment
      );
      setDepartmentUsers(usersInDept);
    }
    setSelectedUsers([]);
  }, [selectedDepartment, facultyUsers]);

  // Reset template when no users selected
  useEffect(() => {
    if (selectedUsers.length === 0) {
      setSelectedTemplate("");
    }
  }, [selectedUsers]);

  // Event Handlers
  const handleFacultySelect = (event) => {
    setSelectedFaculty(event.target.value);
  };

  const handleDepartmentSelect = (event) => {
    setSelectedDepartment(event.target.value);
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  const handleUserSearchChange = (event) => {
    setUserSearchTerm(event.target.value);
  };

  const handleUserToggle = (userId) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        notificationShownRef.current = false; // Reset when deselecting
        return prev.filter((id) => id !== userId);
      } else {
        // Check if we're at the maximum limit
        if (prev.length >= MAX_SELECTION_LIMIT) {
          if (!notificationShownRef.current) {
            setNotification({
              message: `Maximum amount of people selected (${MAX_SELECTION_LIMIT}). Please deselect someone to add another person.`,
              type: 'warning'
            });
            notificationShownRef.current = true;
          }
          return prev;
        }
        return [...prev, userId];
      }
    });
  };

  // Computed Values
  const searchedTemplates = templates
    .filter((template) => template.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.title.localeCompare(b.title));

  // HTML Generation Function
  const getHtml = async () => {
    if (selectedUsers.length === 0 || !selectedTemplate) {
      throw new Error("Please select both users and a template");
    }

    try {
      // Get selected user objects
      const selectedUserObjects = selectedUsers
        .map(userId => departmentUsers.find(user => user.user_id === userId))
        .filter(user => user !== undefined);

      // Update template with selected date range
      const templateWithDates = {
        ...selectedTemplate,
        start_year: startYear,
        end_year: endYear,
      };

      setNotification({
        message: "Uploading CV Template for generation please stay on page!",
        type: 'success'
      });

      // Generate HTML content
      const htmlContent = await buildHtml(selectedUserObjects, templateWithDates);

      // Log the action
      await logAction(AUDIT_ACTIONS.GENERATE_CV, {
        userIds: selectedUserObjects.map(u => u.user_id),
        userNames: selectedUserObjects.map(u => `${u.first_name} ${u.last_name}`),
        reportName: selectedTemplate.title,
        action: 'BULK_CV_GENERATION',
        userCount: selectedUserObjects.length
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

  // Render Helper Components
  const FacultySelector = () => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Faculty</label>
      {userInfo.role === "Admin" ? (
        <select
          className="select select-bordered w-full"
          value={selectedFaculty}
          onChange={handleFacultySelect}
        >
          <option value="">All Faculties</option>
          {allFaculties.map((faculty) => (
            <option key={faculty} value={faculty}>
              {faculty}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          className="input input-bordered w-full bg-gray-100"
          value={selectedFaculty}
          disabled
          readOnly
        />
      )}
    </div>
  );

  const DepartmentSelector = () => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Department (choose "All" to see all faculty users)
      </label>
      <select
        className="select select-bordered w-full"
        value={selectedDepartment}
        onChange={handleDepartmentSelect}
      >
        <option value="">All Departments</option>
        {departments.map((department) => (
          <option key={department} value={department}>
            {department}
          </option>
        ))}
      </select>
    </div>
  );

  const TemplateSelector = () => (
    <div>
      <h2 className="text-sm font-medium text-gray-700 mb-2">Templates</h2>
      <select
        className="select select-bordered w-full"
        value={selectedTemplate?.template_id || ""}
        onChange={(e) => {
          const templateId = e.target.value;
          const template = searchedTemplates.find((t) => t.template_id === templateId);
          handleTemplateSelect(template || "");
        }}
      >
        <option value="">Choose a template...</option>
        {searchedTemplates.map((template) => (
          <option key={template.template_id} value={template.template_id}>
            {template.title}
          </option>
        ))}
      </select>
    </div>
  );

  const DateRangePicker = () => (
    selectedTemplate && (
      <div className="my-4">
        <label className="block font-medium text-zinc-600 mb-2">Select Date Range (Year)</label>
        <div className="flex space-x-2">
          <select
            className="border rounded px-3 py-2 flex-1"
            value={startYear}
            onChange={(e) => setStartYear(Number(e.target.value))}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <span className="self-center">to</span>
          <select
            className="border rounded px-3 py-2 flex-1"
            value={endYear}
            onChange={(e) => setEndYear(Number(e.target.value))}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>
    )
  );

  const SelectedUsersSummary = () => (
    selectedUsers.length > 0 && (
      <div className="mb-6">
        <h3 className="text-lg font-medium text-zinc-700 mb-3">
          Selected Faculty Members ({selectedUsers.length}/{MAX_SELECTION_LIMIT})
        </h3>
        {selectedUsers.length >= MAX_SELECTION_LIMIT && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded mb-3 text-sm">
            Maximum selection limit reached. Deselect someone to add another person.
          </div>
        )}
        <div className="bg-gray-50 rounded-lg p-4 max-h-32 overflow-y-auto">
          <div className="grid grid-cols-1 gap-1">
            {selectedUsers.map(userId => {
              const user = departmentUsers.find(u => u.user_id === userId);
              return user ? (
                <div key={userId} className="text-sm text-gray-700">
                  {user.preferred_name || user.first_name} {user.last_name}
                </div>
              ) : null;
            })}
          </div>
        </div>
      </div>
    )
  );

  // Main Render
  if (loading) {
    return (
      <PageContainer>
        <FacultyAdminMenu
          getCognitoUser={getCognitoUser}
          userName={userInfo.preferred_name || userInfo.first_name}
          userInfo={userInfo}
          toggleViewMode={toggleViewMode}
        />
        <main className="px-16 overflow-auto custom-scrollbar w-full mb-4">
          <div className="w-full h-full flex items-center justify-center">
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        </main>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <FacultyAdminMenu
        getCognitoUser={getCognitoUser}
        userName={userInfo.preferred_name || userInfo.first_name}
        userInfo={userInfo}
        toggleViewMode={toggleViewMode}
      />
      <main className="px-16 overflow-auto custom-scrollbar w-full mb-4">
        <div className="">
          <h1 className="text-left my-4 text-4xl font-bold text-zinc-600">
            Generate Bulk CV
          </h1>

          <div className="flex gap-6 mb-8 h-[80vh]">
            {/* Left Section - Controls */}
            <div className="w-1/3 space-y-6">
              <FacultySelector />

              <DepartmentSelector />

              <div>
                <TemplateSelector />
                <DateRangePicker />
              </div>

              <FacultyMemberSelector
                departmentUsers={departmentUsers}
                selectedUsers={selectedUsers}
                onUserToggle={handleUserToggle}
                userSearchTerm={userSearchTerm}
                onUserSearchChange={handleUserSearchChange}
                showSelectAll={false}
                maxSelectionLimit={MAX_SELECTION_LIMIT}
              />

              <SelectedUsersSummary />

              {/* CV Generation Component */}
              <div className={`${selectedUsers.length === 0 || !selectedTemplate ? 'opacity-50 pointer-events-none' : ''}`}>
                <CVGenerationComponent
                  getHtml={getHtml}
                  optionalKey="facultyadmin"
                  selectedTemplate={selectedTemplate}
                  setPdfPreviewUrl={setPdfUrl}
                  pdfGenerationCompleteMessage={`PDF for bulk CV "${selectedTemplate?.title}" finished generating!`}
                  docxGenerationCompleteMessage={`DOCX for bulk CV "${selectedTemplate?.title}" finished generating!`}
                />
              </div>
            </div>

            {/* Right Section - Report Preview */}
            <div className="flex-1 bg-gray-50 rounded-lg shadow-md p-6 overflow-hidden">
              <ReportPreview pdfUrl={pdfUrl} />
            </div>
          </div>
        </div>
      </main>
    </PageContainer>
  );
};

export default FacultyAdminGenerateCV;
