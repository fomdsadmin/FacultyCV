import FacultyMemberSelector from "../Components/FacultyMemberSelector.jsx";
import React from "react";
import { useState, useEffect } from "react";
import PageContainer from "./PageContainer.jsx";
import DepartmentAdminMenu from "../Components/DepartmentAdminMenu.jsx";
import { getAllUsers, getAllSections, getDepartmentCVData } from "../graphql/graphqlHelpers.js";
import "../CustomStyles/scrollbar.css";
import { useNotification } from "../Contexts/NotificationContext.jsx";
// No longer importing static config - we'll generate dynamically from sections
import { useAuditLogger, AUDIT_ACTIONS } from "../Contexts/AuditLoggerContext.jsx";
import { useAdmin } from "Contexts/AdminContext.jsx";

// Config: map section titles to custom display names
// To hide a section entirely, add its title to EXCLUDED_SECTION_TITLES,
// or add its data_section_id to EXCLUDED_SECTION_IDS once known from the API.
const CUSTOM_TITLE_MAPPINGS = {
  "5a. Post-Secondary Education": "Post-Secondary Education",
  "5b. Dissertations": "Dissertations",
  "5c. Continuing Education or Training": "Continuing Education or Training",
  "5d. Continuing Medical Education": "Continuing Medical Education",
  "5e. Professional Qualifications, Certifications and Licenses":
    "Professional Qualifications, Certifications and Licenses",
  "6[a-d]. Employment Record": "Employment Record",
  "6e. Date of granting of tenure at UBC": "Date of granting of tenure at UBC",
  "7a. Leaves of Absence": "Leaves of Absence",
  "8a. Areas of Special Interest and Accomplishments": "Teaching - Special Interests",
  "8b.1. Courses Taught": "Courses Taught",
  "8b.2. Brief Descriptions for Courses Taught": "Brief Descriptions for Courses Taught",
  "8b.3. Clinical Teaching": "Clinical Teaching",
  "8c. Other Teaching of Undergraduates, Graduates, and Postgraduates": "Other Teaching of UG/G/PG",
  "8[f-i]. Other Teaching and Learning Activities": "Teaching - Other Activities",
  "8d.1. Students Supervised": "Students Supervised",
  "8d.2. Graduate Students Supervisory Committee": "Graduate Students Supervisory Committee",
  "8e. Continuing Education Activities": "Continuing Education Activities",
  "9a. Areas of Special Interest and Accomplishments": "Scholarly and Professional Activities - Special Interests",
  "9[b-c]. Research or Equivalent Grants and Contracts": "Research or Equivalent Grants and Contracts",
  "9d. Invited Presentations": "Invited Presentations",
  "9e. Invited Participation": "Invited Participation",
  "9f. Conference Participation": "Conference Participation",
  "9g. Other Presentations": "Other Presentations",
  "9h. Indigenous Scholarly Activity": "Indigenous Scholarly Activity",
  "9i. Scholarship of Education Activities": "Scholarship of Education Activities",
  "9j. Professional Contributions": "Professional Contributions",
  "10a. Areas of Special Interest and Accomplishments": "Service to University - Special Interests",
  "10b. Areas of Service Undertaken to Advance Inclusion ": "Service to University - Service Undertaken",
  "10[c-e]. Memberships on Committees, Faculty Mentoring, and Other Service":
    "Service to University - Memberships on Committees, Faculty Mentoring, and Other Service",
  "11a. Areas of Special Interest and Accomplishments": "Service to Hospital - Special Interests",
  "11b. Areas of Service Undertaken to Advance Inclusion ": "Service to Hospital - Service Undertaken",
  "11[c-d]. Memberships on Hospital Committees, and Other Service":
    "Service to Hospital - Memberships and Other Service",
  "12a. Areas of Special Interest and Accomplishments": "Service to Community - Special Interests",
  "12b. Areas of Service Undertaken to Advance Inclusion ": "Service to Community - Service Undertaken",
  "12[c-f]. Memberships on Scholarly and Other Committees and Societies":
    "Service to Community - Memberships and Other Committees",
  "12[g-k]. Other Community Service": "Service to Community - Other Community Service",
  "13[a-d]. Awards and Distinctions": "Awards and Distinctions",
  "14a. Other Relevant Information": "Other Relevant Information",
  "a. Areas of Special Interest and Accomplishments": "EL Stream - Special Interests",
  "b. Curriculum Development / Curriculum Renewal": "EL Stream - Curriculum Development / Curriculum Renewal",
  "c. Pedagogical Innovation": "EL Stream - Pedagogical Innovation",
  "d. Application of and Contributions to the Scholarship of Teaching and Learning":
    "EL Stream - Application and Contributions to the Scholarship of Teaching and Learning",
  "e. Teaching and Learning Grants": "EL Stream - Teaching and Learning Grants",
  "f. Formal Educational Leadership Responsibilities": "EL Stream - Formal Educational Leadership Responsibilities",
  "g. Innovation in the Use of Technology": "EL Stream - Innovation in the Use of Technology",
  "h. Other Educational Leadership Contributions": "EL Stream - Other Educational Leadership Contributions",
  "Summary of Student Evaluations of Teaching Effectiveness Scores (EL Steam Only) ":
    "EL Stream - Summary of Student Evaluations of Teaching Effectiveness Scores",
};

// Leave these empty by default. Populate to remove sections from the list.
// Example: new Set(['Invited Presentations'])
const EXCLUDED_SECTION_TITLES = new Set([
  // 'Summary of Student Evaluations of Teaching Effectiveness Scores (EL Steam Only) ',
  // 'h. Other Educational Leadership Contributions',
  // 'g. Innovation in the Use of Technology',
  // 'f. Formal Educational Leadership Responsibilities'
]);

// Example: new Set(['section-uuid-123'])
const EXCLUDED_SECTION_IDS = new Set([]);

// Combined templates: manually define templates that pull data from multiple sections
// You can target sections by exact title (preferred) or hard-coded IDs if needed.
// Optionally provide a csvFieldConfig override to control headers/order across sections.
const COMBINED_TEMPLATES = [
  {
    key: "presentations",
    label: "Presentations",
    description: "Export invited and other presentations and details.",
    sectionTitles: ["Invited Presentations", "Other Presentations"],
    // Optional CSV override; if omitted, we will auto-union fields from all included sections
    csvFieldConfig: {
      headers: [
        "Dates",
        "First Name",
        "Last Name",
        "Role",
        "Scale",
        "Type of Presentation",
        "Organization/Institution/Event",
        "Location",
        "Details",
        "Highlight - Notes",
      ],
      fieldMappings: [
        { header: "Dates", fields: ["dates"] },
        { header: "First Name", fields: ["first_name"] },
        { header: "Last Name", fields: ["last_name"] },
        { header: "Role", fields: ["role"] },
        { header: "Scale", fields: ["scale"] },
        { header: "Type of Presentation", fields: ["type_of_presentation", "type", "presentation_type"] },
        {
          header: "Organization/Institution/Event",
          fields: ["organization", "institution", "event", "event_name", "venue"],
        },
        { header: "Location", fields: ["location"] },
        { header: "Details", fields: ["details", "description"] },
        { header: "Highlight - Notes", fields: ["highlight_notes", "highlight_-_notes"] },
      ],
    },
  },
  {
    key: "service",
    label: "Service",
    description: "Export services to university, community, and hospital.",
    sectionTitles: ["Services to University", "Services to Community", "Services to Hospital"],
    // csvFieldConfig: { headers: [...], fieldMappings: [...] } // Optional
  },
];

const DepartmentAdminAcademicSectionsReporting = ({ getCognitoUser, userInfo, department }) => {
  const [selectedUsers, setSelectedUsers] = useState([]); // Changed to array for multiple selection
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [selectedReportType, setSelectedReportType] = useState(""); // publications or other
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(""); // for super admin
  const [allDepartments, setAllDepartments] = useState([]); // for super admin
  const [users, setUsers] = useState([]); // store all users for filtering
  const [userSearchTerm, setUserSearchTerm] = useState(""); // New state for user search
  const [dropdownOpen, setDropdownOpen] = useState(false); // Add this state to manage the dropdown visibility
  const [selectAll, setSelectAll] = useState(true); // Track if all users are selected
  const [dataSections, setDataSections] = useState([]); // Store data sections
  const [parsedDataSections, setParsedDataSections] = useState([]); // Store parsed data sections
  const [availableReportTypes, setAvailableReportTypes] = useState([]); // Dynamic report types from sections
  const [reportSearchTerm, setReportSearchTerm] = useState(""); // Search for report templates

  // Date range state
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");

  const { setNotification } = useNotification();

  const { logAction } = useAuditLogger();

  const { allUsers, allDataSections } = useAdmin();

  // Helper function to generate year options (from 1950 to current year + 1)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1950; year--) {
      years.push(year);
    }
    return years;
  };

  // Helper function to create a display name from section title, with optional exclusion
  const createDisplayName = (title, sectionId) => {
    // Exclude if requested by title or id
    if (EXCLUDED_SECTION_TITLES.has(title) || (sectionId && EXCLUDED_SECTION_IDS.has(sectionId))) {
      return null; // Signal to drop this section
    }

    // Custom mappings for specific section titles
    if (CUSTOM_TITLE_MAPPINGS[title]) {
      return CUSTOM_TITLE_MAPPINGS[title];
    }

    // Default: use the title as-is
    return title;
  };

  // Helper function to convert camelCase to readable headers
  const camelToReadable = (camelStr) => {
    return camelStr
      .replace(/([A-Z])/g, " $1") // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .trim();
  };

  // Helper function to generate CSV field mappings from section attributes (single section)
  const generateCsvConfig = (section) => {
    let attributes;
    try {
      attributes = typeof section.attributes === "string" ? JSON.parse(section.attributes) : section.attributes;
    } catch (error) {
      console.error("Error parsing section attributes:", error);
      return null;
    }

    const attributeValues = Object.values(attributes);
    const attributeKeysCamel = Object.keys(attributes);

    // Always include first_name and last_name at the beginning
    const headers = ["First Name", "Last Name", ...attributeKeysCamel.map(camelToReadable)];

    const fieldMappings = [
      { header: "First Name", fields: ["first_name"] },
      { header: "Last Name", fields: ["last_name"] },
      ...attributeValues.map((key) => ({
        header: camelToReadable(key),
        fields: [key],
      })),
    ];

    return {
      headers,
      fieldMappings,
    };
  };

  // Helper: generate CSV config by auto-unioning fields across multiple sections
  const generateCombinedCsvConfig = (sections) => {
    const detailFields = new Set();
    sections.forEach((section) => {
      try {
        const attributes = typeof section.attributes === "string" ? JSON.parse(section.attributes) : section.attributes;
        Object.values(attributes || {}).forEach((v) => detailFields.add(v));
      } catch (e) {
        // ignore malformed sections
      }
    });

    const fieldList = Array.from(detailFields);
    const fieldMappings = [
      { header: "First Name", fields: ["first_name"] },
      { header: "Last Name", fields: ["last_name"] },
      ...fieldList.map((f) => ({ header: camelToReadable(f), fields: [f] })),
    ];
    const headers = fieldMappings.map((m) => m.header);
    return { headers, fieldMappings };
  };

  // Helper function to get report type configuration
  const getReportTypeConfig = (sectionId) => {
    return availableReportTypes.find((rt) => rt.value === sectionId);
  };

  // Helper function to get CSV config for a section or combined template
  const getCsvFieldConfig = (sectionOrCombinedId) => {
    // If this is a combined template, use override or union
    const rt = availableReportTypes.find((rt) => rt.value === sectionOrCombinedId);
    if (rt && rt.combinedSectionIds && rt.combinedSectionIds.length > 0) {
      if (rt.csvOverride) {
        // Ensure headers include all mapping headers in order
        const headers =
          rt.csvOverride.headers && rt.csvOverride.headers.length > 0
            ? rt.csvOverride.headers
            : ["First Name", "Last Name", ...rt.csvOverride.fieldMappings.map((m) => m.header)];
        return { headers, fieldMappings: rt.csvOverride.fieldMappings };
      }
      const sections = parsedDataSections.filter((s) => rt.combinedSectionIds.includes(s.data_section_id));
      return generateCombinedCsvConfig(sections);
    }
    // Single section
    const section = parsedDataSections.find((s) => s.data_section_id === sectionOrCombinedId);
    return section ? generateCsvConfig(section) : null;
  };

  useEffect(() => {
    setUsers(allUsers);
  }, [allUsers]);

  useEffect(() => {
    setDataSections(allDataSections);
  }, [allDataSections]);

  useEffect(() => {
    // Initial load: all users and data sections
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Parse sections and filter out archived ones
        const parsedSections = dataSections
          .filter((section) => !section.archive) // Only non-archived sections
          .map((section) => ({
            ...section,
            attributes: typeof section.attributes === "string" ? JSON.parse(section.attributes) : section.attributes,
          }))
          .sort((a, b) => a.title.localeCompare(b.title));

        setParsedDataSections(parsedSections);

        // Generate dynamic report types from sections, honoring exclusions
        const singleReportTypes = parsedSections.flatMap((section) => {
          const displayName = createDisplayName(section.title, section.data_section_id);
          if (displayName === null) {
            return []; // excluded
          }
          return [
            {
              value: section.data_section_id,
              label: displayName,
              description: `Export ${section.title} data for selected faculty members`,
              originalTitle: section.title,
              sectionId: section.data_section_id,
            },
          ];
        });

        // Build combined templates by resolving section titles to IDs
        const titleToId = new Map(parsedSections.map((s) => [s.title, s.data_section_id]));
        const combinedReportTypes = COMBINED_TEMPLATES.flatMap((tpl) => {
          const ids = (tpl.sectionTitles || []).map((title) => titleToId.get(title)).filter(Boolean);
          if (ids.length === 0) return [];
          return [
            {
              value: `combined:${tpl.key}`,
              label: tpl.label,
              description: tpl.description,
              combinedSectionIds: ids,
              csvOverride: tpl.csvFieldConfig || null,
            },
          ];
        });

        const allReportTypes = [...combinedReportTypes, ...singleReportTypes];
        setAvailableReportTypes(allReportTypes);

        // Auto-select the first report type by default
        if (allReportTypes.length > 0 && !selectedReportType) {
          setSelectedReportType(allReportTypes[0].value);
        }

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
  }, [dataSections]);

  // Filter department users when selectedDepartment or allUsers changes (for super admin)
  useEffect(() => {
    if (userInfo && userInfo.role === "Admin" && users.length > 0 && selectedDepartment) {
      let usersInDepartment;
      if (selectedDepartment === "All") {
        usersInDepartment = users.filter(
          (user) => user.role.toLowerCase().includes("faculty") || user.role.toLowerCase().includes("admin-")
        );
      } else {
        usersInDepartment = users.filter(
          (user) =>
            user.primary_department === selectedDepartment &&
            (user.role.toLowerCase().includes("faculty") || user.role.toLowerCase().includes("admin-"))
        );
      }
      setDepartmentUsers(usersInDepartment);
      // Select all users by default
      setSelectedUsers(usersInDepartment.map((user) => user.user_id));
      setSelectAll(true);
      setDownloadUrl(null);
    }
    // eslint-disable-next-line
  }, [selectedDepartment, users]);

  // For department admin, filter users once after allUsers is loaded
  useEffect(() => {
    if (userInfo && userInfo.role && userInfo.role.startsWith("Admin-") && users.length > 0) {
      const departmentName = userInfo.role.split("-")[1];
      const usersInDepartment = users.filter(
        (user) =>
          user.primary_department === departmentName &&
          (user.role.toLowerCase().includes("faculty") || user.role.toLowerCase().includes("admin-"))
      );
      setDepartmentUsers(usersInDepartment);
      // Select all users by default
      setSelectedUsers(usersInDepartment.map((user) => user.user_id));
      setSelectAll(true);
    }
    // eslint-disable-next-line
  }, [users, userInfo]);

  // When isDepartmentWide changes, update selectedUsers accordingly
  useEffect(() => {
    // Update selectAll state when selectedUsers changes
    setSelectAll(selectedUsers.length === departmentUsers.length && departmentUsers.length > 0);
    // eslint-disable-next-line
  }, [selectedUsers, departmentUsers]);

  const handleUserToggle = (userId) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
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
      setSelectedUsers(departmentUsers.map((user) => user.user_id));
    }
    setDownloadUrl(null);
  };

  const handleReportTypeSelect = (reportType) => {
    setSelectedReportType(reportType);
    setDownloadUrl(null);
  };

  // Filter report types based on search term (templates search)
  const filteredReportTypes = availableReportTypes
    .filter((rt) => rt.label.toLowerCase().includes(reportSearchTerm.toLowerCase()))
    .slice()
    .sort((a, b) => a.label.localeCompare(b.label));

  // Generic CSV conversion function
  const convertDataToCSV = (data, sectionId) => {
    if (!data || data.length === 0) {
      const reportType = getReportTypeConfig(sectionId);
      const reportName = reportType ? reportType.label : "report";
      return `No ${reportName.toLowerCase()} data found`;
    }

    const config = getCsvFieldConfig(sectionId);
    if (!config) {
      return "Unable to generate CSV: Section configuration not found";
    }

    const { headers, fieldMappings } = config;
    const csvRows = [headers.join(",")];

    data.forEach((item) => {
      try {
        const details = typeof item.data_details === "string" ? JSON.parse(item.data_details) : item.data_details;

        const row = fieldMappings.map((mapping) => {
          // Try each field in the mapping until we find a value
          let value = "";
          for (const field of mapping.fields) {
            if (details[field] !== undefined && details[field] !== null && details[field] !== "") {
              value = details[field];
              break;
            }
          }

          // Preserve original formatting for date fields
          return escapeCSV(value);
        });

        csvRows.push(row.join(","));
      } catch (error) {
        console.error(`Error parsing data for section ${sectionId}:`, error);
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
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
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
    .filter(
      (user) =>
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
        if (!aSelected && bSelected) return 1; // b comes first
        // If both selected or both unselected, maintain original order
      }
      return 0; // Maintain original order for other cases
    });

  // Function to fetch data for a specific section or combined template
  const fetchReportData = async (sectionOrCombinedId, departmentForQuery, userIdsForQuery) => {
    const rt = availableReportTypes.find((rt) => rt.value === sectionOrCombinedId);
    if (!rt) {
      throw new Error(`Unknown report type: ${sectionOrCombinedId}`);
    }

    // Combined: fetch all and merge
    if (rt.combinedSectionIds && rt.combinedSectionIds.length > 0) {
      try {
        const fetches = rt.combinedSectionIds.map(async (sid) => {
          const section = parsedDataSections.find((s) => s.data_section_id === sid);
          const resp = await getDepartmentCVData(sid, departmentForQuery, "All", userIdsForQuery);
          return { section, data: resp.data || [] };
        });
        const parts = await Promise.all(fetches);
        const merged = parts.flatMap((p) =>
          p.data.map((item) => ({ ...item, __source_section_id: p.section?.data_section_id }))
        );
        return { data: merged, sectionId: sectionOrCombinedId, sectionTitle: rt.label, reportConfig: rt };
      } catch (error) {
        console.error(`Failed to fetch data for combined report ${rt.label}:`, error);
        throw new Error(`Failed to fetch data for ${rt.label}: ${error.message}`);
      }
    }

    // Single section
    const section = parsedDataSections.find((s) => s.data_section_id === sectionOrCombinedId);
    if (!section) {
      throw new Error(`Unknown section: ${sectionOrCombinedId}`);
    }

    try {
      const response = await getDepartmentCVData(sectionOrCombinedId, departmentForQuery, "All", userIdsForQuery);
      return {
        data: response.data || [],
        sectionId: sectionOrCombinedId,
        sectionTitle: section.title,
        reportConfig: rt,
      };
    } catch (error) {
      console.error(`Failed to fetch data for section ${section.title}:`, error);
      throw new Error(`Failed to fetch data for ${section.title}: ${error.message}`);
    }
  };

  // Helper function to apply date range filtering
  const applyDateRangeFilter = (data, sectionId, startYear, endYear) => {
    if (!data || data.length === 0) return data;
    if (!startYear && !endYear) return data;

    return data.filter((item) => {
      try {
        const details = typeof item.data_details === "string" ? JSON.parse(item.data_details) : item.data_details;

        // Extract years from the item data
        const extractedYears = extractYearsFromItem(details);
        
        // If no years found and we're filtering by date, exclude the item
        // (only include items with dates when date filtering is active)
        if (extractedYears.length === 0) return false;

        // Check if any of the extracted years fall within the specified range
        return extractedYears.some(year => {
          if (startYear && year < parseInt(startYear)) return false;
          if (endYear && year > parseInt(endYear)) return false;
          return true;
        });

      } catch (error) {
        console.error("Error filtering item by date:", error);
        return true; // Include items that can't be parsed
      }
    });
  };

  // Helper function to extract years from item data
  const extractYearsFromItem = (details) => {
    const years = new Set();

    // Helper function to check if a field has a valid value
    const hasValidValue = (value) => {
      return value !== null && value !== undefined && value !== "" && String(value).trim() !== "";
    };

    // Handle 'dates' field with various formats
    if (hasValidValue(details.dates)) {
      const datesYears = extractYearsFromDateString(details.dates);
      datesYears.forEach(year => years.add(year));
    }

    // Handle start_date and end_date fields
    if (hasValidValue(details.start_date)) {
      const startYears = extractYearsFromDateString(details.start_date);
      startYears.forEach(year => years.add(year));
    }
    
    if (hasValidValue(details.end_date)) {
      const endYears = extractYearsFromDateString(details.end_date);
      endYears.forEach(year => years.add(year));
    }

    // Handle other common date fields as fallback
    const otherDateFields = [
      "date", "year", "publication_date", "year_published", 
    ];
    
    for (const field of otherDateFields) {
      if (hasValidValue(details[field])) {
        const fieldYears = extractYearsFromDateString(details[field]);
        fieldYears.forEach(year => years.add(year));
      }
    }

    return Array.from(years);
  };

  // Helper function to extract years from various date string formats
  const extractYearsFromDateString = (dateString) => {
    // Check for null, undefined, empty string, or whitespace-only string
    if (!dateString || String(dateString).trim() === "") return [];
    
    const str = String(dateString).trim();
    const years = [];

    // Handle different date formats:
    // 'January 2021 - March 2021', 'January, 2021 - March, 2021'
    // 'March 2021', 'March, 2021', '2021'
    
    // Extract all 4-digit years (19xx or 20xx)
    const yearMatches = str.match(/\b(19|20)\d{2}\b/g);
    if (yearMatches) {
      yearMatches.forEach(match => {
        const year = parseInt(match);
        if (year >= 1900 && year <= 2100) { // Reasonable year range
          years.push(year);
        }
      });
    }

    return years;
  };

  // Helper function to extract month from date string
  const extractMonthFromDateString = (dateString) => {
    if (!dateString || String(dateString).trim() === "") return 0;
    
    const str = String(dateString).trim().toLowerCase();
    
    // Month name to number mapping
    const monthMap = {
      'january': 1, 'jan': 1,
      'february': 2, 'feb': 2,
      'march': 3, 'mar': 3,
      'april': 4, 'apr': 4,
      'may': 5,
      'june': 6, 'jun': 6,
      'july': 7, 'jul': 7,
      'august': 8, 'aug': 8,
      'september': 9, 'sep': 9, 'sept': 9,
      'october': 10, 'oct': 10,
      'november': 11, 'nov': 11,
      'december': 12, 'dec': 12
    };
    
    // Try to find month name
    for (const [monthName, monthNum] of Object.entries(monthMap)) {
      if (str.includes(monthName)) {
        return monthNum;
      }
    }
    
    // If no month name found, return 0 (will sort first)
    return 0;
  };

  // Helper function to get sorting key (year and month) for an item
  const getSortingKey = (details) => {
    const years = extractYearsFromItem(details);
    const earliestYear = years.length > 0 ? Math.min(...years) : 0;
    
    // Check if end_date exists and extract month from it
    let month = 0;
    if (details.end_date && String(details.end_date).trim() !== "") {
      month = extractMonthFromDateString(details.end_date);
    }
    
    return { year: earliestYear, month: month };
  };

  // Helper function to sort data by date in ascending order
  const sortDataByDate = (data) => {
    if (!data || data.length === 0) return data;

    return [...data].sort((a, b) => {
      try {
        // Parse data details for both items
        const detailsA = typeof a.data_details === "string" ? JSON.parse(a.data_details) : a.data_details;
        const detailsB = typeof b.data_details === "string" ? JSON.parse(b.data_details) : b.data_details;

        // Get sorting keys for both items
        const keyA = getSortingKey(detailsA);
        const keyB = getSortingKey(detailsB);

        // First sort by year
        if (keyA.year !== keyB.year) {
          return keyA.year - keyB.year;
        }

        // If years are the same, sort by month (when end_date is present)
        return keyA.month - keyB.month;

      } catch (error) {
        console.error("Error sorting item by date:", error);
        return 0; // Keep original order if parsing fails
      }
    });
  };

  const handleGenerateReport = async () => {
    if (selectedUsers.length === 0 || !selectedReportType) {
      alert("Please select at least one faculty member and a report type");
      return;
    }

    // Validate date range
    if (startYear && endYear && parseInt(startYear) > parseInt(endYear)) {
      alert("Start year cannot be later than end year");
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
          departmentForQuery = selectedDepartment === "All" ? "All" : selectedDepartment;
        } else if (userInfo.role.startsWith("Admin-")) {
          departmentForQuery = userInfo.role.split("-")[1];
        }
      } else {
        // If specific users are selected, use user IDs approach
        departmentForQuery = ""; // Empty string when using user IDs
        userIdsForQuery = selectedUsers;
      }

      // Fetch data using the updated function
      const reportResult = await fetchReportData(selectedReportType, departmentForQuery, userIdsForQuery);

      // Apply date range filtering if specified
      let filteredData = reportResult.data;
      if (startYear || endYear) {
        filteredData = applyDateRangeFilter(reportResult.data, selectedReportType, startYear, endYear);
      }

      // Sort the data in ascending order by date before exporting
      const sortedData = sortDataByDate(filteredData);

      // Convert to CSV using the updated function
      const csvData = convertDataToCSV(sortedData, selectedReportType);

      // Create download blob
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);
      // setNotification(true);

      await logAction(AUDIT_ACTIONS.GENERATE_DEPT_REPORT, {
        department: departmentForQuery,
        numUsers: selectedUsers ? selectedUsers.length : 0,
        sectionId: selectedReportType,
        dateRange: startYear || endYear ? `${startYear || "Any"}-${endYear || "Any"}` : null,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      alert(`Error generating report: ${error.message}`);
    }

    setGeneratingReport(false);
  };

  const handleDownload = () => {
    if (downloadUrl) {
      const reportConfig = getReportTypeConfig(selectedReportType);
      let filename = reportConfig ? `${reportConfig.label.toLowerCase().replace(/\s+/g, "_")}_report` : `report`;

      // Add date range to filename if specified
      if (startYear || endYear) {
        const dateRangeSuffix = `_${startYear || "any"}_to_${endYear || "any"}`;
        filename += dateRangeSuffix;
      }

      filename += `_${new Date().toISOString().split("T")[0]}.csv`;

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
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
          <div className="">
            <h1 className="text-left my-4 text-4xl font-bold text-zinc-600">Academic Sections Report</h1>
            <h2 className="text-xl font-semibold text-blue-700 mb-4 mt-2">{department}</h2>
            {/* Main Content Grid - Left and Right Sections */}
            <div className="flex flex-col lg:flex-row gap-6 mb-8">
              {/* Left Section - Date Range and Report Type */}
              <div className="flex-1 space-y-4 max-w-xl">
                {/* Date Range Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <select
                        className="select select-bordered w-full text-sm"
                        value={startYear}
                        onChange={(e) => {
                          setStartYear(e.target.value);
                          setDownloadUrl(null);
                        }}
                      >
                        <option value="">Any</option>
                        {generateYearOptions().map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                      <label className="block text-xs text-gray-600 mt-1">From (Start Year)</label>
                    </div>
                    <div>
                      <select
                        className="select select-bordered w-full text-sm"
                        value={endYear}
                        onChange={(e) => {
                          setEndYear(e.target.value);
                          setDownloadUrl(null);
                        }}
                      >
                        <option value="">Any</option>
                        {generateYearOptions().map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                      <label className="block text-xs text-gray-600 mt-1">To (End Year)</label>
                    </div>
                  </div>
                  {startYear && endYear && parseInt(startYear) > parseInt(endYear) && (
                    <div className="text-xs text-red-600 mt-1">Start year cannot be later than end year</div>
                  )}
                </div>

                {/* Report Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                  {/* Search bar for templates */}
                  <input
                    type="text"
                    className="input input-bordered w-full text-sm font-medium mb-3"
                    placeholder="Search templates..."
                    value={reportSearchTerm}
                    onChange={(e) => setReportSearchTerm(e.target.value)}
                  />
                  <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                    {availableReportTypes.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">No sections available for reporting</div>
                    ) : filteredReportTypes.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        {reportSearchTerm ? "No templates match your search" : "No sections available for reporting"}
                      </div>
                    ) : (
                      filteredReportTypes.map((reportType) => (
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
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Section - Department and Faculty Selection */}
              <div className="flex-1 space-y-8 max-w-xl">
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

                {/* Faculty Selection */}
                <FacultyMemberSelector
                  departmentUsers={departmentUsers}
                  selectedUsers={selectedUsers}
                  onUserToggle={handleUserToggle}
                  selectAll={selectAll}
                  onSelectAll={handleSelectAll}
                  userSearchTerm={userSearchTerm}
                  onUserSearchChange={handleUserSearchChange}
                />
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
                        Your {availableReportTypes.find((rt) => rt.value === selectedReportType)?.label || "report"} is
                        ready for download.
                      </p>
                    </div>
                    <button className="btn btn-success btn-md" onClick={handleDownload} disabled={!downloadUrl}>
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
                        Please wait while we compile the report for {selectedUsers.length} faculty member(s). This may
                        take a few moments...
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

export default DepartmentAdminAcademicSectionsReporting;
