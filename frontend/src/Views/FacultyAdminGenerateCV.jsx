import React from "react";
import { useState, useEffect } from "react";
import PageContainer from "./PageContainer.jsx";
import FacultyAdminMenu from "../Components/FacultyAdminMenu.jsx";
import { getAllTemplates, getAllUsers, getAllUniversityInfo } from "../graphql/graphqlHelpers.js";
import "../CustomStyles/scrollbar.css";
import { getDownloadUrl, uploadLatexToS3 } from "../Pages/ReportsPage/gotenbergGenerateUtils/reportManagement.js";
import { useNotification } from "../Contexts/NotificationContext.jsx";
import { getUserId } from "../getAuthToken.js";
import { buildLatex } from "../Pages/ReportsPage/LatexFunctions/LatexBuilder.js";
import PDFViewer from "../Components/PDFViewer.jsx";

const FacultyAdminGenerateCV = ({ getCognitoUser, userInfo, toggleViewMode }) => {
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [departments, setDepartments] = useState([]);
  const [facultyUsers, setFacultyUsers] = useState([]);
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
  const [faculty, setFaculty] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [allFaculties, setAllFaculties] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(""); // for super admin/faculty admin
  const { setNotification } = useNotification();

  const yearOptions = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);

  // Determine which faculty this admin manages
  useEffect(() => {
    if (userInfo?.role) {
      if (userInfo.role === 'Admin') {
        setFaculty('All');
      } else if (userInfo.role.startsWith('FacultyAdmin-')) {
        setFaculty(userInfo.role.split('FacultyAdmin-')[1]);
      }
    }
  }, [userInfo]);

  // Load all users, faculties, and departments on mount
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

        // Set faculty selection
        if (userInfo?.role === "Admin") {
          setSelectedFaculty(facultyList[0] || "");
        } else if (userInfo?.role?.startsWith("FacultyAdmin-")) {
          setSelectedFaculty(userInfo.role.split("FacultyAdmin-")[1]);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
      setLoading(false);
    };
    fetchInitialData();
    // eslint-disable-next-line
  }, []);

  // Filter facultyUsers when selectedFaculty changes
  useEffect(() => {
    if (userInfo?.role === "Admin" && selectedFaculty === "") {
      // All faculties
      const usersInFaculty = allUsers.filter(
        (user) => (user.email !== userInfo.email && user.role.toLowerCase().includes("faculty")) ||
          (user.role.toLowerCase().includes("admin-"))
      );
      setFacultyUsers(usersInFaculty);

      // All departments with users
      const deptsWithUsers = Array.from(
        new Set(
          usersInFaculty
            .map((u) => u.primary_department)
            .filter(Boolean)
        )
      ).sort();
      setDepartments(deptsWithUsers);

      setSelectedDepartment("");
      setDepartmentUsers(usersInFaculty);
      setSelectedUser("");
      setSelectedTemplate("");
      setDownloadUrl(null);
      setDownloadUrlDocx(null);
      return;
    }
    if (!selectedFaculty) {
      setFacultyUsers([]);
      setSelectedDepartment("");
      setDepartmentUsers([]);
      return;
    }
    // Filter users in selected faculty (primary or secondary)
    const usersInFaculty = allUsers.filter(
      (user) =>
        (user.primary_faculty === selectedFaculty || user.secondary_faculty === selectedFaculty) &&
        user.email !== userInfo.email
    );
    setFacultyUsers(usersInFaculty);

    // Find departments with at least one user in this faculty
    const deptsWithUsers = Array.from(
      new Set(
        usersInFaculty
          .map((u) => u.primary_department)
          .filter(Boolean)
      )
    ).sort();
    setDepartments(deptsWithUsers);

    // Reset department/user/template selection
    setSelectedDepartment("");
    setDepartmentUsers(usersInFaculty);
    setSelectedUser("");
    setSelectedTemplate("");
    setDownloadUrl(null);
    setDownloadUrlDocx(null);
    // eslint-disable-next-line
  }, [selectedFaculty, allUsers]);

  // Filter departmentUsers when selectedDepartment changes
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
    setSelectedUser("");
    setSelectedTemplate("");
    setDownloadUrl(null);
    setDownloadUrlDocx(null);
    // eslint-disable-next-line
  }, [selectedDepartment, facultyUsers]);

  const handleFacultySelect = (event) => {
    setSelectedFaculty(event.target.value);
  };

  const handleDepartmentSelect = (event) => {
    setSelectedDepartment(event.target.value);
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
    if (!selectedUser || !selectedTemplate) {
      alert("Please select a user and template");
      return;
    }

    setBuildingLatex(true);

    try {
      // Find the selected user object
      const userObject = (selectedDepartment ? departmentUsers : facultyUsers).find(
        (user) => user.user_id === selectedUser
      );

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
      <FacultyAdminMenu 
        getCognitoUser={getCognitoUser} 
        userName={userInfo.preferred_name || userInfo.first_name}
        userInfo={userInfo}
        toggleViewMode={toggleViewMode}
      />
      <main className="px-16 overflow-auto custom-scrollbar w-full mb-4">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <div className="">
            <h1 className="text-left my-4 text-4xl font-bold text-zinc-600">Generate CV</h1>

            {/* Faculty Field */}
            <div className="my-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Faculty</label>
              {userInfo.role === "Admin" ? (
                <select
                  className="select select-bordered w-full max-w-md"
                  value={selectedFaculty}
                  onChange={handleFacultySelect}
                >
                  <option value="">All</option>
                  {allFaculties.map((faculty) => (
                    <option key={faculty} value={faculty}>
                      {faculty}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="input input-bordered w-full max-w-md bg-gray-100"
                  value={selectedFaculty}
                  disabled
                  readOnly
                />
              )}
            </div>

            {/* Department Selection */}
            <div className="my-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Department (or choose "All" to see all faculty users)
              </label>
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
                className="select select-bordered w-full max-w-md"
                value={selectedUser}
                onChange={handleUserSelect}
              >
                <option value="">Choose a faculty member...</option>
                {departmentUsers.map((user) => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.preferred_name || user.first_name} {user.last_name} ({user.email})
                    {user.primary_department && ` - ${user.primary_department}`}
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
                    className={`select select-bordered w-full max-w-md ${
                      !selectedUser ? "select-disabled bg-gray-100" : ""
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
                  {!selectedUser ? (
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
                    disabled={buildingLatex || !selectedUser}
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

export default FacultyAdminGenerateCV;
