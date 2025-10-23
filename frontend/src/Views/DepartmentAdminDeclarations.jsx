import React, { useState, useEffect } from "react";
import PageContainer from "./PageContainer.jsx";
import DepartmentAdminMenu from "../Components/DepartmentAdminMenu.jsx";
import DeclarationViewModal from "../Components/DeclarationViewModal.jsx";
import { normalizeDeclarations } from "../Pages/Declarations/Declarations.jsx";
import { getAllUserDeclarations } from "../graphql/graphqlHelpers.js";
import { useAdmin } from "../Contexts/AdminContext.jsx";
import { FaDownload, FaSearch, FaSpinner } from "react-icons/fa";

const DepartmentAdminDeclarations = ({ getCognitoUser, userInfo, department }) => {
  const { allUsers, isLoading: adminLoading } = useAdmin();

  const [loading, setLoading] = useState(false);
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [userDeclarations, setUserDeclarations] = useState({});
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedDeclaration, setSelectedDeclaration] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => {
    if (!adminLoading && allUsers.length > 0) {
      filterDepartmentUsers();
    }
  }, [allUsers, adminLoading, department]);

  useEffect(() => {
    if (departmentUsers.length > 0) {
      fetchAllDeclarations();
    }
  }, [departmentUsers, selectedYear]);

  const filterDepartmentUsers = () => {
    let filteredUsers = [];

    if (userInfo.role === "Admin" || userInfo.role === "Admin-All") {
      // For super admin, show all users
      filteredUsers = allUsers.filter(
        (user) =>
          user.active &&
          user.approved &&
          !user.pending &&
          !user.terminated &&
          user.role !== "Assistant" &&
          user.role !== "Admin"
      );
    } else if (userInfo.role.startsWith("Admin-")) {
      // For department admin, filter by department
      filteredUsers = allUsers.filter(
        (user) =>
          user.active &&
          user.approved &&
          !user.pending &&
          !user.terminated &&
          user.primary_department === userInfo.role.split("-")[1] &&
          user.role !== "Assistant" &&
          user.role !== "Admin"
      );
    }

    setDepartmentUsers(filteredUsers);
  };

  const fetchAllDeclarations = async () => {
    setLoading(true);
    try {
      let allDeclarations = [];

      // Fetch all declarations for the department in one call
      if (userInfo && userInfo.role) {
        if (userInfo.role === "Admin" || userInfo.role === "Admin-All") {
          allDeclarations = await getAllUserDeclarations("All");
        } else if (userInfo.role.startsWith("Admin-")) {
          let argDepartment = userInfo.role.split("-")[1];
          allDeclarations = await getAllUserDeclarations(argDepartment);
        }
      }
      const normalizedDeclarations = normalizeDeclarations(allDeclarations);

      // Extract unique years from declarations and update available years
      const uniqueYears = [...new Set(normalizedDeclarations.map(declaration => Number(declaration.year)))]
        .filter(year => year && !isNaN(year) && year !== null && year !== undefined)
        .sort((a, b) => b - a); // Sort in descending order (newest first)
      
      setAvailableYears(uniqueYears);

      // Store all declarations and let the filtering logic handle year filtering
      // This simplifies the logic and avoids issues with stale selectedYear values
      const declarationsMap = {};
      
      normalizedDeclarations.forEach((declaration) => {
        if (selectedYear === "all") {
          // For "all" years, create a unique key combining user_id and year
          const uniqueKey = `${declaration.user_id}_${declaration.year}`;
          declarationsMap[uniqueKey] = {
            ...declaration,
            displayKey: uniqueKey,
            originalUserId: declaration.user_id,
          };
        } else {
          // For specific year, only include declarations matching the selected year
          const declarationYear = Number(declaration.year);
          const filterYear = Number(selectedYear);
          
          if (declarationYear === filterYear) {
            declarationsMap[declaration.user_id] = declaration;
          }
        }
      });

      // For specific years, ensure all department users have an entry (even if null)
      if (selectedYear !== "all") {
        departmentUsers.forEach((user) => {
          if (!declarationsMap[user.user_id]) {
            declarationsMap[user.user_id] = null;
          }
        });
      }

      setUserDeclarations(declarationsMap);
    } catch (error) {
      console.error("Error fetching declarations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDeclaration = (user, declaration) => {
    setSelectedUser(user);
    setSelectedDeclaration(declaration);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setSelectedDeclaration(null);
  };

  const handleDownloadPdf = async (user, declaration) => {};

  const formatSubmissionDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getSubmissionStatus = (declaration) => {
    if (!declaration) {
      return { status: "Not Submitted", date: null, hasSubmitted: false };
    }

    // A declaration is considered submitted if it exists and has meaningful content
    // Check if any of the key fields are filled (excluding defaults)
    const hasCoiDeclaration = declaration.coi && declaration.coi !== "";
    const hasMeritDeclaration = declaration.fomMerit && declaration.fomMerit !== "";
    const hasPsaDeclaration = declaration.psa && declaration.psa !== "";
    const hasPromotionDeclaration = declaration.promotion && declaration.promotion !== "";

    // Also check for any text fields that indicate engagement with the form
    const hasTextContent =
      declaration.meritJustification ||
      declaration.psaJustification ||
      declaration.honorific ||
      declaration.supportAnticipated ||
      declaration.promotionPathways;

    const hasDateContent =
      declaration.coiSubmissionDate ||
      declaration.psaSubmissionDate ||
      declaration.promotionSubmissionDate ||
      declaration.promotionEffectiveDate;

    const hasSubmitted =
      hasCoiDeclaration ||
      hasMeritDeclaration ||
      hasPsaDeclaration ||
      hasPromotionDeclaration ||
      hasTextContent ||
      hasDateContent;

    if (hasSubmitted) {
      return {
        status: "Submitted",
        date: declaration.created_on || declaration.updated_at,
        hasSubmitted: true,
      };
    }

    return { status: "Not Submitted", date: null, hasSubmitted: false };
  };

  // Filter users based on search term and status
  let filteredEntries = [];

  if (selectedYear === "all") {
    // For "all" years, start with all department users and add their declarations
    const userDeclarationPairs = [];

    // First, add entries for users who have declarations
    Object.values(userDeclarations)
      .filter((declaration) => declaration != null)
      .forEach((declaration) => {
        const userId = declaration.originalUserId || declaration.user_id;
        const user = departmentUsers.find((u) => u.user_id === userId);
        if (user) {
          userDeclarationPairs.push({ user, declaration });
        }
      });

    // Then, add entries for users who don't have any declarations
    departmentUsers.forEach((user) => {
      const hasDeclaration = userDeclarationPairs.some((pair) => pair.user.user_id === user.user_id);
      if (!hasDeclaration) {
        userDeclarationPairs.push({ user, declaration: null });
      }
    });

    // Apply filters
    filteredEntries = userDeclarationPairs.filter((entry) => {
      const { user, declaration } = entry;
      const submissionStatus = getSubmissionStatus(declaration);

      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.preferred_name && user.preferred_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.primary_department.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "submitted" && submissionStatus.hasSubmitted) ||
        (statusFilter === "pending" && !submissionStatus.hasSubmitted);

      return matchesSearch && matchesStatus;
    });
  } else {
    // For specific years, use original logic
    filteredEntries = departmentUsers
      .filter((user) => {
        const declaration = userDeclarations[user.user_id];
        const submissionStatus = getSubmissionStatus(declaration);

        // Search filter
        const matchesSearch =
          searchTerm === "" ||
          `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase());

        // Status filter
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "submitted" && submissionStatus.hasSubmitted) ||
          (statusFilter === "pending" && !submissionStatus.hasSubmitted);

        return matchesSearch && matchesStatus;
      })
      .map((user) => ({ user, declaration: userDeclarations[user.user_id] }));
  }

  // Sort filtered entries by user's first name, then last name
  filteredEntries.sort((a, b) => {
    const firstNameComparison = a.user.first_name.localeCompare(b.user.first_name);
    if (firstNameComparison !== 0) {
      return firstNameComparison;
    }
    return a.user.last_name.localeCompare(b.user.last_name);
  });

  const exportToCSV = () => {
    const csvData = filteredEntries.map((entry) => {
      const { user, declaration } = entry;
      const submissionStatus = getSubmissionStatus(declaration);

      return {
        "Faculty Name": `${user.first_name} ${user.last_name}`,
        Email: user.email,
        Department: user.primary_department,
        ...(selectedYear === "all" && { "Reporting Year": declaration?.year || "" }),
        Status: submissionStatus.status,
        "Submission Date": submissionStatus.date ? formatSubmissionDate(submissionStatus.date) : "",
        "COI Status": declaration?.coi || "",
        "COI Submission Date": declaration?.coiSubmissionDate
          ? formatSubmissionDate(declaration.coiSubmissionDate)
          : "",
        "FOM Merit Status": declaration?.fomMerit || "",
        "PSA Status": declaration?.psa || "",
        "FOM Merit & PSA Submission Date": declaration?.psaSubmissionDate
          ? formatSubmissionDate(declaration.psaSubmissionDate)
          : "",
        "FOM Promotion Review Status": declaration?.promotion || "",
        "FOM Promotion Effective Date": declaration?.promotionEffectiveDate
          ? `July 1, ${declaration.promotionEffectiveDate}`
          : "",
        "FOM Promotion Anticipated Pathways": declaration?.promotionPathways || "",
        "FOM Promotion Support Anticipated": declaration?.supportAnticipated || "",
        "FOM Promotion Submission Date": declaration?.promotionSubmissionDate
          ? formatSubmissionDate(declaration.promotionSubmissionDate)
          : "",
        "FOM Honorific Impact Report": declaration?.honorific || "",
      };
    });

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => headers.map((header) => `"${row[header] || ""}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `declarations_report_${department}_${selectedYear === "all" ? "all_years" : selectedYear}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate statistics
  let submittedCount, pendingCount;

  if (selectedYear === "all") {
    // For "all" mode, count unique users with at least one submission
    const uniqueUsersWithSubmissions = new Set();
    const uniqueUsersWithoutSubmissions = new Set();

    filteredEntries.forEach((entry) => {
      const hasSubmitted = getSubmissionStatus(entry.declaration).hasSubmitted;
      if (hasSubmitted) {
        uniqueUsersWithSubmissions.add(entry.user.user_id);
      } else {
        uniqueUsersWithoutSubmissions.add(entry.user.user_id);
      }
    });

    // Remove users from pending if they have any submissions
    uniqueUsersWithSubmissions.forEach((userId) => {
      uniqueUsersWithoutSubmissions.delete(userId);
    });

    submittedCount = uniqueUsersWithSubmissions.size;
    pendingCount = uniqueUsersWithoutSubmissions.size;
  } else {
    // For specific years, use simple counting
    submittedCount = filteredEntries.filter((entry) => getSubmissionStatus(entry.declaration).hasSubmitted).length;
    pendingCount = filteredEntries.filter((entry) => !getSubmissionStatus(entry.declaration).hasSubmitted).length;
  }

  const totalCount = departmentUsers.length;

  // Generate year options dynamically based on available years in the data
  const yearOptions = [
    { value: "all", label: "All Years" },
    ...availableYears.map(year => ({
      value: year,
      label: year === currentYear ? `Current (${year})` : year.toString()
    }))
  ];

  // Reset selected year if it's no longer available in the data
  useEffect(() => {
    if (selectedYear !== "all" && availableYears.length > 0 && !availableYears.includes(Number(selectedYear))) {
      // If current year is available, default to it, otherwise fall back to "all"
      if (availableYears.includes(currentYear)) {
        setSelectedYear(currentYear);
      } else {
        setSelectedYear("all");
      }
    }
  }, [availableYears, selectedYear, currentYear]);

  return (
    <PageContainer>
      <DepartmentAdminMenu getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} />
      <main className="px-8 lg:px-12 xl:px-16 2xl:px-20 py-4 w-full min-h-screen bg-zinc-50">
        <div className="mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-zinc-700 mb-1 mt-2">Declarations Report</h1>
              <h2 className="text-xl font-semibold text-blue-700 mb-4 mt-2">
                {userInfo.role === "Admin" || userInfo.role === "Admin-All"
                  ? "All Departments"
                  : userInfo.role.split("-")[1]}
              </h2>
            </div>

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              disabled={filteredEntries.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <FaDownload />
              Export CSV
            </button>
          </div>

          {/* Summary Statistics */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white px-4 rounded-lg shadow-md flex justify-between items-center">
              <h3 className="text-md font-semibold text-zinc-700">Total Faculty</h3>
              <div className="rounded-2xl bg-blue-100 px-4 py-1">
                <p className="text-xl font-bold text-blue-600">{totalCount}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md  flex justify-between items-center">
              <h3 className="text-md font-semibold text-zinc-700">
                {selectedYear === "all" ? "Faculty With Submissions" : "Submitted"}
              </h3>
              <div className="rounded-2xl bg-green-100 px-4 py-1">
                <p className="text-xl font-bold text-green-600">{submittedCount}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md  flex justify-between items-center">
              <h3 className="text-md font-semibold text-zinc-700">
                {selectedYear === "all" ? "Faculty Without Submissions" : "Pending"}
              </h3>
              <div className="rounded-2xl bg-red-100 px-4 py-1">
                <p className="text-xl font-bold text-red-600">{pendingCount}</p>
              </div>
            </div>
          </div>

          {/* Filters and Export */}
          <div className="mb-4 bg-white p-4 rounded-lg shadow-md">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Left side - Search */}
              <div className="flex items-center">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search faculty..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  />
                </div>
              </div>

              {/* Right side - Year Filter, Status Filter, and Export */}
              <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* Year Filter */}
                <div className="flex items-center gap-2">
                  <label htmlFor="year-filter" className="text-sm font-medium text-zinc-600">
                    Reporting Year:
                  </label>
                  <select
                    id="year-filter"
                    value={selectedYear}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedYear(value === "all" ? "all" : Number(value));
                    }}
                    className="px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {yearOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="submitted">Submitted</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Declarations Table */}
          <div className="bg-white rounded-lg shadow-md overflow-y-auto max-h-[55vh]">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Faculty Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Reporting Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Declaration Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Submission Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-zinc-200">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-zinc-500">
                        <div className="flex items-center justify-center gap-2">
                          <FaSpinner className="animate-spin" />
                          Loading declarations...
                        </div>
                      </td>
                    </tr>
                  ) : filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-zinc-500">
                        {departmentUsers.length === 0
                          ? "No faculty members found for this department."
                          : "No faculty members match the current filters."}
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry, index) => {
                      const { user, declaration } = entry;
                      const submissionStatus = getSubmissionStatus(declaration);

                      return (
                        <tr
                          key={selectedYear === "all" ? `${user.user_id}_${declaration?.year}` : user.user_id}
                          className="hover:bg-zinc-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-zinc-900">
                                  {user.first_name} {user.last_name}
                                </div>
                                <div className="text-sm text-zinc-500">{user.cwl_username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-wrap text-sm text-zinc-900">
                            {user.primary_department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                            {selectedYear === "all" 
                              ? (declaration ? declaration.year : "—")
                              : selectedYear
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                submissionStatus.hasSubmitted
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {submissionStatus.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                            {submissionStatus.date ? formatSubmissionDate(submissionStatus.date) : "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                            {declaration ? (declaration.created_by ? declaration.created_by : "—") : "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              {submissionStatus.hasSubmitted ? (
                                <>
                                  <button
                                    onClick={() => handleViewDeclaration(user, declaration)}
                                    className="text-blue-600 hover:text-blue-900 transition-colors"
                                  >
                                    View
                                  </button>
                                  {/* <span className="text-gray-300">|</span>
                                  <button
                                    onClick={() => handleDownloadPdf(user, declaration)}
                                    disabled={false}
                                    className="flex items-center space-x-1 text-green-600 hover:text-green-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Download Declaration PDF"
                                  >
                                    <span>Download PDF</span>
                                  </button> */}
                                </>
                              ) : (
                                <span className="text-zinc-400">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Results Info */}
          {(selectedYear === "all" || filteredEntries.length !== departmentUsers.length) && (
            <div className="mt-4 text-sm text-zinc-600 text-center">
              {selectedYear === "all"
                ? `Showing ${filteredEntries.length} entries from ${
                    new Set(filteredEntries.map((e) => e.user.user_id)).size
                  } faculty members`
                : `Showing ${filteredEntries.length} of ${departmentUsers.length} faculty members`}
            </div>
          )}
        </div>
      </main>

      {/* Declaration View Modal */}
      <DeclarationViewModal
        isOpen={showModal}
        onClose={handleCloseModal}
        declaration={selectedDeclaration}
        user={selectedUser}
        year={selectedDeclaration?.year || selectedYear}
      />
    </PageContainer>
  );
};

export default DepartmentAdminDeclarations;
