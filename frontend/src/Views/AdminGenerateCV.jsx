import React from "react";
import { useState, useEffect } from "react";
import PageContainer from "./PageContainer.jsx";
import AdminMenu from "../Components/AdminMenu.jsx";
import { getAllTemplates, getAllUsers, getAllUniversityInfo } from "../graphql/graphqlHelpers.js";
import "../CustomStyles/scrollbar.css";
import { getDownloadUrl, uploadLatexToS3 } from "../utils/reportManagement.js";
import { useNotification } from "../Contexts/NotificationContext.jsx";
import { getUserId } from "../getAuthToken.js";
import { buildLatex } from "../Pages/ReportsPage/LatexFunctions/LatexBuilder.js";
import PDFViewer from "../Components/PDFViewer.jsx";
import { AUDIT_ACTIONS, useAuditLogger } from "../Contexts/AuditLoggerContext.jsx";

const AdminGenerateCV = ({ getCognitoUser, userInfo }) => {
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startYear, setStartYear] = useState(new Date().getFullYear() - 10);
  const [endYear, setEndYear] = useState(new Date().getFullYear());
  const [buildingLatex, setBuildingLatex] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadUrlDocx, setDownloadUrlDocx] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { setNotification } = useNotification();

  const yearOptions = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);

  const [allUsers, setAllUsers] = useState([]); // add this to store all users
  const { logAction } = useAuditLogger();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load templates
        const templatesData = await getAllTemplates();
        setTemplates(templatesData);

        // Load departments and faculties
        const universityInfo = await getAllUniversityInfo();
        const departmentList = universityInfo
          .filter((info) => info.type === "Department")
          .map((info) => info.value)
          .sort();
        setDepartments(departmentList);

        const facultyList = universityInfo
          .filter((info) => info.type === "Faculty")
          .map((info) => info.value)
          .sort();
        setFaculties(facultyList);

        // Load all users once
        const users = await getAllUsers();
        setAllUsers(users);

        // Default to "All" for both faculty and department
        setSelectedFaculty("");
        setSelectedDepartment("");
        setDepartmentUsers(users.filter(
          (user) =>
            (user.role.toLowerCase().includes("faculty") || user.role.toLowerCase().includes("admin-"))
        ));
      } catch (error) {
        console.error("Error loading data:", error);
      }
      setLoading(false);
    };
    loadData();
    // eslint-disable-next-line
  }, []);

  // Filter department list based on selected faculty
  useEffect(() => {
    let filteredDepartments = departments;
    if (selectedFaculty) {
      filteredDepartments = Array.from(
        new Set(
          allUsers
            .filter(
              (user) =>
                (user.primary_faculty === selectedFaculty || user.secondary_faculty === selectedFaculty) &&
                (user.role.toLowerCase().includes("faculty") || user.role.toLowerCase().includes("admin-"))
            )
            .map((user) => user.primary_department)
            .filter(Boolean)
        )
      ).sort();
    }
    setDepartments(filteredDepartments);
    setSelectedDepartment("");
    setDepartmentUsers([]);
    setSelectedUser("");
    setSelectedTemplate("");
    setDownloadUrl(null);
    setDownloadUrlDocx(null);
    // eslint-disable-next-line
  }, [selectedFaculty]);

  // Filter users based on selected faculty and department
  useEffect(() => {
    let users = allUsers.filter(
      (user) =>
        (user.role.toLowerCase().includes("faculty") || user.role.toLowerCase().includes("admin-"))
    );
    if (selectedFaculty) {
      users = users.filter(
        (user) =>
          user.primary_faculty === selectedFaculty || user.secondary_faculty === selectedFaculty
      );
    }
    if (selectedDepartment) {
      users = users.filter(
        (user) =>
          user.primary_department === selectedDepartment ||
          user.secondary_department === selectedDepartment
      );
    }
    setDepartmentUsers(users);
    setSelectedUser("");
    setSelectedTemplate("");
    setDownloadUrl(null);
    setDownloadUrlDocx(null);
    // eslint-disable-next-line
  }, [selectedDepartment, selectedFaculty, allUsers]);

  const loadUsersForDepartment = async (department) => {
    if (!department) {
      setDepartmentUsers([]);
      return;
    }

    try {
      const allUsers = await getAllUsers();
      const usersInDepartment = allUsers.filter(
        (user) =>
        (user.primary_department === department &&
          (user.role.toLowerCase().includes("faculty") || user.role.toLowerCase().includes("admin-")))
      );
      console.log("Users in Department:", usersInDepartment);
      setDepartmentUsers(usersInDepartment);
    } catch (error) {
      console.error("Error loading users for department:", error);
    }
  };

  const handleDepartmentSelect = (event) => {
    const department = event.target.value;
    setSelectedDepartment(department);
    setSelectedUser("");
    setSelectedTemplate("");
    setDownloadUrl(null);
    setDownloadUrlDocx(null);
    loadUsersForDepartment(department);
  };

  const handleFacultySelect = (event) => {
    setSelectedFaculty(event.target.value);
  };

  const handleUserSelect = (event) => {
    setSelectedUser(event.target.value);
    // Reset download URLs when user changes
    setDownloadUrl(null);
    setDownloadUrlDocx(null);
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    // Reset download URLs when template changes
    setDownloadUrl(null);
    setDownloadUrlDocx(null);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const searchedTemplates = templates
    .filter((template) => template.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.title.localeCompare(b.title));

  const handleGenerate = async () => {
    if (!selectedUser || !selectedTemplate || !selectedDepartment) {
      alert("Please select a department, user, and template");
      return;
    }

    setBuildingLatex(true);

    try {
      // Find the selected user object
      const userObject = departmentUsers.find((user) => user.user_id === selectedUser);

      // Update template with selected date range
      const templateWithDates = {
        ...selectedTemplate,
        start_year: startYear,
        end_year: endYear,
      };

      const key = `${userObject.user_id}/${selectedTemplate.template_id}/resume.tex`;

      // Build LaTeX for the selected user
      const latex = await buildLatex(userObject, templateWithDates);

      // Upload .tex to S3
      await uploadLatexToS3(latex, key);

      // Wait till URLs for both PDF and DOCX are available
      const pdfUrl = await getDownloadUrl(key.replace("tex", "pdf"), 0);
      const docxUrl = await getDownloadUrl(key.replace("tex", "docx"), 0);

      setNotification(true);
      setDownloadUrl(pdfUrl);
      setDownloadUrlDocx(docxUrl);
      // Log the action
      await logAction(AUDIT_ACTIONS.GENERATE_CV, {
        userId: userObject.user_id,
        userName: `${userObject.first_name} ${userObject.last_name}`,
        userEmail: userObject.email,
        reportName: selectedTemplate.title,
      });
    } catch (error) {
      console.error("Error generating CV:", error);
      alert("Error generating CV. Please try again.");
    }

    setBuildingLatex(false);
  };

  const handleDownload = (url, format) => {
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedUser}_${selectedTemplate.title}_CV.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <PageContainer>
      <AdminMenu getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} />
      <main className="px-16 overflow-auto custom-scrollbar w-full mb-4">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <div className="">
            <h1 className="text-left my-4 text-4xl font-bold text-zinc-600">Generate CV</h1>

            {/* Faculty Selection */}
            <div className="my-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Faculty</label>
              <select
                className="select select-bordered w-full max-w-md"
                value={selectedFaculty}
                onChange={handleFacultySelect}
              >
                <option value="">All</option>
                {faculties.map((faculty) => (
                  <option key={faculty} value={faculty}>
                    {faculty}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Selection */}
            <div className="my-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Department</label>
              <select
                className="select select-bordered w-full max-w-md"
                value={selectedDepartment}
                onChange={handleDepartmentSelect}
              >
                <option value="">All</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>

            {/* User Selection Dropdown */}
            <div className="my-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Faculty Member</label>
              <select
                className={`select select-bordered w-full max-w-md ${departmentUsers.length === 0 ? "select-disabled bg-gray-100" : ""
                  }`}
                value={selectedUser}
                onChange={handleUserSelect}
                disabled={departmentUsers.length === 0}
              >
                <option value="">Choose a faculty member...</option>
                {departmentUsers.map((user) => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.preferred_name || user.first_name} {user.last_name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col w-full h-full pb-8">
              {/* Left Panel: Template List */}
              <div className="flex flex-col h-full">
                <h2 className="text-sm font-medium text-gray-700 mb-2">Templates</h2>

                {/* List of Templates as a select dropdown */}
                <div className="mb-4">
                  <select
                    className={`select select-bordered w-full max-w-md ${!selectedUser ? "select-disabled bg-gray-100" : ""
                      }`}
                    value={selectedTemplate?.template_id || ""}
                    onChange={(e) => {
                      const templateId = e.target.value;
                      const template = searchedTemplates.find((t) => t.template_id === templateId);
                      handleTemplateSelect(template || "");
                    }}
                    disabled={!selectedUser}
                  >
                    <option value="">Choose a template...</option>
                    {searchedTemplates.map((template) => (
                      <option key={template.template_id} value={template.template_id}>
                        {template.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range Picker and Generate Button */}
                {selectedTemplate && (
                  <div className="mt-auto">
                    <div className="flex space-x-2">
                      <label className="block font-medium text-zinc-600 mt-4">Select Date Range (Year)</label>
                      <select
                        className="border rounded px-4 py-4"
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
                        className="border rounded px-4 py-4"
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

                    {/* Download Buttons */}
                    {(downloadUrl || downloadUrlDocx) && (
                      <div className="flex gap-x-2 mr-2 mt-4">
                        {downloadUrl && (
                          <button className="w-1/2 btn btn-success" onClick={() => handleDownload(downloadUrl, "pdf")}>
                            Download PDF
                          </button>
                        )}
                        {downloadUrlDocx && (
                          <button
                            className="w-1/2 btn btn-success"
                            onClick={() => handleDownload(downloadUrlDocx, "docx")}
                          >
                            Download DOCX
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Panel: Preview/Info */}
              <div
                className="flex-1 flex flex-col items-center bg-gray-50 rounded-lg 
                        shadow-md px-8 overflow-auto custom-scrollbar h-full mt-4"
              >
                <div className="w-full h-full max-w-2xl p-8">
                  {!selectedDepartment ? (
                    <div className="text-center text-gray-500">
                      <p>Choose a department from the dropdown above to get started.</p>
                    </div>
                  ) : !selectedUser ? (
                    <div className="text-center text-gray-500">
                      <p>Choose a faculty member from the dropdown above to continue.</p>
                    </div>
                  ) : !selectedTemplate ? (
                    <div className="text-center text-gray-500">
                      <p>Choose a template from the dropdown to continue.</p>
                    </div>
                  ) : downloadUrl || downloadUrlDocx ? (
                    <div className="w-full h-full">
                      <div className="text-center mb-4">
                        <h3 className="text-xl font-semibold mb-2 text-green-600">CV Generated Successfully!</h3>
                      </div>
                      {downloadUrl && (
                        <div className="w-full h-full">
                          <PDFViewer url={downloadUrl} />
                        </div>
                      )}
                    </div>
                  ) : buildingLatex ? (
                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        Please wait while we generate the CV, you will be notified once it's ready.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        Click "Generate" to create the CV with the selected parameters.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedTemplate && (
                <div className="mt-auto">
                  {/* Generate Button */}
                  <button
                    className="w-full btn btn-primary my-4"
                    onClick={handleGenerate}
                    disabled={buildingLatex || !selectedUser || !selectedDepartment}
                  >
                    {buildingLatex ? "Generating..." : "Generate"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </PageContainer>
  );
};

export default AdminGenerateCV;
