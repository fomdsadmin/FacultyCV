import EntryList from "./EntryList";
import EntryModalWrapper from "./EntryModalWrapper";
import { GenericSectionProvider, useGenericSection } from "./GenericSectionContext";
import SearchInput from "./SearchInput";
import SectionDescription from "./SectionDescription";
import SectionHeader from "./SectionHeader/SectionHeader";

const GenericSectionContent = () => {
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedData,
    fieldData,
    loading,
    section,
    sortAscending,
    toggleSortOrder,
  } = useGenericSection();

  return (
    <div>
      <SectionHeader />
      <SectionDescription />
      {/* Left controls */}
      <div className="flex items-center gap-3 mt-2">
        <SearchInput />
        <div className="rounded-lg border border-gray-300 p-2 my-2 flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            Total Entries: <span className="font-semibold text-blue-600">{fieldData.length}</span>
          </span>
        </div>
        <button
          onClick={toggleSortOrder}
          className="flex items-center justify-center w-9 h-9 rounded-md bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-colors duration-200"
          title={`Sort by date: ${sortAscending ? "Oldest first" : "Newest first"} (click to toggle)`}
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {sortAscending ? (
              // Arrow up (oldest first)
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            ) : (
              // Arrow down (newest first)
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 4v12m0 0l4-4m-4 4l-4-4m10-8v12m0 0l4-4m-4 4l-4-4"
              />
            )}
          </svg>
        </button>
      </div>

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

      {/* Pagination Controls */}
      <div className="mx-4 mt-4 rounded-lg flex flex-wrap justify-end items-center">
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
