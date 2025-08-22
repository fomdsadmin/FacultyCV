import EntryList from "./EntryList"
import EntryModalWrapper from "./EntryModalWrapper"
import {
  GenericSectionProvider,
  useGenericSection,
} from "./GenericSectionContext";
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
  } = useGenericSection();

  return (
    <div>
      <SectionHeader />
      <SectionDescription />
      <SearchInput />

      {/* Pagination Controls */}
      <div className="m-4 p-4 rounded-2xl border border-gray-300 shadow-sm bg-white flex flex-wrap justify-between items-center">
        {/* Left controls */}
        <div className="flex items-center gap-3">
          <span className="text-lg font-medium text-gray-700">
            Total Entries: <span className="font-semibold text-blue-600">{fieldData.length}</span>
          </span>
        </div>
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

      {/* Entries List (paginated) */}
      {loading ? (
        <div className="flex items-center justify-center w-full">
          <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
        </div>
      ) : (
        <EntryList entries={paginatedData} />
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

export default GenericSection
