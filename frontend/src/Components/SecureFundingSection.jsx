import React, { useState, useEffect } from "react";
import PermanentEntry from "./PermanentEntry";
import GenericEntry from "../SharedComponents/GenericEntry";
import PermanentEntryModal from "./PermanentEntryModal";
import EntryModal from "../SharedComponents/EntryModal/EntryModal";
import { FaArrowLeft } from "react-icons/fa";
import SecureFundingModal from "./SecureFundingModal";
import SecureFundingEntry from "./SecureFundingEntry";
import { getUserCVData, updateUserCVDataArchive, deleteUserCVSectionData } from "../graphql/graphqlHelpers";
import { rankFields } from "../utils/rankingUtils";
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

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [isAvailable, setIsAvailable] = useState(false);
  const [notification, setNotification] = useState(""); // <-- Add this

  const totalPages = Math.ceil(fieldData.length / pageSize);
  const paginatedData = fieldData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const { logAction } = useAuditLogger();

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

      const filteredData = parsedData.filter((entry) => {
        const [field1, field2] = rankFields(entry.data_details);

        return (
          (field1 && typeof field1 === "string" && field1.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (field2 && typeof field2 === "string" && field2.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      });

      const rankedData = filteredData.map((entry) => {
        const [field1, field2] = rankFields(entry.data_details);
        return { ...entry, field1, field2 };
      });

      // Sorting logic
      rankedData.sort((a, b) => {
        const isDate = (str) => /\b\d{4}[-/]\d{2}[-/]\d{2}\b/.test(str) || /\b\d{4}\b/.test(str); // Regex to match dates like YYYY-MM-DD or YYYY
        const dateA = isDate(a.field1) ? new Date(a.field1) : isDate(a.field2) ? new Date(a.field2) : null;
        const dateB = isDate(b.field1) ? new Date(b.field1) : isDate(b.field2) ? new Date(b.field2) : null;

        if (dateA && dateB) {
          return dateB - dateA;
          return -1;
        } else if (dateB) {
          return 1;
        } else {
          return 0;
        }
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
  }, [searchTerm, section.data_section_id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const handleBack = () => {
    onBack();
  };

  return (
    <div>
      <div>
        <button onClick={handleBack} className="text-zinc-800 btn btn-ghost min-h-0 h-8 leading-tight mr-4 mt-5">
          <FaArrowLeft className="h-6 w-6 text-zinc-800" />
        </button>
        <div className="m-4 flex">
          <h2 className="text-left text-4xl font-bold text-zinc-600 pr-8">{section.title}</h2>
          <button
            onClick={handleNew}
            className="ml-auto text-white btn btn-success min-h-0 h-8 leading-tight"
            disabled={retrievingData}
          >
            New
          </button>
          <button
            onClick={() => setRetrievingData(true)}
            className="ml-2 text-white btn btn-info min-h-0 h-8 leading-tight"
            disabled={retrievingData}
          >
            {retrievingData ? "Retrieving..." : "Retrieve Data"}
          </button>{" "}
        </div>
        <div className="mx-4 my-1 flex items-center">
          <div className="flex-1">{section.description}</div>
          <button
            onClick={handleDelete}
            className="text-white btn btn-warning min-h-0 h-8 leading-tight"
            disabled={isAvailable ? false : true}
          >
            Remove All
          </button>
        </div>
        <div className="m-4 flex">
          <label className="input input-bordered flex items-center gap-2 flex-1">
            <input
              type="text"
              className="grow"
              placeholder={`Search ${section.title}`}
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-4 w-4 opacity-70"
            >
              <path
                fillRule="evenodd"
                d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                clipRule="evenodd"
              />
            </svg>
          </label>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center w-full">
          <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
        </div>
      ) : (
        <>
          <div className="m-4 p-3 rounded-2xl border border-gray-300 shadow-sm bg-white flex flex-wrap justify-between items-center">
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 16h8M8 12h8m-7 8h6a2 2 0 002-2V6a2 2 0 00-2-2h-6a2 2 0 00-2 2v14z"
                />
              </svg>
              <span className="text-lg font-medium text-gray-700">
                Total Grants: <span className="font-semibold text-blue-600">{fieldData.length}</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
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
          <div className="flex items-center justify-center w-full relative mx-auto">
            <div className="w-full ">
              {paginatedData.length > 0 ? (
                paginatedData.map((entry, index) => {
                  // Omit the "agency" field and add "sponsor" field for view (PermanentEntry)
                  const { agency, ...filteredDetails } = entry.data_details;
                  return entry.editable ? (
                    <div className="w-full px-4">
                      <GenericEntry
                        // isArchived={entry.is_archived ? true : false}
                        key={index}
                        onEdit={() => handleEdit(entry)}
                        field1={entry.field1}
                        field2={entry.field2}
                        data_details={entry.data_details} // For edit, just omit agency
                        onArchive={() => handleArchive(entry)}
                        />
                    </div>
                  ) : (
                      <GenericEntry
                        // isArchived={entry.is_archived}
                      key={index}
                      onEdit={() => handleEdit(entry)}
                      field1={entry.field1}
                      field2={entry.field2}
                      data_details={entry.data_details} // For edit, just omit agency
                      onArchive={() => handleArchive(entry)}
                    />
                    // <PermanentEntry
                    //   isArchived={false}
                    //   key={index}
                    //   onEdit={() => handleEdit(entry)}
                    //   field1={entry.field1}
                    //   field2={entry.field2}
                    //   data_details={entry.data_details} // For view, omit agency and add sponsor
                    //   onArchive={() => handleArchive(entry)}
                    // />
                  );
                })
              ) : (
                <p className="m-4">No data found</p>
              )}
            </div>
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
                  // <PermanentEntryModal
                  //   isNew={false}
                  //   user={user}
                  //   section={section}
                  //   fields={selectedEntry.fields}
                  //   user_cv_data_id={selectedEntry.data_id}
                  //   entryType={section.title}
                  //   fetchData={fetchData}
                  //   onClose={handleCloseModal}
                  // />
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
          </div>
        </>
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
