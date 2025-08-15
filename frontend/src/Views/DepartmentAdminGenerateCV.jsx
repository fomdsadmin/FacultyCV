import React from "react";
import { useState, useEffect } from "react";
import PageContainer from "./PageContainer.jsx";
import DepartmentAdminMenu from "../Components/DepartmentAdminMenu.jsx";
import { getAllTemplates, getAllUsers } from "../graphql/graphqlHelpers.js";
import "../CustomStyles/scrollbar.css";
import { getDownloadUrl, uploadLatexToS3 } from "../utils/reportManagement.js";
import { useNotification } from "../Contexts/NotificationContext.jsx";
import { getUserId } from "../getAuthToken.js";
import { buildLatex } from "../Pages/ReportsPage/LatexFunctions/LatexBuilder.js";
import PDFViewer from "../Components/PDFViewer.jsx";
import DepartmentGenerateAllConfirmModal from "../Components/DepartmentGenerateAllConfirmModal.jsx";


const DepartmentAdminGenerateCV = ({ getCognitoUser, userInfo }) => {
  const [selectedUser, setSelectedUser] = useState("");
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
  const [selectedDepartment, setSelectedDepartment] = useState(""); // for super admin
  const [allDepartments, setAllDepartments] = useState([]); // for super admin
  const [isDepartmentWide, setIsDepartmentWide] = useState(false); // for department-wide CV generation
  const [allUsers, setAllUsers] = useState([]); // store all users for filtering
  const [showGenerateAllModal, setShowGenerateAllModal] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState(""); // New state for user search
  const [dropdownOpen, setDropdownOpen] = useState(false); // Add this state to manage the dropdown visibility
  const { setNotification } = useNotification();

  const yearOptions = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    // Initial load: templates and all users
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const templatesData = await getAllTemplates();
        setTemplates(templatesData);

        const users = await getAllUsers();
        setAllUsers(users);

        if (userInfo && userInfo.role === "Admin") {
          const departments = Array.from(
            new Set(
              users
                .filter(
                  (u) => 
                    u.primary_department && 
                    u.primary_department !== "null" && 
                    u.primary_department !== "undefined" &&
                    u.primary_department.trim() !== ""
                )
                .map((u) => u.primary_department)
            )
          ).sort();
          setAllDepartments(departments);
          // Add "All" option for super admin
          if (!selectedDepartment) {
            setSelectedDepartment("All");
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
      setLoading(false);
    };
    fetchInitialData();
    // eslint-disable-next-line
  }, []);

  // Filter department users when selectedDepartment or allUsers changes (for super admin)
  useEffect(() => {
    if (userInfo && userInfo.role === "Admin" && allUsers.length > 0 && selectedDepartment) {
      let usersInDepartment;
      if (selectedDepartment === "All") {
        usersInDepartment = allUsers.filter(
          (user) => user.role.toLowerCase().includes("faculty") || user.role.toLowerCase().includes("admin-")
        );
      } else {
        usersInDepartment = allUsers.filter(
          (user) =>
            user.primary_department === selectedDepartment &&
            (user.role.toLowerCase().includes("faculty") || user.role.toLowerCase().includes("admin-"))
        );
      }
      setDepartmentUsers(usersInDepartment);
      setSelectedUser(""); // reset user selection when department changes
      setDownloadUrl(null);
      setDownloadUrlDocx(null);
    }
    // eslint-disable-next-line
  }, [selectedDepartment, allUsers]);

  // For department admin, filter users once after allUsers is loaded
  useEffect(() => {
    if (userInfo && userInfo.role && userInfo.role.startsWith("Admin-") && allUsers.length > 0) {
      const departmentName = userInfo.role.split("-")[1];
      const usersInDepartment = allUsers.filter(
        (user) =>
          user.primary_department === departmentName &&
          (user.role.toLowerCase().includes("faculty") || user.role.toLowerCase().includes("admin-"))
      );
      setDepartmentUsers(usersInDepartment);
    }
    // eslint-disable-next-line
  }, [allUsers, userInfo]);

  // When isDepartmentWide changes, update selectedUser accordingly
  useEffect(() => {
    if (isDepartmentWide) {
      setSelectedUser("All");
      setDownloadUrl(null);
      setDownloadUrlDocx(null);
    } else {
      setSelectedUser("");
      setSelectedTemplate("");
      setDownloadUrl(null);
      setDownloadUrlDocx(null);
    }
    // eslint-disable-next-line
  }, [isDepartmentWide]);

  const handleUserSelect = (event) => {
    setSelectedUser(event.target.value);
    setIsDepartmentWide(event.target.value === "All");
    setDownloadUrl(null);
    setDownloadUrlDocx(null);
    if (event.target.value === "") {
      setSelectedTemplate("");
    }
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

  const handleUserSearchChange = (event) => {
    setUserSearchTerm(event.target.value);
    // Automatically open dropdown when user starts typing in search field
    if (event.target.value && !dropdownOpen && !isDepartmentWide && !selectedUser) {
      setDropdownOpen(true);
    }
    // Close dropdown if search field is emptied
    if (!event.target.value && dropdownOpen) {
      // Optional: you can comment this out if you prefer to keep the dropdown open when clearing search
      // setDropdownOpen(false);
    }
  };

  const searchedTemplates = templates
    .filter((template) => template.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.title.localeCompare(b.title));

  // Filter users based on search term
  const filteredUsers = departmentUsers.filter(user => 
    (user.preferred_name && user.preferred_name.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
    (user.first_name && user.first_name.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
    (user.last_name && user.last_name.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
    (user.username && user.username.toLowerCase().includes(userSearchTerm.toLowerCase()))
  );

  // Stub for department-wide generation
  const handleGenerateAll = () => {
    // TODO: Implement actual logic
    setShowGenerateAllModal(false);
    // last thing, notification
    setNotification(true);

    alert("Department-wide CV generation is not implemented yet.");
  };

  const handleGenerate = async () => {
    if (isDepartmentWide) {
      setShowGenerateAllModal(true);
      return;
    }
    if (!selectedUser || !selectedTemplate) {
      alert("Please select both a user and a template");
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
      <DepartmentAdminMenu getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} />
      <main className="px-16 overflow-auto custom-scrollbar w-full mb-4">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <div className="">
            <h1 className="text-left my-4 text-4xl font-bold text-zinc-600">Generate CV</h1>

            {/* Department Field */}
            <div className="my-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              {userInfo.role === "Admin" ? (
                <select
                  className="select select-bordered w-full max-w-md"
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
                  className="input input-bordered w-full max-w-md bg-gray-100"
                  value={userInfo.role.startsWith("Admin-") ? userInfo.role.split("-")[1] : ""}
                  disabled
                />
              )}
            </div>

            {/* User Selection Dropdown */}
            <div className="my-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Faculty Member</label>
              <div className="flex flex-col gap-4">
                {/* Search field for users */}
                <input
                  type="text"
                  className="input input-bordered w-full max-w-md"
                  placeholder="Search by name, email, or username..."
                  value={userSearchTerm}
                  onChange={handleUserSearchChange}
                  disabled={isDepartmentWide || selectedUser !== ""} // Also disable when a user is selected
                />
                
                {/* Custom dropdown */}
                <div className="relative w-full max-w-md">
                  <button
                    type="button"
                    className="select select-bordered w-full text-left flex items-center justify-between"
                    onClick={() => !isDepartmentWide && setDropdownOpen(!dropdownOpen)}
                    disabled={isDepartmentWide}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>
                        {selectedUser ? (
                          selectedUser === "All" ? 
                          "All Faculty Members" : 
                          departmentUsers.find(u => u.user_id === selectedUser)?.preferred_name || 
                          departmentUsers.find(u => u.user_id === selectedUser)?.first_name + " " + 
                          departmentUsers.find(u => u.user_id === selectedUser)?.last_name
                        ) : "Choose a faculty member..."}
                      </span>
                      <div className="flex items-center">
                        {selectedUser && (
                          <svg
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent dropdown from toggling
                              setSelectedUser("");
                              setIsDepartmentWide(false);
                              setDownloadUrl(null);
                              setDownloadUrlDocx(null);
                              setSelectedTemplate("");
                            }}
                            className="w-4 h-4 mr-2 text-gray-500 hover:text-black cursor-pointer"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                  
                  {dropdownOpen && !isDepartmentWide && (
                    <div className="absolute z-10 w-full bg-white shadow-lg max-h-[40vh] rounded-md py-1 mt-1 overflow-auto custom-scrollbar">
                      <div 
                        className="cursor-pointer hover:bg-gray-100 px-4 py-2"
                        onClick={() => {
                          setSelectedUser("");
                          setDropdownOpen(false);
                          setUserSearchTerm(""); // Clear search term
                        }}
                      >
                        ...
                      </div>
                      
                      {/* {userInfo.role.startsWith("Admin-") && (
                        <div 
                          className="cursor-pointer hover:bg-gray-100 px-4 py-2"
                          onClick={() => {
                            setSelectedUser("All");
                            setIsDepartmentWide(true);
                            setDropdownOpen(false);
                            setUserSearchTerm(""); // Clear search term
                          }}
                        >
                          All Faculty Members
                        </div>
                      )} */}
                      
                      {filteredUsers.map((user) => (
                        <div 
                          key={user.user_id}
                          className="cursor-pointer hover:bg-gray-100 px-4 py-2"
                          onClick={() => {
                            setSelectedUser(user.user_id);
                            setDropdownOpen(false);
                            setUserSearchTerm(""); // Clear search term
                          }}
                        >
                          <div className="font-medium">
                            {(user.preferred_name || user.first_name) + " " + user.last_name}
                          </div>
                          {user.email && user.email.trim() !== "" && user.email !== "null" && user.email !== "undefined" && (
                            <div className="text-sm text-gray-500">{user.email}</div>
                          )}
                          {user.username && user.username.trim() !== "" && user.username !== "null" && user.username !== "undefined" && (
                            <div className="text-sm text-gray-500">{user.username}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* checkbox for department-wide cv (all fac members) */}
                {/* {userInfo.role.startsWith("Admin-") && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={isDepartmentWide}
                      onChange={(e) => setIsDepartmentWide(e.target.checked)}
                    />
                    <label className="ml-2">Generate for all department members</label>
                  </div>
                )} */}
              </div>
            </div>

            <div className="flex flex-col w-full h-full pb-8">
              {/* Left Panel: Template List */}
              <div className="flex flex-col h-full">
                <h2 className="text-sm font-medium text-gray-700 mb-2">Templates</h2>

                {/* List of Templates as a select dropdown (same as above )*/}
                <div className="mb-4">
                  <select
                    className={`select select-bordered w-full max-w-md ${
                      !selectedUser && !isDepartmentWide ? "select-disabled bg-gray-100" : ""
                    }`}
                    value={selectedTemplate?.template_id || ""}
                    onChange={(e) => {
                      const templateId = e.target.value;
                      const template = searchedTemplates.find((t) => t.template_id === templateId);
                      handleTemplateSelect(template || "");
                    }}
                    disabled={!selectedUser && !isDepartmentWide}
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
                      <p>Choose a faculty member from the dropdown above to get started.</p>
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
                      <p className=" text-gray-600">
                        Please wait while we generate the CV, you will be notified once it's ready.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className=" text-gray-600">Click "Generate" to create the CV with the selected parameters.</p>
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
                    disabled={buildingLatex || !selectedUser || !selectedTemplate}
                  >
                    {buildingLatex ? "Generating..." : "Generate"}
                  </button>
                </div>
              )}
            </div>

            <DepartmentGenerateAllConfirmModal
              open={showGenerateAllModal}
              onClose={() => setShowGenerateAllModal(false)}
              onConfirm={handleGenerateAll}
              department={userInfo.role === "Admin" ? selectedDepartment : userInfo.primary_department}
              members={departmentUsers}
              template={selectedTemplate}
              startYear={startYear}
              endYear={endYear}
            />
          </div>
        )}
      </main>
    </PageContainer>
  );
};

export default DepartmentAdminGenerateCV;
