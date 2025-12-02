import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getUserCVData,
  updateUserCVDataArchive,
  deleteUserCVSectionData,
} from "../../graphql/graphqlHelpers";
import { rankFields } from "../../utils/rankingUtils";
import { sortEntriesByDate } from "../../utils/dateUtils";
import { useApp } from "../../Contexts/AppContext";
import { useAuditLogger, AUDIT_ACTIONS } from "../../Contexts/AuditLoggerContext";
// Create context
const GenericSectionContext = createContext(null);

// Custom hook to use the context

export const useGenericSection = () => {
  const context = useContext(GenericSectionContext);
  if (!context) {
    throw new Error(
      "useGenericSection must be used within a GenericSectionProvider"
    );
  }
  return context;
};

// Helper function to generate empty entry
const generateEmptyEntry = (attributes) => {
  const emptyEntry = {};
  for (const key of Object.keys(attributes)) {
    const newKey = key.toLowerCase().replace(/ /g, "_");
    emptyEntry[newKey] = "";
  }
  return emptyEntry;
};

// Provider component
export const GenericSectionProvider = ({ section, onBack, children }) => {
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [fieldData, setFieldData] = useState([]);
  const [sortAscending, setSortAscending] = useState(false); // false = descending (most recent first)
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");

  // Filter states
  const [dropdownFilters, setDropdownFilters] = useState({});
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { userInfo } = useApp();
  const { logAction } = useAuditLogger();

  // Get dropdown attributes from section attributes_type
  const getDropdownAttributes = () => {
    try {
      const attributesType = typeof section.attributes_type === "string"
        ? JSON.parse(section.attributes_type)
        : section.attributes_type;
      return Object.keys(attributesType.dropdown || {});
    } catch (error) {
      console.error("Error parsing attributes_type:", error);
      return [];
    }
  };

  // Get unique values for a dropdown attribute from field data
  const getUniqueDropdownValues = (attribute) => {
    // Get the actual field key (snake_case) from the display name
    const actualKey = section.attributes && section.attributes[attribute]
      ? section.attributes[attribute]
      : attribute.toLowerCase().replace(/\s+/g, '_');

    const values = new Set();

    fieldData.forEach((entry, index) => {
      if (entry.data_details && entry.data_details[actualKey]) {
        const value = entry.data_details[actualKey];

        // Handle different data types appropriately
        if (value !== null && value !== undefined && value !== "" && value !== "—") {
          const stringValue = typeof value === 'string' ? value : String(value);

          // Skip if it's empty after conversion to string
          if (stringValue.trim() === "" || stringValue.toLowerCase() === "null") {
            return;
          }

          // Handle "Other (value)" format
          if (/\bother\b/i.test(stringValue) && /\(.*\)$/.test(stringValue)) {
            const match = stringValue.match(/^(.*Other)\s*\((.*)\)$/i);
            if (match) {
              values.add(match[1].trim());
            }
          } else {
            values.add(stringValue);
          }
        }
      }
    });

    const result = Array.from(values).sort();
    return result;
  };

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
        const actualKey = section.attributes && section.attributes[attribute]
          ? section.attributes[attribute]
          : attribute.toLowerCase().replace(/\s+/g, '_');

        filtered = filtered.filter((entry) => {
          if (!entry.data_details || !entry.data_details[actualKey]) return false;

          const entryValue = entry.data_details[actualKey];
          if (!entryValue && entryValue !== 0 && entryValue !== false) return false;

          // Convert to string for consistent handling
          const stringValue = typeof entryValue === 'string' ? entryValue : String(entryValue);
          if (stringValue.trim() === "" || stringValue === "—") return false;

          // Handle "Other (value)" format
          if (/\bother\b/i.test(stringValue) && /\(.*\)$/.test(stringValue)) {
            const match = stringValue.match(/^(.*Other)\s*\((.*)\)$/i);
            if (match) {
              return match[1].trim() === filterValue;
            }
          }

          // Compare using string representation for consistency
          return stringValue === filterValue || entryValue === filterValue;
        });
      }
    });

    return filtered;
  };

  // Get filtered data
  const filteredData = getFilteredData();

  // Calculate pagination based on filtered data
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setDropdownFilters({});
    setCurrentPage(1);
  };

  // Fetch data function
  const fetchData = async () => {
    setLoading(true);
    try {
      const retrievedData = await getUserCVData(
        userInfo.user_id,
        section.data_section_id
      );
      // Parse the data_details field from a JSON string to a JSON object
      const parsedData = retrievedData.map((data) => ({
        ...data,
        data_details: JSON.parse(data.data_details),
      }));

      const rankedData = parsedData.map((entry) => {
        const [field1, field2] = rankFields(entry.data_details);
        const findKeyForField = (field) => {
          return Object.keys(entry.data_details).find(
            (key) => entry.data_details[key] === field
          );
        };
        const key1 = findKeyForField(field1);
        const key2 = findKeyForField(field2);
        return { ...entry, field1, field2, key1, key2 };
      });

      // Sort by date using the new utility
      const sortedData = sortEntriesByDate(rankedData, sortAscending);

      setFieldData(sortedData);
      setCurrentPage(1); // Reset to first page on new data
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  // Handler functions
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
  };

  const handleRemoveAll = async () => {
    try {
      await deleteUserCVSectionData({
        user_id: userInfo.user_id, // or get user_id from props/context
        data_section_id: section.data_section_id,
      });
      await fetchData(); // Refresh data after toast disappears
      setNotification(`${section.title}'s data removed successfully!`);
      setTimeout(() => {
        setNotification("");
      }, 2500);
      // Log the deletion action
      await logAction(AUDIT_ACTIONS.DELETE_CV_DATA);
    } catch (error) {
      console.error("Error deleting section data:", error);
    }
  };

  const handleEdit = (entry) => {
    const newEntry = {
      fields: entry.data_details,
      data_id: entry.user_cv_data_id,
    };
    setIsNew(false);
    setSelectedEntry(newEntry);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedEntry(null);
    setIsModalOpen(false);
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

  const toggleSortOrder = () => {
    setSortAscending(!sortAscending);
  };

  // Fetch data when section changes or sort order changes
  useEffect(() => {
    setLoading(true);
    setFieldData([]);
    fetchData();
  }, [section.data_section_id, sortAscending]);

  // Reset to first page when search term, filters, or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dropdownFilters, pageSize]);

  const [titleWithoutSectionNumbers, setTitleWithoutSectionNumbers] = useState("");

  useEffect(() => {
    if (section?.title?.includes(".")) {
      const indexOfLastPeriod = section?.title?.lastIndexOf('.')
      const title = section?.title?.slice(indexOfLastPeriod + 1);
      setTitleWithoutSectionNumbers(title);
    } else if (section?.title) {
      setTitleWithoutSectionNumbers(section.title);
    }
  }, [section?.title])

  // Context value
  const value = {
    // State
    searchTerm,
    setSearchTerm,
    fieldData,
    filteredData,
    paginatedData,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    sortAscending,
    selectedEntry,
    isModalOpen,
    isNew,
    loading,
    notification,
    titleWithoutSectionNumbers,

    // Filter states
    dropdownFilters,
    setDropdownFilters,
    showMoreFilters,
    setShowMoreFilters,

    // Section data
    section,

    // Functions
    fetchData,
    handleArchive,
    handleEdit,
    handleCloseModal,
    handleNew,
    handleRemoveAll,
    toggleSortOrder,
    clearAllFilters,
    getDropdownAttributes,
    getUniqueDropdownValues,
    onBack,
  };

  return (
    <GenericSectionContext.Provider value={value}>
      {children}
    </GenericSectionContext.Provider>
  );
};
