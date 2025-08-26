import React from "react";
import { useState, useEffect } from "react";
import PageContainer from "./PageContainer.jsx";
import DepartmentAdminMenu from "../Components/DepartmentAdminMenu.jsx";
import FacultyMemberSelector from "../Components/FacultyMemberSelector.jsx";
// ...existing code...
import "../CustomStyles/scrollbar.css";
import { getDownloadUrl, uploadLatexToS3 } from "../utils/reportManagement.js";
import { useNotification } from "../Contexts/NotificationContext.jsx";
import { getUserId } from "../getAuthToken.js";
import { buildLatex } from "../Pages/ReportsPage/LatexFunctions/LatexBuilder.js";
import PDFViewer from "../Components/PDFViewer.jsx";
import { useAuditLogger, AUDIT_ACTIONS } from "../Contexts/AuditLoggerContext.jsx";
import { useAdmin } from "Contexts/AdminContext.jsx";

const DepartmentAdminGenerateCV = ({ getCognitoUser, userInfo }) => {
  const [selectedUsers, setSelectedUsers] = useState([]); // For compatibility with selector
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [templates, setTemplates] = useState([]);
  const [startYear, setStartYear] = useState(new Date().getFullYear() - 10);
  const [endYear, setEndYear] = useState(new Date().getFullYear());
  const [buildingLatex, setBuildingLatex] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadUrlDocx, setDownloadUrlDocx] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState(""); // for super admin
  const [allDepartments, setAllDepartments] = useState([]); // for super admin
  const [users, setUsers] = useState([]); // store all users for filtering
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const { setNotification } = useNotification();
  const { logAction } = useAuditLogger();
  const yearOptions = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);
  const { loading, setLoading, allUsers, allTemplates } = useAdmin();

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
      setDownloadUrl(null);
      setDownloadUrlDocx(null);
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
      setDownloadUrl(null);
      setDownloadUrlDocx(null);
    }
    // eslint-disable-next-line
  }, [selectedDepartment, users, userInfo]);

  // When isDepartmentWide changes, update selectedUser accordingly
  // Reset template/downloads if no user selected
  useEffect(() => {
    if (selectedUsers.length === 0) {
      setSelectedTemplate("");
      setDownloadUrl(null);
      setDownloadUrlDocx(null);
    }
  }, [selectedUsers]);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    // Reset download URLs when template changes
    setDownloadUrl(null);
    setDownloadUrlDocx(null);
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

  const handleGenerate = async () => {
    if (selectedUsers.length === 0 || !selectedTemplate) {
      alert("Please select both a user and a template");
      return;
    }
    setBuildingLatex(true);
    try {
      // Only support single user for CV generation
      const userId = selectedUsers[0];
      const userObject = departmentUsers.find((user) => user.user_id === userId);

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
      link.download = `${selectedUsers.length}_${selectedTemplate.title}_CV.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
            <h1 className="text-left my-4 text-4xl font-bold text-zinc-600">Generate CV</h1>

            {/* Main Content Grid - Left and Right Sections (flex, gap-6) */}
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              {/* Left Section - Department and Templates */}
              <div className="flex-1 space-y-6 max-w-md">
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
                  {/* Date Range Picker and Download Buttons */}
                  {selectedTemplate && (
                    <div className="my-4 mx-auto">
                      <div className="flex space-x-2 p-2">
                        <label className="block font-medium text-zinc-600 my-4">Select Date Range (Year)</label>
                        <div className="">
                          <select
                            className="border rounded px-4 py-4 ml-4"
                            value={startYear}
                            onChange={(e) => setStartYear(Number(e.target.value))}
                          >
                            {yearOptions.map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                          <span className="self-center"> to </span>
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
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Section - Faculty Member Selector */}
              <div className="flex-1 max-w-md">
                <FacultyMemberSelector
                  departmentUsers={departmentUsers}
                  selectedUsers={selectedUsers}
                  onUserToggle={handleUserToggle}
                  selectAll={selectAll}
                  onSelectAll={handleSelectAll}
                  userSearchTerm={userSearchTerm}
                  onUserSearchChange={handleUserSearchChange}
                  showSelectAll={false}
                />
              </div>
            </div>

            {selectedTemplate && (
              <div className="flex flex-col items-center">
                {/* Generate Button */}
                <button
                  className={`w-full btn btn-primary  ${
                    downloadUrl ? "btn-disabled bg-gray-300 text-gray-500 cursor-not-allowed" : ""
                  }`}
                  onClick={handleGenerate}
                  disabled={buildingLatex || selectedUsers.length === 0 || !selectedTemplate || !!downloadUrl}
                >
                  {buildingLatex ? "Generating..." : "Generate"}
                </button>
                {downloadUrl && (
                  <>
                    <div className="w-full text-center mt-4">
                      <h3 className="text-xl font-semibold text-green-600">CV Generated Successfully!</h3>
                    </div>
                    <div className="flex gap-x-2 mr-2 mb-4 align-center items-center">
                          <div className="flex justify-center gap-4 my-4 mb-12">
                            {downloadUrl && (
                              <button className="btn btn-success" style={{ minWidth: '160px' }} onClick={() => handleDownload(downloadUrl, "pdf")}>Download PDF</button>
                            )}
                            {downloadUrlDocx && (
                              <button className="btn btn-success" style={{ minWidth: '160px' }} onClick={() => handleDownload(downloadUrlDocx, "docx")}>Download DOCX</button>
                            )}
                          </div>
                    </div>
                    <div className="w-full flex justify-center">
                      <div className="max-w-2xl w-full">
                        <PDFViewer url={downloadUrl} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex flex-col w-full h-full pb-4">
              {/* Right Panel: Preview/Info */}
              <div className="flex flex-col">
                <div className="w-full h-full max-w-2xl py-2">
                  {buildingLatex ? (
                    <div className="text-left mt-2">
                      <p className=" text-gray-600">
                        Please wait while we generate the CV, you will be notified once it's ready.
                      </p>
                    </div>
                  ) : (
                    <></>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </PageContainer>
  );
};

export default DepartmentAdminGenerateCV;
