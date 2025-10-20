import React, { useState, useEffect, useMemo } from "react";
import PermanentEntry from "./PermanentEntry";
import GenericEntry from "../SharedComponents/GenericEntry";
import PermanentEntryModal from "./PermanentEntryModal";
import EntryModal from "../SharedComponents/EntryModal/EntryModal";
import { FaArrowLeft, FaSearch } from "react-icons/fa";
import SecureFundingModal from "./SecureFundingModal";
import SecureFundingEntry from "./SecureFundingEntry";
import { getUserCVData, updateUserCVDataArchive, deleteUserCVSectionData } from "../graphql/graphqlHelpers";
import { rankFields } from "../utils/rankingUtils";
import { sortEntriesByDate } from "../utils/dateUtils";
import { useAuditLogger, AUDIT_ACTIONS } from "../Contexts/AuditLoggerContext";

const generateEmptyEntry = (attributes) => {
  const emptyEntry = {};
  for (const key of Object.keys(attributes)) {
    const newKey = key.toLowerCase().replace(/ /g, "_");
    emptyEntry[newKey] = "";
  }
  return emptyEntry;
};

const SecureFundingSection = ({ user, section, onBack }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [fieldData, setFieldData] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retrievingData, setRetrievingData] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [notification, setNotification] = useState(""); // <-- Add this

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortDescending, setSortDescending] = useState(true);
  const [sortAscending, setSortAscending] = useState(false);

  // Filter states for dropdowns
  const [dropdownFilters, setDropdownFilters] = useState({});
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Get filtered data and calculate pagination - using useMemo to ensure re-render on sort change
  const filteredData = useMemo(() => {
    let filtered = fieldData;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((entry) => {
        const [field1, field2] = rankFields(entry.data_details);
        return (
          (field1 && typeof field1 === "string" && field1.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (field2 && typeof field2 === "string" && field2.toLowerCase().includes(searchTerm.toLowerCase()))
        );
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
          if (!entryValue || entryValue.trim() === "" || entryValue === "—") return false;

          // Handle "Other (value)" format
          if (typeof entryValue === "string" && /\bother\b/i.test(entryValue) && /\(.*\)$/.test(entryValue)) {
            const match = entryValue.match(/^(.*Other)\s*\((.*)\)$/i);
            if (match) {
              return match[1].trim() === filterValue;
            }
          }

          return entryValue === filterValue;
        });
      }
    });

    // Apply sorting after filtering using proper date utilities
    const sortedData = sortEntriesByDate(filtered, sortAscending);

    return sortedData;
  }, [fieldData, searchTerm, dropdownFilters, sortAscending, section.attributes]);

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
        if (value && value.trim() !== "" && value !== "—" && value.toLowerCase() !== "null") {
          // Handle "Other (value)" format
          if (typeof value === "string" && /\bother\b/i.test(value) && /\(.*\)$/.test(value)) {
            const match = value.match(/^(.*Other)\s*\((.*)\)$/i);
            if (match) {
              values.add(match[1].trim());
            }
          } else {
            values.add(value);
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
    // Implement restore functionality here
    try {
      const result = await updateUserCVDataArchive(entry.user_cv_data_id, true);
      // Log the archive action
      await logAction(AUDIT_ACTIONS.ARCHIVE_CV_DATA);
    } catch (error) {
      console.error("Error archiving entry:", error);
    }
    await fetchData();
    setLoading(false);
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

  const handleView = (entry) => {
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

  async function fetchData() {
    try {
      const retrievedData = await getUserCVData(user.user_id, section.data_section_id);
      // Parse the data_details field from a JSON string to a JSON object
      const parsedData = retrievedData.map((data) => ({
        ...data,
        data_details: JSON.parse(data.data_details),
      }));

      const rankedData = parsedData.map((entry) => {
        const [field1, field2] = rankFields(entry.data_details);
        return { ...entry, field1, field2 };
      });

      setFieldData(rankedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (fieldData.length !== 0) {
      setIsAvailable(true);
    }
  }, [fieldData]);

  useEffect(() => {
    setLoading(true);
    setFieldData([]);
    fetchData();
  }, [section.data_section_id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize, dropdownFilters]);

  const handleBack = () => {
    onBack();
  };

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
            className="text-white btn btn-success min-h-0 h-10 px-4 leading-tight"
            disabled={retrievingData}
          >
            New
          </button>
          <button
            onClick={() => setRetrievingData(true)}
            className="text-white btn btn-info min-h-0 h-10 px-4 leading-tight"
            disabled={retrievingData}
          >
            {retrievingData ? "Retrieving..." : "Retrieve Data"}
          </button>
          <button
            onClick={handleDelete}
            className="text-white btn btn-warning min-h-0 h-10 px-4 leading-tight"
            disabled={!isAvailable}
          >
            Remove All
          </button>
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
                      const [field1, field2] = rankFields(entry.data_details);
                      return (
                        (field1 &&
                          typeof field1 === "string" &&
                          field1.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (field2 &&
                          typeof field2 === "string" &&
                          field2.toLowerCase().includes(searchTerm.toLowerCase()))
                      );
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
                        if (!entryValue || entryValue.trim() === "" || entryValue === "—") return false;

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

                        return entryValue === filterValue;
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
                    if (!entryValue || entryValue.trim() === "" || entryValue === "—") return false;

                    // Handle "Other (value)" format
                    if (typeof entryValue === "string" && /\bother\b/i.test(entryValue) && /\(.*\)$/.test(entryValue)) {
                      const match = entryValue.match(/^(.*Other)\s*\((.*)\)$/i);
                      if (match) {
                        return match[1].trim() === optionValue;
                      }
                    }

                    return entryValue === optionValue;
                  }).length;
                };

                return (
                  <div key={attribute} className="max-w-56">
                    <label className="block text-xs font-medium text-zinc-600 mb-1">
                      {attribute.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </label>
                    <select
                      value={dropdownFilters[attribute] || "all"}
                      onChange={(e) => {
                        const newFilters = { ...dropdownFilters };
                        if (e.target.value === "all") {
                          delete newFilters[attribute];
                        } else {
                          newFilters[attribute] = e.target.value;
                        }
                        setDropdownFilters(newFilters);
                        setCurrentPage(1);
                      }}
                      className="w-full px-2 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                    >
                      <option value="all">All ({getCountForOption("all")})</option>
                      {uniqueValues.map((value) => (
                        <option key={value} value={value}>
                          {value} ({getCountForOption(value)})
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}

            {/* Show More Filters Button */}
            {getDropdownAttributes().length > 2 && (
              <button
                onClick={() => setShowMoreFilters(!showMoreFilters)}
                className="px-3 py-2 text-xs text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
              >
                {showMoreFilters ? "Show Less" : `Show More Filters (${getDropdownAttributes().length - 2})`}
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
          {showMoreFilters && getDropdownAttributes().length > 2 && (
            <div className="flex flex-wrap gap-3 items-end border-t border-zinc-200 pt-3 mt-1">
              {/* Remaining dropdown filters */}
              {getDropdownAttributes()
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
                        const [field1, field2] = rankFields(entry.data_details);
                        return (
                          (field1 &&
                            typeof field1 === "string" &&
                            field1.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (field2 &&
                            typeof field2 === "string" &&
                            field2.toLowerCase().includes(searchTerm.toLowerCase()))
                        );
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
                          if (!entryValue || entryValue.trim() === "" || entryValue === "—") return false;

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

                          return entryValue === filterValue;
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
                      if (!entryValue || entryValue.trim() === "" || entryValue === "—") return false;

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

                      return entryValue === optionValue;
                    }).length;
                  };

                  return (
                    <div key={attribute} className="max-w-56">
                      <label className="block text-xs font-medium text-zinc-600 mb-1">
                        {attribute.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </label>
                      <select
                        value={dropdownFilters[attribute] || "all"}
                        onChange={(e) => {
                          const newFilters = { ...dropdownFilters };
                          if (e.target.value === "all") {
                            delete newFilters[attribute];
                          } else {
                            newFilters[attribute] = e.target.value;
                          }
                          setDropdownFilters(newFilters);
                          setCurrentPage(1);
                        }}
                        className="w-full px-2 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                      >
                        <option value="all">All ({getCountForOption("all")})</option>
                        {uniqueValues.map((value) => (
                          <option key={value} value={value}>
                            {value} ({getCountForOption(value)})
                          </option>
                        ))}
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
      {loading ? (
        <div className="flex items-center justify-center w-full">
          <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
        </div>
      ) : (
        <div className="mx-4 pr-2 my-2 max-h-[50vh] overflow-y-auto rounded-lg">
          <div className="space-y-4">
            {paginatedData.length > 0 ? (
              paginatedData.map((entry, index) => {
                // Omit the "agency" field and add "sponsor" field for view (PermanentEntry)
                const { agency, ...filteredDetails } = entry.data_details;
                return entry.editable ? (
                  <div key={index} className="w-full">
                    <GenericEntry
                      onEdit={() => handleEdit(entry)}
                      field1={entry.field1}
                      field2={entry.field2}
                      data_details={entry.data_details} // For edit, just omit agency
                      onArchive={() => handleArchive(entry)}
                    />
                  </div>
                ) : (
                  <div key={index} className="w-full">
                    <GenericEntry
                      onEdit={() => handleEdit(entry)}
                      field1={entry.field1}
                      field2={entry.field2}
                      data_details={entry.data_details} // For edit, just omit agency
                      onArchive={() => handleArchive(entry)}
                    />
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">No existing entries found</div>
            )}
          </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          {selectedEntry.editable ? (
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
          ) : (
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
        </div>
      )}

      {isModalOpen && selectedEntry && isNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
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
        </div>
      )}

      {retrievingData && (
        <SecureFundingModal
          user={user}
          section={section}
          onClose={handleCloseModal}
          setRetrievingData={setRetrievingData}
          fetchData={fetchData}
        />
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-4 py-2 rounded shadow-lg transition-all">
          {notification}
        </div>
      )}
    </div>
  );
};

export default SecureFundingSection;
