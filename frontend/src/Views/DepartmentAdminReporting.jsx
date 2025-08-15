import React from "react";
import { useState, useEffect } from "react";
import PageContainer from "./PageContainer.jsx";
import DepartmentAdminMenu from "../Components/DepartmentAdminMenu.jsx";
import { getAllUsers, getAllSections, getDepartmentCVData } from "../graphql/graphqlHelpers.js";
import "../CustomStyles/scrollbar.css";
import { useNotification } from "../Contexts/NotificationContext.jsx";
import { 
  reportTypes, 
  csvFieldConfigs, 
  getReportTypeConfig, 
  isReportTypeSupported,
  getCsvFieldConfig 
} from "../Config/reportTypesConfig.js";

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

  // Generic CSV conversion function
  const convertDataToCSV = (data, reportType) => {
    if (!data || data.length === 0) {
      return `No ${reportType} data found`;
    }

    const config = getCsvFieldConfig(reportType);
    if (!config) {
      return "Unsupported report type";
    }

    const { headers, fieldMappings } = config;
    const csvRows = [headers.join(",")];

    data.forEach((item) => {
      try {
        const details = JSON.parse(item.data_details);
        
        const row = fieldMappings.map(mapping => {
          // Try each field in the mapping until we find a value
          let value = "";
          for (const field of mapping.fields) {
            if (details[field] !== undefined && details[field] !== null && details[field] !== "") {
              value = details[field];
              break;
            }
          }
          
          // Special case: For presentations, if "Type of Presentation" is empty, default to "Invited Presentation"
          if (reportType === "presentations" && mapping.header === "Type of Presentation" && value === "") {
            value = "Invited Presentation";
          }
          
          // Preserve original formatting for date fields
          return escapeCSV(value);
        });

        csvRows.push(row.join(","));
      } catch (error) {
        console.error(`Error parsing ${reportType} data:`, error);
        // Add empty row if parsing fails to maintain structure
        const emptyRow = new Array(headers.length).fill("");
        csvRows.push(emptyRow.join(","));
      }
    });

    return csvRows.join("\n");
  };

  // Helper function to escape CSV values and preserve date formatting
  const escapeCSV = (value) => {
    if (value == null || value === undefined) return "";
    if (typeof value !== "string") value = String(value);
    
    // Preserve original date format - don't let JavaScript parse dates
    // This prevents "August 2005" from becoming "8/1/2005"
    if (value.includes(',') || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
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

  // Generic function to fetch data for any report type
  const fetchReportData = async (reportType, departmentForQuery, userIdsForQuery) => {
    const reportConfig = getReportTypeConfig(reportType);
    if (!reportConfig) {
      throw new Error(`Unknown report type: ${reportType}`);
    }

    if (!isReportTypeSupported(reportType)) {
      throw new Error(`Report type "${reportConfig.label}" is not yet implemented`);
    }

    // Find relevant sections based on the report type configuration
    const relevantSections = dataSections.filter(section => 
      reportConfig.sectionNames.some(sectionName => 
        section.title.toLowerCase().includes(sectionName.toLowerCase())
      )
    );

    if (relevantSections.length === 0) {
      console.warn(`No sections found for ${reportConfig.label}. Available sections:`, dataSections.map(s => s.title));
      throw new Error(`No relevant sections found for ${reportConfig.label}. Please ensure the data sections are properly configured.`);
    }

    // Create promises for all relevant sections
    const promises = relevantSections.map(section =>
      getDepartmentCVData(section.data_section_id, departmentForQuery, "All", userIdsForQuery)
        .then((response) => ({ 
          sectionId: section.data_section_id, 
          sectionTitle: section.title,
          data: response.data || []
        }))
        .catch((error) => {
          console.warn(`Failed to fetch data for section ${section.title}:`, error);
          return { 
            sectionId: section.data_section_id, 
            sectionTitle: section.title,
            data: [] 
          };
        })
    );

    // Execute all promises in parallel
    const results = await Promise.all(promises);

    // Combine all data
    let allData = [];
    results.forEach((result) => {
      if (result.data && result.data.length > 0) {
        allData.push(...result.data);
      }
    });
    // console.log(allData);
    return {
      data: allData,
      sections: results,
      reportType: reportType,
      reportConfig: reportConfig
    };
  };

  const handleGenerateReport = async () => {
    if (selectedUsers.length === 0 || !selectedReportType) {
      alert("Please select at least one faculty member and a report type");
      return;
    }

    setGeneratingReport(true);

    try {
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
      } else {
        // If specific users are selected, use user IDs approach
        departmentForQuery = ''; // Empty string when using user IDs
        userIdsForQuery = selectedUsers;
      }

      // Fetch data using the generic function
      const reportResult = await fetchReportData(selectedReportType, departmentForQuery, userIdsForQuery);
      
      // Convert to CSV using the generic function
      const csvData = convertDataToCSV(reportResult.data, selectedReportType);
      
      // Create download blob
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      setDownloadUrl(url);
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
                  <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                    {reportTypes
                      .slice()
                      .sort((a, b) => a.label.localeCompare(b.label))
                      .map((reportType) => (
                      <div
                        key={reportType.value}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedReportType === reportType.value
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => handleReportTypeSelect(reportType.value)}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            className="radio radio-primary mt-1"
                            checked={selectedReportType === reportType.value}
                            readOnly
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-700 mb-1">{reportType.label}</div>
                            <div className="text-xs text-gray-500">{reportType.description}</div>
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
