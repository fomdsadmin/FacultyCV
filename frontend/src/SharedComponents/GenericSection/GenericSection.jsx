import EntryList from "./EntryList";
import EntryModalWrapper from "./EntryModalWrapper";
import { GenericSectionProvider, useGenericSection } from "./GenericSectionContext";
import SectionDescription from "./SectionDescription";
import SectionHeader from "./SectionHeader/SectionHeader";
import { FaSearch } from "react-icons/fa";
import { rankFields } from "../../utils/rankingUtils";

const GenericSectionContent = () => {
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedData,
    fieldData,
    filteredData,
    loading,
    section,
    sortAscending,
    toggleSortOrder,
    searchTerm,
    setSearchTerm,
    dropdownFilters,
    setDropdownFilters,
    showMoreFilters,
    setShowMoreFilters,
    clearAllFilters,
    getDropdownAttributes,
    getUniqueDropdownValues,
  } = useGenericSection();

  const dropdownAttributes = getDropdownAttributes();

  return (
    <div>
      <SectionHeader />
      <SectionDescription />

      {/* Only show Filters and Search if there's data */}
      {fieldData.length > 0 && (
        <>
          {/* Filters and Search */}
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
          {dropdownAttributes.slice(0, 2).map((attribute) => {
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
                    (field1 && typeof field1 === "string" && field1.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (field2 && typeof field2 === "string" && field2.toLowerCase().includes(searchTerm.toLowerCase()))
                  );
                });
              }

              // Apply other dropdown filters (excluding current attribute)
              Object.entries(dropdownFilters).forEach(([filterAttribute, filterValue]) => {
                if (filterValue && filterValue !== "all" && filterAttribute !== attribute) {
                  const actualKey = section.attributes && section.attributes[filterAttribute] 
                    ? section.attributes[filterAttribute] 
                    : filterAttribute.toLowerCase().replace(/\s+/g, '_');
                    
                  dataForCounting = dataForCounting.filter((entry) => {
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
                    
                    return stringValue === filterValue || entryValue === filterValue;
                  });
                }
              });

              // Now count items matching this specific option
              if (optionValue === "all") {
                return dataForCounting.length;
              }

              const actualKey = section.attributes && section.attributes[attribute] 
                ? section.attributes[attribute] 
                : attribute.toLowerCase().replace(/\s+/g, '_');

              return dataForCounting.filter((entry) => {
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
                    return match[1].trim() === optionValue;
                  }
                }
                
                return stringValue === optionValue || entryValue === optionValue;
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
          {dropdownAttributes.length > 2 && (
            <button
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className="px-3 py-2 text-xs text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
            >
              {showMoreFilters ? "Show Less" : `Show More Filters (${dropdownAttributes.length - 2})`}
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
        {showMoreFilters && dropdownAttributes.length > 2 && (
          <div className="flex flex-wrap gap-3 items-end border-t border-zinc-200 pt-3 mt-1">
            {/* Remaining dropdown filters */}
            {dropdownAttributes.slice(2).map((attribute) => {
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
                      (field1 && typeof field1 === "string" && field1.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (field2 && typeof field2 === "string" && field2.toLowerCase().includes(searchTerm.toLowerCase()))
                    );
                  });
                }

                // Apply other dropdown filters (excluding current attribute)
                Object.entries(dropdownFilters).forEach(([filterAttribute, filterValue]) => {
                  if (filterValue && filterValue !== "all" && filterAttribute !== attribute) {
                    const actualKey = section.attributes && section.attributes[filterAttribute] 
                      ? section.attributes[filterAttribute] 
                      : filterAttribute.toLowerCase().replace(/\s+/g, '_');
                      
                    dataForCounting = dataForCounting.filter((entry) => {
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
                      
                      return stringValue === filterValue || entryValue === filterValue;
                    });
                  }
                });

                // Now count items matching this specific option
                if (optionValue === "all") {
                  return dataForCounting.length;
                }

                const actualKey = section.attributes && section.attributes[attribute] 
                  ? section.attributes[attribute] 
                  : attribute.toLowerCase().replace(/\s+/g, '_');

                return dataForCounting.filter((entry) => {
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
                      return match[1].trim() === optionValue;
                    }
                  }
                  
                  return stringValue === optionValue || entryValue === optionValue;
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
        </>
      )}

      {/* Entries List (paginated) */}
      {loading ? (
        <div className="flex items-center justify-center w-full">
          <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
        </div>
      ) : (
        <div className="mx-4 pr-2 my-2 max-h-[50vh] overflow-y-auto rounded-lg">
          <EntryList entries={paginatedData} />
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

      <EntryModalWrapper />
    </div>
  );
};

const GenericSection = ({ section, onBack }) => {
  return (
    <GenericSectionProvider section={section} onBack={onBack}>
      <GenericSectionContent />
    </GenericSectionProvider>
  );
};

export default GenericSection;
