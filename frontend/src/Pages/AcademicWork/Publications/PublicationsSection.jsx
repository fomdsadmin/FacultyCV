import React, { useState, useEffect } from "react";
import PermanentEntry from "../../../Components/PermanentEntry";
import GenericEntry from "../../../SharedComponents/GenericEntry";
import EntryModal from "../../../SharedComponents/EntryModal/EntryModal";
import PermanentEntryModal from "../../../Components/PermanentEntryModal";
import PublicationsModal from "./PublicationsModal";
import { FaArrowLeft, FaRegEdit, FaSearch, FaPlus, FaDownload } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { getUserCVData, updateUserCVDataArchive, deleteUserCVSectionData } from "../../../graphql/graphqlHelpers";
import { rankFields } from "../../../utils/rankingUtils";
import { LuBrainCircuit } from "react-icons/lu";
import { useAuditLogger, AUDIT_ACTIONS } from "../../../Contexts/AuditLoggerContext";

const generateEmptyEntry = (attributes) => {
  const emptyEntry = {};
  for (const key of Object.keys(attributes)) {
    const newKey = key.toLowerCase().replace(/ /g, "_");
    emptyEntry[newKey] = "";
  }
  return emptyEntry;
};

const PublicationsSection = ({ user, section, onBack }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [fieldData, setFieldData] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retrievingData, setRetrievingData] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [notification, setNotification] = useState(""); // <-- Add this
  const [existingPublications, setExistingPublications] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortDescending, setSortDescending] = useState(true);
  const [sortAscending, setSortAscending] = useState(false);

  // Filter states for dropdowns
  const [dropdownFilters, setDropdownFilters] = useState({});
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Apply all filters to get filtered data
  const getFilteredData = () => {
    let filtered = fieldData;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((entry) => {
        // Search through all fields in data_details
        if (!entry.data_details) return false;
        
        const searchLower = searchTerm.toLowerCase();
        
        // Check all fields in the entry's data_details
        return Object.values(entry.data_details).some((value) => {
          if (value === null || value === undefined) return false;
          
          // Convert value to string and check if it includes the search term
          const stringValue = typeof value === 'string' ? value : String(value);
          return stringValue.toLowerCase().includes(searchLower);
        });
      });
    }

    // Apply dropdown filters
    Object.entries(dropdownFilters).forEach(([attribute, filterValue]) => {
      if (filterValue && filterValue !== "all") {
        // Get the actual field key (snake_case) from the display name
        const actualKey =
          section.attributes && section.attributes[attribute]
            ? section.attributes[attribute]
            : attribute.toLowerCase().replace(/\s+/g, "_");

        filtered = filtered.filter((entry) => {
          if (!entry.data_details || !entry.data_details[actualKey]) return false;

          const entryValue = entry.data_details[actualKey];
          if (
            entryValue === null ||
            entryValue === undefined ||
            String(entryValue).trim() === "" ||
            String(entryValue) === "—"
          )
            return false;

          // Handle "Other (value)" format
          if (typeof entryValue === "string" && /\bother\b/i.test(entryValue) && /\(.*\)$/.test(entryValue)) {
            const match = entryValue.match(/^(.*Other)\s*\((.*)\)$/i);
            if (match) {
              return match[1].trim() === filterValue;
            }
          }

          // Normalize boolean values for comparison (convert to Yes/No for display)
          let normalizedEntryValue = entryValue;
          if (entryValue === true || entryValue === "true") {
            normalizedEntryValue = "Yes";
          } else if (entryValue === false || entryValue === "false") {
            normalizedEntryValue = "No";
          }

          return String(normalizedEntryValue) === filterValue;
        });
      }
    });

    return filtered;
  };

  // Get filtered data and calculate pagination
  const filteredData = getFilteredData();
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const { logAction } = useAuditLogger();

  const toggleSortOrder = () => {
    setSortAscending(!sortAscending);
    setSortDescending(!sortDescending);
  };

  // Get dropdown attributes from section attributes_type
  const getDropdownAttributes = () => {
    try {
      if (!section.attributes_type) {
        return [];
      }
      const attributesType =
        typeof section.attributes_type === "string" ? JSON.parse(section.attributes_type) : section.attributes_type;

      return Object.keys(attributesType.dropdown || {});
    } catch (error) {
      console.error("Error parsing attributes_type:", error);
      return [];
    }
  };

  // Get unique values for a dropdown attribute from field data
  const getUniqueDropdownValues = (attribute) => {
    // Get the actual field key (snake_case) from the display name
    const actualKey =
      section.attributes && section.attributes[attribute]
        ? section.attributes[attribute]
        : attribute.toLowerCase().replace(/\s+/g, "_");

    const values = new Set();

    fieldData.forEach((entry, index) => {
      if (entry.data_details && entry.data_details[actualKey]) {
        const value = entry.data_details[actualKey];

        if (
          value !== null &&
          value !== undefined &&
          String(value).trim() !== "" &&
          String(value) !== "—" &&
          String(value).toLowerCase() !== "null"
        ) {
          // Handle "Other (value)" format
          if (typeof value === "string" && /\bother\b/i.test(value) && /\(.*\)$/.test(value)) {
            const match = value.match(/^(.*Other)\s*\((.*)\)$/i);
            if (match) {
              values.add(match[1].trim());
            }
          } else {
            // Convert value to string for consistency, handling booleans and other types
            // Convert boolean values to Yes/No for display
            let normalizedValue = value;
            if (value === true || value === "true") {
              normalizedValue = "Yes";
            } else if (value === false || value === "false") {
              normalizedValue = "No";
            }
            values.add(String(normalizedValue));
          }
        }
      }
    });

    const result = Array.from(values).sort();
    return result;
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setDropdownFilters({});
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize, dropdownFilters]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleArchive = async (entry) => {
    setLoading(true);
    setFieldData([]);
    try {
      await updateUserCVDataArchive(entry.user_cv_data_id, true);
      await logAction(AUDIT_ACTIONS.ARCHIVE_CV_DATA);
    } catch (error) {
      console.error("Error archiving entry:", error);
    }
    await fetchData();
    setLoading(false);
  };

  const handleEdit = (entry) => {
    const newEntry = {
      fields: entry.data_details,
      data_id: entry.user_cv_data_id,
      editable: entry.editable,
    };
    setIsNew(false);
    setSelectedEntry(newEntry);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedEntry(null);
    setIsModalOpen(false);
    setRetrievingData(false);
  };

  const handleNew = () => {
    setIsNew(true);
    if (typeof section.attributes === "string") {
      section.attributes = JSON.parse(section.attributes);
    }
    const emptyEntry = generateEmptyEntry(section.attributes);
    const newEntry = { fields: emptyEntry, data_id: null };
    setSelectedEntry(newEntry);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await deleteUserCVSectionData({
        user_id: user.user_id,
        data_section_id: section.data_section_id,
      });
      fetchData(); // Refresh data after toast disappears
      setNotification(`${section.title}'s data removed successfully!`);
      setTimeout(() => {
        setNotification("");
      }, 2500); // 1.5 seconds
      // Log the deletion action
      await logAction(AUDIT_ACTIONS.DELETE_CV_DATA);
    } catch (error) {
      console.error("Error deleting section data:", error);
    }
  };

  async function fetchData() {
    try {
      const retrievedData = await getUserCVData(user.user_id, section.data_section_id);
      const parsedData = retrievedData.map((data) => ({
        ...data,
        data_details: JSON.parse(data.data_details),
      }));
      console.log("Fetched existing publications:", parsedData.length);
      setExistingPublications(parsedData);

      const rankedData = parsedData.map((entry) => {
        const [field1, field2] = rankFields(entry.data_details);
        return { ...entry, field1, field2 };
      });

      // Helper function to extract year and month from various date formats
      const extractDateInfo = (dateStr) => {
        if (!dateStr) return { year: 0, month: 0 };

        const str = String(dateStr).toLowerCase().trim();

        // Handle pure year numbers (like 2025, 2024)
        if (/^\d{4}$/.test(str)) {
          const year = parseInt(str);
          if (year >= 1900 && year <= 2100) {
            return { year, month: 0 };
          }
        }

        // Extract year from various patterns
        const yearMatch = str.match(/\b(20\d{2}|19\d{2})\b/);
        const year = yearMatch ? parseInt(yearMatch[1]) : 0;

        // Extract month
        const monthNames = [
          "january",
          "february",
          "march",
          "april",
          "may",
          "june",
          "july",
          "august",
          "september",
          "october",
          "november",
          "december",
        ];

        const monthAbbr = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

        let month = 0;

        // Check for full month names
        for (let i = 0; i < monthNames.length; i++) {
          if (str.includes(monthNames[i])) {
            month = i + 1; // 1-based month
            break;
          }
        }

        // Check for abbreviated month names if no full name found
        if (month === 0) {
          for (let i = 0; i < monthAbbr.length; i++) {
            if (str.includes(monthAbbr[i])) {
              month = i + 1; // 1-based month
              break;
            }
          }
        }

        // If no month name found, check for numeric month patterns
        if (month === 0) {
          // Pattern: YYYY-MM, MM/YYYY, MM-YYYY, YYYY/MM
          const numericPatterns = [
            /\b(?:20\d{2}|19\d{2})[-\/](\d{1,2})\b/, // YYYY-MM or YYYY/MM
            /\b(\d{1,2})[-\/](?:20\d{2}|19\d{2})\b/, // MM-YYYY or MM/YYYY
          ];

          for (const pattern of numericPatterns) {
            const match = str.match(pattern);
            if (match) {
              const monthNum = parseInt(match[1]);
              if (monthNum >= 1 && monthNum <= 12) {
                month = monthNum;
                break;
              }
            }
          }
        }

        return { year, month };
      };

      rankedData.sort((a, b) => {
        // Try to get date info from multiple possible sources
        let dateA = extractDateInfo(a.field2);
        if (dateA.year === 0) {
          // Try various date fields in data_details
          const possibleDateFields = [
            a.data_details?.end_date,
            a.data_details?.publication_date,
            a.data_details?.date,
            a.data_details?.year,
            a.data_details?.start_date,
            a.field1, // Sometimes the date might be in field1
          ];

          for (const dateField of possibleDateFields) {
            if (dateField) {
              dateA = extractDateInfo(dateField);
              if (dateA.year !== 0) break;
            }
          }
        }

        let dateB = extractDateInfo(b.field2);
        if (dateB.year === 0) {
          // Try various date fields in data_details
          const possibleDateFields = [
            b.data_details?.end_date,
            b.data_details?.publication_date,
            b.data_details?.date,
            b.data_details?.year,
            b.data_details?.start_date,
            b.field1, // Sometimes the date might be in field1
          ];

          for (const dateField of possibleDateFields) {
            if (dateField) {
              dateB = extractDateInfo(dateField);
              if (dateB.year !== 0) break;
            }
          }
        }

        // First sort by year (descending)
        if (dateA.year !== dateB.year) {
          return dateB.year - dateA.year;
        }

        // If years are the same, sort by month (descending - most recent first)
        return dateB.month - dateA.month;
      });

      setFieldData(rankedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    setFieldData([]);
    fetchData();
  }, [section.data_section_id]);

  useEffect(() => {
    if (fieldData.length !== 0) {
      setIsAvailable(true);
    }
  }, [fieldData]);

  const handleBack = () => {
    onBack();
  };

  // const GenericEntry = ({ field1, field2, data_details, onEdit, onArchive }) => (
  //   <div className="entry">
  //     <h2>{field1}</h2>
  //     <div className="m-2 flex">
  //       <button onClick={onArchive} className="ml-auto text-white btn btn-danger min-h-0 h-8 leading-tight">
  //         X
  //       </button>
  //     </div>
  //     <p>{field2}</p>
  //     <div>{data_details}</div>
  //   </div>
  // );
  // const PermanentEntry = ({ field1, field2, data_details, isArchived, onEdit, onArchive }) => (
  //   <div className={`entry ${isArchived ? "archived" : ""}`}>
  //     <h2>{field1}</h2>
  //     <div className="m-2 flex">
  //       <button onClick={onArchive} className="ml-auto text-white btn btn-danger min-h-0 h-8 leading-tight">
  //         X
  //       </button>
  //     </div>
  //     <p>{field2}</p>
  //     <div>{data_details}</div>
  //   </div>
  // );

  const renderDataDetails = (details) => {
    if (!details || typeof details !== "object") return null;

    const authorList = Array.isArray(details.author_names) ? details.author_names : [details.author_names];
    const authorIds = Array.isArray(details.author_ids) ? details.author_ids : [details.author_ids];
    const keywordsList = Array.isArray(details.keywords) ? details.keywords : [details.keywords];

    // Get author metadata for formatting
    const trainees = details.author_trainees || [];
    const doctoralSupervisors = details.author_doctoral_supervisors || [];
    const postdoctoralSupervisors = details.author_postdoctoral_supervisors || [];

    // Handle date display - check for both display_date and end_date
    let formattedDate = "";

    if (details.end_date) {
      formattedDate = details.end_date.trim();
    }

    // Map author names with formatting based on roles
    const authorDisplay = authorList.map((name, idx) => {
      // Build className based on roles
      let className = "";

      // Check if this author is in any special role
      const isTrainee = trainees.includes(name);
      const isDoctoralSupervisor = doctoralSupervisors.includes(name);
      const isPostdoctoralSupervisor = postdoctoralSupervisors.includes(name);

      // Apply formatting: underline for trainee, italic for doctoral, bold italic for postdoctoral
      if (isPostdoctoralSupervisor) {
        className = "font-bold italic";
      } else if (isDoctoralSupervisor) {
        className = "italic";
      } else if (isTrainee) {
        className = "underline";
      }

      // Check if this is the user's publication (scopus_id match)
      const isScopusMatch =
        user.scopus_id && authorIds && authorIds[idx] && String(authorIds[idx]) === String(user.scopus_id);

      // Combine classes - user's publication gets bold in addition to role formatting
      if (isScopusMatch) {
        className = className ? `${className} font-bold` : "font-bold";
      }

      return (
        <span key={idx} className={className || undefined}>
          {name}
        </span>
      );
    });

    return (
      <>
        {details.title && (
          <h3 className="text-lg font-semibold mb-1">
            {details.mark_as_important && <span className="text-red-600 mr-1">*</span>}
            {details.title}
          </h3>
        )}
        <p className="text-sm text-gray-700 mb-2">
          {formattedDate}
          {details.volume && (
            <>
              <span className="font-normal">, Volume: </span>
              {`${details.volume}`}
            </>
          )}
          {details.article_number && (
            <>
              <span className="font-normal">, Article Number: </span>
              {details.article_number}
            </>
          )}
        </p>

        {authorList?.length > 0 && (
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-semibold">Author Names:</span>{" "}
            {authorDisplay.reduce((prev, curr, idx) => [prev, idx > 0 ? ", " : null, curr])}
          </p>
        )}

        {details.doi && (
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-semibold">Doi:</span> {details.doi}
          </p>
        )}

        {keywordsList?.length > 0 && keywordsList.some((keyword) => keyword && keyword.trim() !== "") && (
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-semibold">Keywords:</span>{" "}
            {keywordsList.filter((keyword) => keyword && keyword.trim() !== "").join(", ")}
          </p>
        )}

        {details.link && (
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-semibold">Link:</span>{" "}
            <a href={details.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
              {details.link}
            </a>
          </p>
        )}

        {details.publication_id && (
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-semibold">Publication Id:</span> {details.publication_id}
          </p>
        )}

        {details.peer_reviewed && (
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-semibold">Peer Reviewed:</span> {details.peer_reviewed === true || details.peer_reviewed === "true" ? "Yes" : "No"}
          </p>
        )}

        {details["impact_factor_(if)"] && (
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-semibold">Impact Factor (IF):</span> {details["impact_factor_(if)"]}
          </p>
        )}

        {/* Display all remaining fields that haven't been shown yet */}
        {Object.entries(details)
          .filter(([key, value]) => {
            // Exclude fields that are already displayed above
            const displayedFields = [
              "title",
              "end_date",
              "volume",
              "article_number",
              "author_names",
              "author_ids",
              "doi",
              "keywords",
              "link",
              "publication_id",
              "author_trainees",
              "author_doctoral_supervisors",
              "author_postdoctoral_supervisors",
              "author_types",
              "mark_as_important",
              "impact_factor_(if)",
              "peer_reviewed",
            ];
            return !displayedFields.includes(key) && value && value !== "" && value !== null;
          })
          .map(([key, value]) => (
            <p key={key} className="text-sm text-gray-700 mb-1">
              <span className="font-semibold">{key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}:</span>{" "}
              {Array.isArray(value) ? value.join(", ") : String(value)}
            </p>
          ))}
      </>
    );
  };

  const sortedData = sortAscending ? [...paginatedData].reverse() : paginatedData;

  return (
    <div>
      {/* Header Section - matches GenericSection layout */}
      <div className="ml-2 mr-4 my-2 flex items-center justify-between">
        {/* Left section: Back Button and Title */}
        <div className="flex items-center">
          <button onClick={handleBack} className="text-zinc-800 btn btn-ghost min-h-0 h-10 p-2 mr-3 hover:bg-gray-100">
            <FaArrowLeft className="h-5 w-5 text-zinc-800" />
          </button>
          <h2 className="text-3xl font-bold text-zinc-600">{section.title}</h2>
        </div>

        {/* Right section: Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleNew}
            className="text-white btn btn-success min-h-0 h-10 px-4 leading-tight flex items-center gap-2"
            disabled={retrievingData}
          >
            <FaPlus />
            New
          </button>
          <button
            onClick={() => setRetrievingData(true)}
            className="text-white btn btn-info min-h-0 h-10 px-4 leading-tight flex items-center gap-2"
            disabled={retrievingData}
          >
            {retrievingData ? "Retrieving..." : (
              <>
                <FaDownload />
                Retrieve Data
              </>
            )}
          </button>
          {/* <button
            onClick={handleDelete}
            className="text-white btn btn-warning min-h-0 h-10 px-4 leading-tight"
            disabled={!isAvailable}
          >
            Remove All
          </button> */}
        </div>
      </div>

      {/* Description Section - matches GenericSection layout */}
      <div className="mx-4 mt-2 flex flex-col">
        <div className="text-md">
          <span>{section.description}</span>
        </div>
      </div>

      {/* Only show Filters and Search if there's data - matches GenericSection layout */}
      {fieldData.length > 0 && (
        <div className="mb-2 bg-white px-4 py-3 rounded-lg shadow-md mt-2 ml-4 mr-4">
          {/* Basic Filters Row */}
          <div className="flex flex-wrap gap-3 items-end mb-1">
            {/* Search Bar */}
            <div className="">
              <label className="block text-xs font-medium text-zinc-600 mb-1">Search Entries</label>
              <div className="relative max-w-md">
                <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-zinc-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Date Sort Button */}
            <div className="">
              <label className="block text-xs font-medium text-zinc-600 mb-1">Date Order</label>
              <button
                onClick={toggleSortOrder}
                className="flex items-center justify-center px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-colors duration-200 text-sm"
                title={`Sort by date: ${sortAscending ? "Oldest first" : "Newest first"} (click to toggle)`}
              >
                <svg className="w-4 h-4 text-gray-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {sortAscending ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 4v12m0 0l4-4m-4 4l-4-4m10-8v12m0 0l4-4m-4 4l-4-4"
                    />
                  )}
                </svg>
                {sortAscending ? "Oldest" : "Newest"}
              </button>
            </div>

            {/* First few dropdown filters */}
            {getDropdownAttributes()
              .filter(
                (attribute) =>
                  attribute.toLowerCase() !== "publication type" && attribute.toLowerCase() !== "publication_type"
              )
              .slice(0, 2)
              .map((attribute) => {
                const uniqueValues = getUniqueDropdownValues(attribute);
                if (uniqueValues.length === 0) return null;

                // Get data filtered by everything except the current attribute
                const getCountForOption = (optionValue) => {
                  let dataForCounting = fieldData;

                  // Apply search filter
                  if (searchTerm) {
                    dataForCounting = dataForCounting.filter((entry) => {
                      if (!entry.data_details) return false;
                      
                      const searchLower = searchTerm.toLowerCase();
                      
                      // Check all fields in the entry's data_details
                      return Object.values(entry.data_details).some((value) => {
                        if (value === null || value === undefined) return false;
                        
                        const stringValue = typeof value === 'string' ? value : String(value);
                        return stringValue.toLowerCase().includes(searchLower);
                      });
                    });
                  }

                  // Apply other dropdown filters (excluding current attribute)
                  Object.entries(dropdownFilters).forEach(([filterAttribute, filterValue]) => {
                    if (filterValue && filterValue !== "all" && filterAttribute !== attribute) {
                      const actualKey =
                        section.attributes && section.attributes[filterAttribute]
                          ? section.attributes[filterAttribute]
                          : filterAttribute.toLowerCase().replace(/\s+/g, "_");

                      dataForCounting = dataForCounting.filter((entry) => {
                        if (!entry.data_details || !entry.data_details[actualKey]) return false;

                        const entryValue = entry.data_details[actualKey];
                        if (
                          entryValue === null ||
                          entryValue === undefined ||
                          String(entryValue).trim() === "" ||
                          String(entryValue) === "—"
                        )
                          return false;

                        // Handle "Other (value)" format
                        if (
                          typeof entryValue === "string" &&
                          /\bother\b/i.test(entryValue) &&
                          /\(.*\)$/.test(entryValue)
                        ) {
                          const match = entryValue.match(/^(.*Other)\s*\((.*)\)$/i);
                          if (match) {
                            return match[1].trim() === filterValue;
                          }
                        }

                        // Normalize boolean values for comparison
                        let normalizedEntryValue = entryValue;
                        if (entryValue === true || entryValue === "true") {
                          normalizedEntryValue = "Yes";
                        } else if (entryValue === false || entryValue === "false") {
                          normalizedEntryValue = "No";
                        }

                        return String(normalizedEntryValue) === filterValue;
                      });
                    }
                  });

                  // Now count items matching this specific option
                  if (optionValue === "all") {
                    return dataForCounting.length;
                  }

                  const actualKey =
                    section.attributes && section.attributes[attribute]
                      ? section.attributes[attribute]
                      : attribute.toLowerCase().replace(/\s+/g, "_");

                  return dataForCounting.filter((entry) => {
                    if (!entry.data_details || !entry.data_details[actualKey]) return false;

                    const entryValue = entry.data_details[actualKey];
                    if (
                      entryValue === null ||
                      entryValue === undefined ||
                      String(entryValue).trim() === "" ||
                      String(entryValue) === "—"
                    )
                      return false;

                    // Handle "Other (value)" format
                    if (typeof entryValue === "string" && /\bother\b/i.test(entryValue) && /\(.*\)$/.test(entryValue)) {
                      const match = entryValue.match(/^(.*Other)\s*\((.*)\)$/i);
                      if (match) {
                        return match[1].trim() === optionValue;
                      }
                    }

                    // Normalize boolean values for comparison
                    let normalizedEntryValue = entryValue;
                    if (entryValue === true || entryValue === "true") {
                      normalizedEntryValue = "Yes";
                    } else if (entryValue === false || entryValue === "false") {
                      normalizedEntryValue = "No";
                    }

                    return String(normalizedEntryValue) === optionValue;
                  }).length;
                };

                return (
                  <div key={attribute} className="max-w-56">
                    <label className="block text-xs font-medium text-zinc-600 mb-1">
                      {attribute.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </label>
                    <select
                      value={dropdownFilters[attribute] || "all"}
                      onChange={(e) => setDropdownFilters((prev) => ({ ...prev, [attribute]: e.target.value }))}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="all">All ({getCountForOption("all")})</option>
                      {uniqueValues.map((value) => {
                        const count = getCountForOption(value);
                        return (
                          <option key={value} value={value}>
                            {value} ({count})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                );
              })}

            {/* Show More Filters Button */}
            {getDropdownAttributes().filter(
              (attribute) =>
                attribute.toLowerCase() !== "publication type" && attribute.toLowerCase() !== "publication_type"
            ).length > 2 && (
              <button
                onClick={() => setShowMoreFilters(!showMoreFilters)}
                className="px-3 py-2 text-xs text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
              >
                {showMoreFilters
                  ? "Show Less"
                  : `Show More Filters (${
                      getDropdownAttributes().filter(
                        (attribute) =>
                          attribute.toLowerCase() !== "publication type" &&
                          attribute.toLowerCase() !== "publication_type"
                      ).length - 2
                    })`}
              </button>
            )}

            {/* Spacer to push total entries to the right */}
            <div className="flex-1"></div>

            {/* Total Entries - styled like other buttons */}
            <div className="">
              <label className="block text-xs font-medium text-zinc-600 mb-1">Total Entries</label>
              <div className="flex items-center justify-center px-3 py-2 rounded-md bg-gray-100 border border-gray-300 text-sm">
                <span className="font-bold text-blue-600">{filteredData.length}</span>
              </div>
            </div>
          </div>

          {/* Advanced Filters (Conditional) */}
          {showMoreFilters &&
            getDropdownAttributes().filter(
              (attribute) =>
                attribute.toLowerCase() !== "publication type" && attribute.toLowerCase() !== "publication_type"
            ).length > 2 && (
              <div className="flex flex-wrap gap-3 items-end border-t border-zinc-200 pt-3 mt-1">
                {/* Remaining dropdown filters */}
                {getDropdownAttributes()
                  .filter(
                    (attribute) =>
                      attribute.toLowerCase() !== "publication type" && attribute.toLowerCase() !== "publication_type"
                  )
                  .slice(2)
                  .map((attribute) => {
                    const uniqueValues = getUniqueDropdownValues(attribute);
                    if (uniqueValues.length === 0) return null;

                    // Get data filtered by everything except the current attribute
                    const getCountForOption = (optionValue) => {
                      let dataForCounting = fieldData;

                      // Apply search filter
                      if (searchTerm) {
                        dataForCounting = dataForCounting.filter((entry) => {
                          if (!entry.data_details) return false;
                          
                          const searchLower = searchTerm.toLowerCase();
                          
                          // Check all fields in the entry's data_details
                          return Object.values(entry.data_details).some((value) => {
                            if (value === null || value === undefined) return false;
                            
                            const stringValue = typeof value === 'string' ? value : String(value);
                            return stringValue.toLowerCase().includes(searchLower);
                          });
                        });
                      }

                      // Apply other dropdown filters (excluding current attribute)
                      Object.entries(dropdownFilters).forEach(([filterAttribute, filterValue]) => {
                        if (filterValue && filterValue !== "all" && filterAttribute !== attribute) {
                          const actualKey =
                            section.attributes && section.attributes[filterAttribute]
                              ? section.attributes[filterAttribute]
                              : filterAttribute.toLowerCase().replace(/\s+/g, "_");

                          dataForCounting = dataForCounting.filter((entry) => {
                            if (!entry.data_details || !entry.data_details[actualKey]) return false;

                            const entryValue = entry.data_details[actualKey];
                            if (
                              entryValue === null ||
                              entryValue === undefined ||
                              String(entryValue).trim() === "" ||
                              String(entryValue) === "—"
                            )
                              return false;

                            // Handle "Other (value)" format
                            if (
                              typeof entryValue === "string" &&
                              /\bother\b/i.test(entryValue) &&
                              /\(.*\)$/.test(entryValue)
                            ) {
                              const match = entryValue.match(/^(.*Other)\s*\((.*)\)$/i);
                              if (match) {
                                return match[1].trim() === filterValue;
                              }
                            }

                            // Normalize boolean values for comparison
                            let normalizedEntryValue = entryValue;
                            if (entryValue === true || entryValue === "true") {
                              normalizedEntryValue = "Yes";
                            } else if (entryValue === false || entryValue === "false") {
                              normalizedEntryValue = "No";
                            }

                            return String(normalizedEntryValue) === filterValue;
                          });
                        }
                      });

                      // Now count items matching this specific option
                      if (optionValue === "all") {
                        return dataForCounting.length;
                      }

                      const actualKey =
                        section.attributes && section.attributes[attribute]
                          ? section.attributes[attribute]
                          : attribute.toLowerCase().replace(/\s+/g, "_");

                      return dataForCounting.filter((entry) => {
                        if (!entry.data_details || !entry.data_details[actualKey]) return false;

                        const entryValue = entry.data_details[actualKey];
                        if (
                          entryValue === null ||
                          entryValue === undefined ||
                          String(entryValue).trim() === "" ||
                          String(entryValue) === "—"
                        )
                          return false;

                        // Handle "Other (value)" format
                        if (
                          typeof entryValue === "string" &&
                          /\bother\b/i.test(entryValue) &&
                          /\(.*\)$/.test(entryValue)
                        ) {
                          const match = entryValue.match(/^(.*Other)\s*\((.*)\)$/i);
                          if (match) {
                            return match[1].trim() === optionValue;
                          }
                        }

                        // Normalize boolean values for comparison
                        let normalizedEntryValue = entryValue;
                        if (entryValue === true || entryValue === "true") {
                          normalizedEntryValue = "Yes";
                        } else if (entryValue === false || entryValue === "false") {
                          normalizedEntryValue = "No";
                        }

                        return String(normalizedEntryValue) === optionValue;
                      }).length;
                    };

                    return (
                      <div key={attribute} className="max-w-56">
                        <label className="block text-xs font-medium text-zinc-600 mb-1">
                          {attribute.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </label>
                        <select
                          value={dropdownFilters[attribute] || "all"}
                          onChange={(e) => setDropdownFilters((prev) => ({ ...prev, [attribute]: e.target.value }))}
                          className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                          <option value="all">All ({getCountForOption("all")})</option>
                          {uniqueValues.map((value) => {
                            const count = getCountForOption(value);
                            return (
                              <option key={value} value={value}>
                                {value} ({count})
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    );
                  })}

                {/* Clear Filters Button */}
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-2 text-xs text-zinc-600 border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}
        </div>
      )}

      {/* Entries List (paginated) */}
      {loading ? (
        <div className="flex items-center justify-center w-full">
          <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
        </div>
      ) : (
        <div className="mx-4 pr-2 my-2 max-h-[50vh] overflow-y-auto rounded-lg">
          {sortedData.length > 0 ? (
            sortedData.map((entry, index) => (
              <div key={index} className="min-h-8 shadow-glow my-2 px-4 py-4 flex items-center bg-white rounded-lg">
                <div className="flex-1 w-full">{renderDataDetails(entry.data_details)}</div>
                <div className="flex items-center space-x-1">
                  <button className="btn btn-sm btn-circle btn-ghost" onClick={() => handleEdit(entry)} title="Edit">
                    <FaRegEdit className="h-5 w-5" />
                  </button>
                  <button
                    className="btn btn-sm btn-circle btn-ghost"
                    onClick={() => handleArchive(entry)}
                    title="Delete"
                  >
                    <IoClose className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">No existing entries found</div>
          )}
        </div>
      )}

      {/* Only show Pagination Controls if there's data */}
      {fieldData.length > 0 && (
        <div className="mr-4 mt-4 rounded-lg flex flex-wrap justify-end items-center">
          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Page size dropdown */}
            <select
              className="select select-sm select-bordered"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
              <option value={1000}>All</option>
            </select>
            {/* Pagination controls */}
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {isModalOpen && selectedEntry && !isNew && (
        <EntryModal
          isNew={false}
          user={user}
          section={section}
          fields={selectedEntry.fields}
          user_cv_data_id={selectedEntry.data_id}
          entryType={section.title}
          fetchData={fetchData}
          onClose={handleCloseModal}
        />
      )}
      {isModalOpen && selectedEntry && isNew && (
        <EntryModal
          isNew={true}
          user={user}
          section={section}
          fields={selectedEntry.fields}
          user_cv_data_id={selectedEntry.data_id}
          entryType={section.title}
          fetchData={fetchData}
          onClose={handleCloseModal}
        />
      )}
      {retrievingData && (
        <PublicationsModal
          user={user}
          section={section}
          onClose={handleCloseModal}
          setRetrievingData={setRetrievingData}
          fetchData={fetchData}
          existingPublications={existingPublications}
        />
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-8 right-6 z-50 bg-green-600 text-white px-4 py-2 rounded shadow-lg transition-all">
          {notification}
        </div>
      )}
    </div>
  );
};

export default PublicationsSection;
