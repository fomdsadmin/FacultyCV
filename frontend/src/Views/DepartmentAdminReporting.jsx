import React from "react";
import { useState, useEffect } from "react";
import PageContainer from "./PageContainer.jsx";
import DepartmentAdminMenu from "../Components/DepartmentAdminMenu.jsx";
import { getAllUsers, getAllSections, getDepartmentCVData } from "../graphql/graphqlHelpers.js";
import "../CustomStyles/scrollbar.css";
import { useNotification } from "../Contexts/NotificationContext.jsx";

const DepartmentAdminReporting = ({ getCognitoUser, userInfo }) => {
  const [selectedUsers, setSelectedUsers] = useState([]); // Changed to array for multiple selection
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [selectedReportType, setSelectedReportType] = useState(""); // publications or other
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(""); // for super admin
  const [allDepartments, setAllDepartments] = useState([]); // for super admin
  const [allUsers, setAllUsers] = useState([]); // store all users for filtering
  const [userSearchTerm, setUserSearchTerm] = useState(""); // New state for user search
  const [dropdownOpen, setDropdownOpen] = useState(false); // Add this state to manage the dropdown visibility
  const [selectAll, setSelectAll] = useState(true); // Track if all users are selected
  const [dataSections, setDataSections] = useState([]); // Store data sections
  const { setNotification } = useNotification();


  const reportTypes = [
    { value: "publications", label: "Publications Report" },
  ];

  useEffect(() => {
    // Initial load: all users and data sections
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [users, sections] = await Promise.all([
          getAllUsers(),
          getAllSections()
        ]);
        
        setAllUsers(users);
        setDataSections(sections);

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
      // Select all users by default
      setSelectedUsers(usersInDepartment.map(user => user.user_id));
      setSelectAll(true);
      setDownloadUrl(null);
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
      // Select all users by default
      setSelectedUsers(usersInDepartment.map(user => user.user_id));
      setSelectAll(true);
    }
    // eslint-disable-next-line
  }, [allUsers, userInfo]);

  // When isDepartmentWide changes, update selectedUsers accordingly
  useEffect(() => {
    // Update selectAll state when selectedUsers changes
    setSelectAll(selectedUsers.length === departmentUsers.length && departmentUsers.length > 0);
    // eslint-disable-next-line
  }, [selectedUsers, departmentUsers]);

  const handleUserToggle = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
    setDownloadUrl(null);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(departmentUsers.map(user => user.user_id));
    }
    setDownloadUrl(null);
  };

  const handleReportTypeSelect = (reportType) => {
    setSelectedReportType(reportType);
    setDownloadUrl(null);
  };

  // Helper function to convert publication data to CSV
  const convertPublicationsToCSV = (publicationsData) => {
    if (!publicationsData || publicationsData.length === 0) {
      return "No publications data found";
    }

    // Define CSV headers
    const headers = [
      "End Date",
      "Doi",
      "Link",
      "Title",
      "Journal Title",
      "Keywords",
      "Author Names", 
      "Publication ID",
      "Volume",
      "Article Number",
      "Citation",
      "Role",
      "Publication Type",
      "Publication Status",
      "Peer Reviewed"
      
    ];

    // Create CSV rows
    const csvRows = [headers.join(",")];

    publicationsData.forEach((publication) => {
      try {
        const details = JSON.parse(publication.data_details);
        
        // Extract relevant fields, handling different data structures and empty values
        const endDate = details.end_date || details.year_published || details.year || "";
        const doi = details.doi || "";
        const link = details.link || details.url || "";
        const title = details.title || details.publication_title || "";
        const journalTitle = details.journal_title || details.journal || details.publication_name || details.source || "";
        const keywords = details.keywords || "";
        const authorNames = details.author_names || details.authors || "";
        const publicationId = details.publication_id || "";
        const volume = details.volume || "";
        const articleNumber = details.article_number || "";
        const citation = details.citation || "";
        const role = details.role || "";
        const publicationType = details.publication_type || details.type || "";
        const publicationStatus = details.publication_status || "";
        const peerReviewed = details.peer_reviewed || "";

        // Escape quotes and commas in CSV values
        const escapeCSV = (value) => {
          if (value == null || value === undefined) return "";
          if (typeof value !== "string") value = String(value);
          if (value.includes(",") || value.includes('"') || value.includes("\n")) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        };

        const row = [
          escapeCSV(endDate),
          escapeCSV(doi),
          escapeCSV(link),
          escapeCSV(title),
          escapeCSV(journalTitle),
          escapeCSV(keywords),
          escapeCSV(authorNames),
          escapeCSV(publicationId),
          escapeCSV(volume),
          escapeCSV(articleNumber),
          escapeCSV(citation),
          escapeCSV(role),
          escapeCSV(publicationType),
          escapeCSV(publicationStatus),
          escapeCSV(peerReviewed)
        ];

        csvRows.push(row.join(","));
      } catch (error) {
        console.error("Error parsing publication data:", error);
        // Add empty row if parsing fails to maintain structure
        const emptyRow = new Array(headers.length).fill("");
        csvRows.push(emptyRow.join(","));
      }
    });

    return csvRows.join("\n");
  };

  const handleUserSearchChange = (event) => {
    setUserSearchTerm(event.target.value);
    // Automatically open dropdown when user starts typing in search field
    if (event.target.value && !dropdownOpen) {
      setDropdownOpen(true);
    }
  };

  // Filter users based on search term
  const filteredUsers = departmentUsers
    .filter(user => 
      (user.preferred_name && user.preferred_name.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
      (user.first_name && user.first_name.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
      (user.last_name && user.last_name.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
      (user.username && user.username.toLowerCase().includes(userSearchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      // If selectAll is false and users are manually selected, sort selected users to the top
      if (!selectAll) {
        const aSelected = selectedUsers.includes(a.user_id);
        const bSelected = selectedUsers.includes(b.user_id);
        
        if (aSelected && !bSelected) return -1; // a comes first
        if (!aSelected && bSelected) return 1;  // b comes first
        // If both selected or both unselected, maintain original order
      }
      return 0; // Maintain original order for other cases
    });

  const handleGenerateReport = async () => {
    if (selectedUsers.length === 0 || !selectedReportType) {
      alert("Please select at least one faculty member and a report type");
      return;
    }

    setGeneratingReport(true);

    try {
      // Find the publications section IDs (both regular and other publications)
      const publicationSection = dataSections.find(
        (section) => section.title.includes("Publication") && !section.title.includes("Other")
      );
      const otherPublicationSection = dataSections.find(
        (section) => section.title.includes("Publication") && section.title.includes("Other")
      );

      if (!publicationSection && !otherPublicationSection) {
        throw new Error("No publications sections found");
      }

      // Determine department and user IDs for the query
      let departmentForQuery;
      let userIdsForQuery = null;

      if (selectAll) {
        // If all users are selected, use department-wide approach
        if (userInfo.role === "Admin") {
          departmentForQuery = selectedDepartment === "All" ? 'All' : selectedDepartment;
        } else if (userInfo.role.startsWith("Admin-")) {
          departmentForQuery = userInfo.role.split("-")[1];
        }
        // console.log("Fetching publications for entire department:", departmentForQuery);
      } else {
        // If specific users are selected, use user IDs approach
        departmentForQuery = ''; // Empty string when using user IDs
        userIdsForQuery = selectedUsers;
        // console.log("Fetching publications for specific users:", userIdsForQuery);
      }

      // Create promises for both publication types
      const promises = [];

      if (publicationSection) {
        promises.push(
          getDepartmentCVData(publicationSection.data_section_id, departmentForQuery, "All", userIdsForQuery)
            .then((response) => ({ type: "publication", data: response.data }))
            .catch(() => ({ type: "publication", data: [] }))
        );
      }

      if (otherPublicationSection) {
        promises.push(
          getDepartmentCVData(otherPublicationSection.data_section_id, departmentForQuery, "All", userIdsForQuery)
            .then((response) => ({ type: "otherPublication", data: response.data }))
            .catch(() => ({ type: "otherPublication", data: [] }))
        );
      }

      // Execute all promises in parallel
      const results = await Promise.all(promises);

      // Combine all publications data
      let allPublications = [];
      results.forEach((result) => {
        if (result.data && result.data.length > 0) {
          allPublications.push(...result.data);
        }
      });

      // onsole.log("Combined publications data received:", allPublications);

      // Convert to CSV
      const csvData = convertPublicationsToCSV(allPublications);
      
      // Create download blob
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      setDownloadUrl(url);
      setNotification(true);
    } catch (error) {
      console.error("Error generating report:", error);
      alert(`Error generating report: ${error.message}`);
    }

    setGeneratingReport(false);
  };

  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${selectedReportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Clean up the URL
      URL.revokeObjectURL(downloadUrl);
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
          <div className="max-w-7xl">
            <h1 className="text-left my-4 text-4xl font-bold text-zinc-600">Department Reports</h1>

            {/* Main Content Grid - Left and Right Sections */}
            <div className="flex flex-col lg:flex-row gap-6 mb-8">
              
              {/* Left Section - Department and Report Type */}
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
                      <option value="All">All Departments</option>
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

                {/* Report Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                  <div className="space-y-3">
                    {reportTypes.map((reportType) => (
                      <div
                        key={reportType.value}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedReportType === reportType.value
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => handleReportTypeSelect(reportType.value)}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            className="radio radio-primary"
                            checked={selectedReportType === reportType.value}
                            readOnly
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-700">{reportType.label}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Section - Faculty Selection */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Faculty Members</label>
                
                {/* Search and Select All Controls */}
                <div className="space-y-4 mb-4">
                  <input
                    type="text"
                    className="input input-bordered w-full text-sm font-medium"
                    placeholder="Search by name, email, or username..."
                    value={userSearchTerm}
                    onChange={handleUserSearchChange}
                  />
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Select All ({departmentUsers.length} faculty members)
                    </label>
                  </div>
                </div>

                {/* Faculty List */}
                <div className="border rounded-lg max-h-80 overflow-y-auto custom-scrollbar bg-white">
                  {filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {userSearchTerm ? "No faculty members match your search" : "No faculty members found"}
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div key={user.user_id} className="flex items-center gap-2 px-4 py-3 border-b hover:bg-gray-50">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm checkbox-secondary"
                          checked={selectedUsers.includes(user.user_id)}
                          onChange={() => handleUserToggle(user.user_id)}
                        />
                        <div className="flex-1">
                          <div className="text-sm text-gray-900">
                            {(user.preferred_name || user.first_name) + " " + user.last_name}
                          </div>
                          {user.email && user.email.trim() !== "" && user.email !== "null" && user.email !== "undefined" && (
                            <div className="text-xs text-gray-500">{user.email}</div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Selected Count */}
                <div className="mt-2 text-sm text-gray-600 align-right text-right">
                  {selectedUsers.length} / {departmentUsers.length} selected
                </div>
              </div>
            </div>

            {/* Generate Report Button */}
            <div className="mb-6">
              <button
                className="btn btn-primary btn-md w-full max-w-md"
                onClick={handleGenerateReport}
                disabled={generatingReport || selectedUsers.length === 0 || !selectedReportType}
              >
                {generatingReport ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Generating Report...
                  </>
                ) : (
                  "Generate Report"
                )}
              </button>
            </div>

            {/* Report Status and Download Section */}
            <div className="space-y-4">
              {/* Report Ready Section */}
              {downloadUrl && (
                <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-green-800">Report Ready!</h3>
                      <p className="text-sm text-green-600">
                        Your {reportTypes.find(rt => rt.value === selectedReportType)?.label} is ready for download.
                      </p>
                    </div>
                    <button
                      className="btn btn-success btn-md"
                      onClick={handleDownload}
                      disabled={!downloadUrl}
                    >
                      Download CSV
                    </button>
                  </div>
                </div>
              )}

              {/* Report Generating Section */}
              {generatingReport && (
                <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="loading loading-spinner loading-md text-blue-600"></span>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-800">Generating Report...</h3>
                      <p className="text-blue-700">
                        Please wait while we compile the report for {selectedUsers.length} faculty member(s).
                        This may take a few moments...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </PageContainer>
  );
};

export default DepartmentAdminReporting;
