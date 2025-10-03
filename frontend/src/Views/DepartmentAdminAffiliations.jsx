import React, { useState, useEffect } from "react";
import PageContainer from "./PageContainer.jsx";
import DepartmentAdminMenu from "../Components/DepartmentAdminMenu.jsx";
import { getUserAffiliations } from "../graphql/graphqlHelpers.js";
import { useAdmin } from "../Contexts/AdminContext.jsx";
import { FaDownload, FaSearch, FaSpinner } from "react-icons/fa";

const DepartmentAdminAffiliations = ({ getCognitoUser, userInfo, department }) => {
  const { allUsers, departmentAffiliations, isLoading: adminLoading } = useAdmin();

  const [loading, setLoading] = useState(false);
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [appointmentTypeFilter, setAppointmentTypeFilter] = useState("all");
  const [healthAuthorityFilter, setHealthAuthorityFilter] = useState("all");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [academicRankFilter, setAcademicRankFilter] = useState("all");
  const [businessTitleFilter, setBusinessTitleFilter] = useState("all");
  const [trackTypeFilter, setTrackTypeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Get current and next year for the filter
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!adminLoading && allUsers.length > 0) {
      filterDepartmentUsers();
    }
  }, [allUsers, adminLoading, department]);


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

  // Helper function to get user affiliations data from context
  const getUserAffiliationData = (userId) => {
    const userAffiliation = departmentAffiliations.find((aff) => aff.user_id === userId);
    if (userAffiliation) {
      // The getDepartmentAffiliations query returns the data directly, not nested in data_details
      const data = {
        primary_unit: userAffiliation.primary_unit,
        joint_units: userAffiliation.joint_units,
        hospital_affiliations: userAffiliation.hospital_affiliations,
      };

      // Parse the JSON strings if they exist
      try {
        if (userAffiliation.primary_unit && typeof userAffiliation.primary_unit === "string") {
          data.primary_unit = JSON.parse(userAffiliation.primary_unit);
        }
        if (userAffiliation.joint_units && typeof userAffiliation.joint_units === "string") {
          data.joint_units = JSON.parse(userAffiliation.joint_units);
        }
        if (userAffiliation.hospital_affiliations && typeof userAffiliation.hospital_affiliations === "string") {
          data.hospital_affiliations = JSON.parse(userAffiliation.hospital_affiliations);
        }
      } catch (e) {
        console.error("Error parsing affiliations JSON:", e);
      }

      return data;
    }
    console.log(`No affiliations found for user ${userId}`);
    return null;
  };

  // Helper function to get primary appointment info
  const getPrimaryAppointment = (userId) => {
    const affiliationData = getUserAffiliationData(userId);
    if (
      affiliationData &&
      affiliationData.primary_unit &&
      Array.isArray(affiliationData.primary_unit) &&
      affiliationData.primary_unit.length > 0
    ) {
      return affiliationData.primary_unit[0];
    }
    return null;
  };

  // Helper function to get joint appointments
  const getJointAppointments = (userId) => {
    const affiliationData = getUserAffiliationData(userId);
    if (affiliationData && affiliationData.joint_units && Array.isArray(affiliationData.joint_units)) {
      return affiliationData.joint_units;
    }
    return [];
  };

  // Helper function to get hospital affiliations
  const getHospitalAffiliations = (userId) => {
    const affiliationData = getUserAffiliationData(userId);
    if (
      affiliationData &&
      affiliationData.hospital_affiliations &&
      Array.isArray(affiliationData.hospital_affiliations)
    ) {
      return affiliationData.hospital_affiliations;
    }
    return [];
  };

  // Helper function to get health authorities for a user
  const getHealthAuthorities = (userId) => {
    const hospitalAffiliations = getHospitalAffiliations(userId);
    return (
      hospitalAffiliations
        .map((ha) => ha.authority)
        .filter((auth) => auth)
        .join(", ") || "—"
    );
  };

  // Helper function to create table rows for a user (could have multiple rows for joint appointments)
  const createUserRows = (user) => {
    const primaryAppointment = getPrimaryAppointment(user.user_id);
    const jointAppointments = getJointAppointments(user.user_id);
    const healthAuthorities = getHealthAuthorities(user.user_id);

    const rows = [];

    // Add primary appointment row
    if (primaryAppointment) {
      rows.push({
        ...user,
        appointmentType: "Primary",
        unit: primaryAppointment.unit || "—",
        rank: primaryAppointment.rank || "—",
        businessTitle: primaryAppointment.title || "—",
        appointmentPercent: primaryAppointment.apt_percent || "—",
        trackType: (primaryAppointment.type ? primaryAppointment.type.toUpperCase() : "") || "—",
        division: (primaryAppointment.additional_info && primaryAppointment.additional_info.division) || "—",
        healthAuthorities: healthAuthorities,
        rowKey: `${user.user_id}_primary`,
      });
    }

    // Add joint appointment rows
    jointAppointments.forEach((jointAppt, index) => {
      rows.push({
        ...user,
        appointmentType: "Joint",
        unit: jointAppt.unit || "—",
        rank: jointAppt.rank || "—",
        businessTitle: jointAppt.title || "—",
        appointmentPercent: jointAppt.apt_percent || "—",
        trackType: (jointAppt.type ? jointAppt.type.toUpperCase() : "") || "—",
        division: (jointAppt.additional_info && jointAppt.additional_info.division) || "—",
        healthAuthorities: healthAuthorities,
        rowKey: `${user.user_id}_joint_${index}`,
      });
    });

    // If no appointments at all, add a row with empty data
    if (rows.length === 0) {
      rows.push({
        ...user,
        appointmentType: "—",
        unit: "—",
        rank: "—",
        businessTitle: "—",
        appointmentPercent: "—",
        trackType: "—",
        division: "—",
        healthAuthorities: healthAuthorities,
        rowKey: `${user.user_id}_none`,
      });
    }

    return rows;
  };

  // Create all user rows (flattened to handle multiple appointments per user)
  const allUserRows = departmentUsers.flatMap((user) => createUserRows(user));

  // Apply filters
  const filteredRows = allUserRows
    .filter((row) => {
      // Filter out users with null, empty, or 'null' string departments
      const hasValidDepartment =
        row.primary_department &&
        row.primary_department.trim() !== "" &&
        row.primary_department.toLowerCase() !== "null";

      if (!hasValidDepartment) {
        return false;
      }

      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        `${row.first_name} ${row.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.preferred_name && row.preferred_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        row.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.primary_department.toLowerCase().includes(searchTerm.toLowerCase());

      // Appointment type filter
      const matchesAppointmentType =
        appointmentTypeFilter === "all" ||
        (appointmentTypeFilter === "primary" && row.appointmentType === "Primary") ||
        (appointmentTypeFilter === "joint" && row.appointmentType === "Joint");

      // Health authority filter
      const matchesHealthAuthority =
        healthAuthorityFilter === "all" ||
        row.healthAuthorities.toLowerCase().includes(healthAuthorityFilter.toLowerCase());

      // Division filter
      const matchesDivision =
        divisionFilter === "all" || row.division.toLowerCase().includes(divisionFilter.toLowerCase());

      // Academic rank filter
      const matchesAcademicRank =
        academicRankFilter === "all" || row.rank.toLowerCase().includes(academicRankFilter.toLowerCase());

      // Business title filter
      const matchesBusinessTitle =
        businessTitleFilter === "all" || row.businessTitle.toLowerCase().includes(businessTitleFilter.toLowerCase());

      // Track type filter
      const matchesTrackType =
        trackTypeFilter === "all" || row.trackType.toLowerCase().includes(trackTypeFilter.toLowerCase());

      // Department filter (only for admin users)
      const matchesDepartment =
        departmentFilter === "all" ||
        !(userInfo.role === "Admin" || userInfo.role === "Admin-All") ||
        row.primary_department === departmentFilter;

      return (
        matchesSearch &&
        matchesAppointmentType &&
        matchesHealthAuthority &&
        matchesDivision &&
        matchesAcademicRank &&
        matchesBusinessTitle &&
        matchesTrackType &&
        matchesDepartment
      );
    })
    .sort((a, b) => {
      // Sort by department first if user is Admin (sees all departments)
      if (userInfo.role === "Admin" || userInfo.role === "Admin-All") {
        const deptComparison = a.primary_department.localeCompare(b.primary_department);
        if (deptComparison !== 0) {
          return deptComparison;
        }
      }

      // Then sort by first name ascending
      return a.first_name.localeCompare(b.first_name);
    });

  const exportToCSV = () => {
    const csvData = filteredRows.map((row) => {
      // Helper function to clean values for CSV
      const cleanValue = (value) => {
        if (!value || value === "—" || value === "null" || value.toString().toLowerCase() === "null") {
          return "";
        }
        return value.toString();
      };

      return {
        "Faculty Name": `${cleanValue(row.first_name)} ${cleanValue(row.last_name)}`.trim(),
        Email: cleanValue(row.email),
        Department: cleanValue(row.primary_department),
        "Appointment Type": cleanValue(row.appointmentType),
        "Academic Unit": cleanValue(row.unit),
        "Academic Rank": cleanValue(row.rank),
        // "Business Title": cleanValue(row.businessTitle),
        "Appointment %": cleanValue(row.appointmentPercent),
        "Track Type": cleanValue(row.trackType),
        Division: cleanValue(row.division),
        "Health Authority": cleanValue(row.healthAuthorities),
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
    link.setAttribute("download", `affiliations_report_${department}_${new Date().getFullYear()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate statistics based on filtered results
  const totalCount = filteredRows.length;
  const primaryAppointmentCount = filteredRows.filter((row) => row.appointmentType === "Primary").length;
  const jointAppointmentCount = filteredRows.filter((row) => row.appointmentType === "Joint").length;

  // Get unique values for filters (only from rows that passed all filters)
  const uniqueHealthAuthorities = [
    ...new Set(filteredRows.map((row) => row.healthAuthorities).filter((ha) => ha !== "—")),
  ];
  const uniqueDivisions = [...new Set(filteredRows.map((row) => row.division).filter((div) => div !== "—"))];
  const uniqueAcademicRanks = [...new Set(filteredRows.map((row) => row.rank).filter((rank) => rank !== "—"))];
  const uniqueBusinessTitles = [
    ...new Set(filteredRows.map((row) => row.businessTitle).filter((title) => title !== "—")),
  ];
  const uniqueTrackTypes = [...new Set(filteredRows.map((row) => row.trackType).filter((track) => track !== "—"))];
  const uniqueDepartments = [
    ...new Set(filteredRows.map((row) => row.primary_department).filter((dept) => dept && dept !== "—")),
  ];

  // Helper function to get count for each filter option
  const getFilterCounts = () => {
    // Get base rows with valid departments only - this is our baseline for counts
    let baseRows = allUserRows.filter(
      (row) =>
        row.primary_department &&
        row.primary_department.trim() !== "" &&
        row.primary_department.toLowerCase() !== "null"
    );

    // If admin has selected a specific department, filter base rows to that department only
    if ((userInfo.role === "Admin" || userInfo.role === "Admin-All") && departmentFilter !== "all") {
      baseRows = baseRows.filter((row) => row.primary_department === departmentFilter);
    }

    // Count appointment types
    const appointmentTypeCounts = {
      all: baseRows.length,
      primary: baseRows.filter((row) => row.appointmentType === "Primary").length,
      joint: baseRows.filter((row) => row.appointmentType === "Joint").length,
    };

    // Count health authorities
    const healthAuthorityCounts = {};
    baseRows.forEach((row) => {
      if (row.healthAuthorities !== "—") {
        healthAuthorityCounts[row.healthAuthorities] = (healthAuthorityCounts[row.healthAuthorities] || 0) + 1;
      }
    });

    // Count divisions
    const divisionCounts = {};
    baseRows.forEach((row) => {
      if (row.division !== "—") {
        divisionCounts[row.division] = (divisionCounts[row.division] || 0) + 1;
      }
    });

    // Count academic ranks
    const academicRankCounts = {};
    baseRows.forEach((row) => {
      if (row.rank !== "—") {
        academicRankCounts[row.rank] = (academicRankCounts[row.rank] || 0) + 1;
      }
    });

    // Count business titles
    const businessTitleCounts = {};
    baseRows.forEach((row) => {
      if (row.businessTitle !== "—") {
        businessTitleCounts[row.businessTitle] = (businessTitleCounts[row.businessTitle] || 0) + 1;
      }
    });

    // Count track types
    const trackTypeCounts = {};
    baseRows.forEach((row) => {
      if (row.trackType !== "—") {
        trackTypeCounts[row.trackType] = (trackTypeCounts[row.trackType] || 0) + 1;
      }
    });

    // Count departments (for admin users)
    const departmentCounts = {};
    baseRows.forEach((row) => {
      if (row.primary_department && row.primary_department !== "—") {
        departmentCounts[row.primary_department] = (departmentCounts[row.primary_department] || 0) + 1;
      }
    });

    return {
      appointmentTypeCounts,
      healthAuthorityCounts,
      divisionCounts,
      academicRankCounts,
      businessTitleCounts,
      trackTypeCounts,
      departmentCounts,
    };
  };

  const {
    appointmentTypeCounts,
    healthAuthorityCounts,
    divisionCounts,
    academicRankCounts,
    businessTitleCounts,
    trackTypeCounts,
    departmentCounts,
  } = getFilterCounts();

  return (
    <PageContainer>
      <DepartmentAdminMenu getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} />
      <main className="px-8 lg:px-12 xl:px-16 2xl:px-20 py-4 w-full min-h-screen bg-zinc-50">
        <div className="mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-zinc-700 mb-1 mt-2">Department Affiliations</h1>
              {userInfo.role === "Admin" || userInfo.role === "Admin-All" ? (
                /* Department Dropdown for Admin */
                uniqueDepartments.length > 0 && (
                  <div className="text-lg max-w-full mt-2 mb-4">
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold text-blue-800"
                    >
                      <option value="all">
                        All Departments
                      </option>
                      {uniqueDepartments.map((department) => (
                        <option key={department} value={department}>
                          {department}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              ) : (
                <h2 className="text-xl font-semibold text-blue-700 mb-4 mt-2">
                  {userInfo.role.split("-")[1]}
                </h2>
              )}
            </div>

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              disabled={filteredRows.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <FaDownload />
              Export CSV
            </button>
          </div>

          {/* Summary Statistics */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
              <h3 className="text-sm font-semibold text-zinc-700">Total Faculty</h3>
              <div className="rounded-xl bg-blue-100 px-3 py-1">
                <p className="text-lg font-bold text-blue-600">{totalCount}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
              <h3 className="text-sm font-semibold text-zinc-700">Primary Appointments</h3>
              <div className="rounded-xl bg-green-100 px-3 py-1">
                <p className="text-lg font-bold text-green-600">{primaryAppointmentCount}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
              <h3 className="text-sm font-semibold text-zinc-700">Joint Appointments</h3>
              <div className="rounded-xl bg-orange-100 px-3 py-1">
                <p className="text-lg font-bold text-orange-600">{jointAppointmentCount}</p>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="mb-2 bg-white px-4 py-3 rounded-lg shadow-md">
            {/* Basic Filters Row */}
            <div className="flex flex-wrap gap-3 items-end mb-3">
              {/* Search Bar */}
              <div className="">
                <label className="block text-xs font-medium text-zinc-600 mb-1">Search Faculty</label>
                <div className="relative max-w-md">
                  <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-zinc-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Search by name, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Appointment Type Filter */}
              <div className="max-w-56">
                <label className="block text-xs font-medium text-zinc-600 mb-1">Appointment Type</label>
                <select
                  value={appointmentTypeFilter}
                  onChange={(e) => setAppointmentTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="all">All Types ({appointmentTypeCounts.all})</option>
                  <option value="primary">Primary ({appointmentTypeCounts.primary})</option>
                  <option value="joint">Joint ({appointmentTypeCounts.joint})</option>
                </select>
              </div>

              {/* Academic Rank Filter */}
              {uniqueAcademicRanks.length > 0 && (
                <div className="max-w-56">
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Academic Rank</label>
                  <select
                    value={academicRankFilter}
                    onChange={(e) => setAcademicRankFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="all">
                      All Ranks ({Object.values(academicRankCounts).reduce((a, b) => a + b, 0)})
                    </option>
                    {uniqueAcademicRanks.map((rank) => (
                      <option key={rank} value={rank}>
                        {rank} ({academicRankCounts[rank] || 0})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Show More Filters Button */}
              <button
                onClick={() => setShowMoreFilters(!showMoreFilters)}
                className="px-3 py-2 text-xs text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
              >
                {showMoreFilters ? "Show Less" : "Show More Filters"}
              </button>
            </div>

            {/* Advanced Filters (Conditional) */}
            {showMoreFilters && (
              <div className="flex flex-wrap gap-3 items-end border-t border-zinc-200 pt-3 mt-1">
                {/* Business Title Filter */}
                {/* {uniqueBusinessTitles.length > 0 && (
                  <div className="max-w-56">
                    <label className="block text-xs font-medium text-zinc-600 mb-1">Business Title</label>
                    <select
                      value={businessTitleFilter}
                      onChange={(e) => setBusinessTitleFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="all">
                        All Business Titles ({Object.values(businessTitleCounts).reduce((a, b) => a + b, 0)})
                      </option>
                      {uniqueBusinessTitles.map((title) => (
                        <option key={title} value={title}>
                          {title} ({businessTitleCounts[title] || 0})
                        </option>
                      ))}
                    </select>
                  </div>
                )} */}

                {/* Track Type Filter */}
                {uniqueTrackTypes.length > 0 && (
                  <div className="max-w-56">
                    <label className="block text-xs font-medium text-zinc-600 mb-1">Track Type</label>
                    <select
                      value={trackTypeFilter}
                      onChange={(e) => setTrackTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="all">
                        All Track Types ({Object.values(trackTypeCounts).reduce((a, b) => a + b, 0)})
                      </option>
                      {uniqueTrackTypes.map((trackType) => (
                        <option key={trackType} value={trackType}>
                          {trackType} ({trackTypeCounts[trackType] || 0})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Division Filter */}
                {uniqueDivisions.length > 0 && (
                  <div className="max-w-56">
                    <label className="block text-xs font-medium text-zinc-600 mb-1">Division</label>
                    <select
                      value={divisionFilter}
                      onChange={(e) => setDivisionFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="all">
                        All Divisions ({Object.values(divisionCounts).reduce((a, b) => a + b, 0)})
                      </option>
                      {uniqueDivisions.map((division) => (
                        <option key={division} value={division}>
                          {division} ({divisionCounts[division] || 0})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Health Authority Filter */}
                {uniqueHealthAuthorities.length > 0 && (
                  <div className="max-w-56">
                    <label className="block text-xs font-medium text-zinc-600 mb-1">Health Authority</label>
                    <select
                      value={healthAuthorityFilter}
                      onChange={(e) => setHealthAuthorityFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="all">
                        All Authorities ({Object.values(healthAuthorityCounts).reduce((a, b) => a + b, 0)})
                      </option>
                      {uniqueHealthAuthorities.map((authority) => (
                        <option key={authority} value={authority}>
                          {authority} ({healthAuthorityCounts[authority] || 0})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Clear Filters Button */}
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setAppointmentTypeFilter("all");
                    setHealthAuthorityFilter("all");
                    setDivisionFilter("all");
                    setAcademicRankFilter("all");
                    setBusinessTitleFilter("all");
                    setTrackTypeFilter("all");
                    setDepartmentFilter("all");
                  }}
                  className="px-3 py-2 text-xs text-zinc-600 border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="mb-3 flex justify-end items-center">
            <div className="text-sm text-zinc-600">
              <span className="font-medium">Showing {filteredRows.length} appointments</span>{" "}
              <span className="text-zinc-500">
                ({new Set(filteredRows.map((r) => r.user_id)).size} unique faculty members)
              </span>
            </div>
          </div>
          {/* Affiliations Table */}
          <div className="bg-white rounded-lg shadow-md overflow-auto max-h-[40vh] xl:max-h-[40vh] 2xl:max-h-[50vh] 3xl:max-h-[60vh]">
            <table className="min-w-full table-fixed divide-y divide-zinc-200">
              <thead className="bg-zinc-50 sticky top-0 z-10">
                <tr>
                  <th className="w-48 px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider bg-zinc-50">
                    Faculty Member
                  </th>
                  <th className="w-32 px-3 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider bg-zinc-50">
                    Primary Department
                  </th>
                  <th className="w-24 px-3 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider bg-zinc-50">
                    Appointment Type
                  </th>
                  <th className="w-40 px-3 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider bg-zinc-50">
                    Academic Unit
                  </th>
                  <th className="w-32 px-3 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider bg-zinc-50">
                    Academic Rank
                  </th>
                  {/* <th className="w-32 px-3 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider bg-zinc-50">
                    Business Title
                  </th> */}
                  <th className="w-16 px-2 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider bg-zinc-50">
                    %
                  </th>
                  <th className="w-24 px-3 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider bg-zinc-50">
                    Track Type
                  </th>
                  <th className="w-32 px-3 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider bg-zinc-50">
                    Division
                  </th>
                  <th className="w-40 px-3 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider bg-zinc-50">
                    Health Authority
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-zinc-200">
                {adminLoading ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-4 text-center text-zinc-500">
                      <div className="flex items-center justify-center gap-2">
                        <FaSpinner className="animate-spin" />
                        Loading affiliations...
                      </div>
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-4 text-center text-zinc-500">
                      {departmentUsers.length === 0
                        ? "No faculty members found for this department."
                        : "No faculty members match the current filters."}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    return (
                      <tr key={row.rowKey} className="hover:bg-zinc-50">
                        <td className="w-48 px-4 py-4">
                          <div className="flex items-center">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-zinc-900 break-words">
                                {row.first_name} {row.last_name}
                              </div>
                              <div className="text-sm text-zinc-500 break-words">{row.cwl_username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="w-32 px-3 py-4 text-sm text-zinc-900">
                          <div className="break-words leading-tight">{row.primary_department}</div>
                        </td>
                        <td className="w-24 px-3 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              row.appointmentType === "Primary"
                                ? "bg-blue-100 text-blue-800"
                                : row.appointmentType === "Joint"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {row.appointmentType}
                          </span>
                        </td>
                        <td className="w-40 px-3 py-4 text-sm text-zinc-900">
                          <div className="break-words leading-tight">{row.unit}</div>
                        </td>
                        <td className="w-32 px-3 py-4 text-sm text-zinc-900">
                          <div className="break-words leading-tight">{row.rank}</div>
                        </td>
                        {/* <td className="w-32 px-3 py-4 text-sm text-zinc-900">
                          <div className="break-words leading-tight">{row.businessTitle}</div>
                        </td> */}
                        <td className="w-16 px-2 py-4 text-sm text-zinc-900 text-center">{row.appointmentPercent}</td>
                        <td className="w-24 px-3 py-4 text-sm text-zinc-900">
                          <div className="break-words leading-tight">{row.trackType}</div>
                        </td>
                        <td className="w-32 px-3 py-4 text-sm text-zinc-900">
                          <div className="break-words leading-tight">{row.division}</div>
                        </td>
                        <td className="w-40 px-3 py-4 text-sm text-zinc-900">
                          <div className="break-words leading-tight">{row.healthAuthorities}</div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </PageContainer>
  );
};

export default DepartmentAdminAffiliations;
