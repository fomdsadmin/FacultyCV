import React, { useState, useEffect } from "react";
import PermanentEntry from "./PermanentEntry";
import GenericEntry from "../SharedComponents/GenericEntry";
import EntryModal from "../SharedComponents/EntryModal/EntryModal";
import PermanentEntryModal from "./PermanentEntryModal";
import PublicationsModal from "./PublicationsModal";
import { FaArrowLeft } from "react-icons/fa";
import { getUserCVData, updateUserCVDataArchive, deleteUserCVSectionData } from "../graphql/graphqlHelpers";
import { rankFields } from "../utils/rankingUtils";
import { LuBrainCircuit } from "react-icons/lu";
import { useAuditLogger, AUDIT_ACTIONS } from "../Contexts/AuditLoggerContext";

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

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortDescending, setSortDescending] = useState(true);

  const totalPages = Math.ceil(fieldData.length / pageSize);
  const paginatedData = fieldData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const { logAction } = useAuditLogger();

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

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

      rankedData.sort((a, b) => {
        const yearA = parseInt(a.field2, 10) || 0;
        const yearB = parseInt(b.field2, 10) || 0;
        return yearB - yearA;
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
  }, [searchTerm, section.data_section_id]);

  useEffect(() => {
    if (fieldData.length !== 0) {
      setIsAvailable(true);
    }
  }, [fieldData]);

  const handleBack = () => {
    onBack();
  };

  const GenericEntry = ({ field1, field2, data_details, onEdit, onArchive }) => (
    <div className="entry">
      <h2>{field1}</h2>
      <div className="m-2 flex">
        <button onClick={onArchive} className="ml-auto text-white btn btn-danger min-h-0 h-8 leading-tight">
          X
        </button>
      </div>
      <p>{field2}</p>
      <div>{data_details}</div>
    </div>
  );
  const PermanentEntry = ({ field1, field2, data_details, isArchived, onEdit, onArchive }) => (
    <div className={`entry ${isArchived ? "archived" : ""}`}>
      <h2>{field1}</h2>
      <div className="m-2 flex">
        <button onClick={onArchive} className="ml-auto text-white btn btn-danger min-h-0 h-8 leading-tight">
          X
        </button>
      </div>
      <p>{field2}</p>
      <div>{data_details}</div>
    </div>
  );

  const renderDataDetails = (details) => {
    // console.log(details);
    if (!details || typeof details !== "object") return null;

    const authorList = Array.isArray(details.author_names) ? details.author_names : [details.author_names];
    const authorIds = Array.isArray(details.author_ids) ? details.author_ids : [details.author_ids];
    const keywordsList = Array.isArray(details.keywords) ? details.keywords : [details.keywords];

    // Map author names, bold the one matching user's scopus_id
    const authorDisplay = authorList.map((name, idx) => {
      if (user.scopus_id && authorIds && authorIds[idx] && String(authorIds[idx]) === String(user.scopus_id)) {
        return (
          <span key={idx} className="font-bold ">
            {name}
          </span>
        );
      }
      return <span key={idx}>{name}</span>;
    });

    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-1">{details.title}</h3>
        <p className="text-sm text-gray-700 mb-2">
          {details.display_date ? details.display_date.trim() + ", " : ""}
          {details.volume && (
            <>
              <span className="font-normal">Volume: </span>
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

        {keywordsList?.length > 0 && (
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-semibold">Keywords:</span> {keywordsList.join(", ")}
          </p>
        )}

        {details.journal && (
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-semibold">Journal:</span> {details.journal}
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

        {details.publication_type && (
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-semibold">Type:</span> {details.publication_type}
          </p>
        )}
      </div>
    );
  };

  const sortedData = sortDescending ? paginatedData : [...paginatedData].reverse();

  return (
    <div>
      <div>
        <button onClick={handleBack} className="text-zinc-800 btn btn-ghost min-h-0 h-8 leading-tight mr-4 mt-5">
          <FaArrowLeft className="h-6 w-6 text-zinc-800" />
        </button>
        <div className="mt-4 mx-4 flex">
          <h2 className="text-left text-4xl font-bold text-zinc-600">{section.title}</h2>
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
          </button>
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

      <div className="m-4 p-4 rounded-2xl border border-gray-300 shadow-sm bg-white flex flex-wrap justify-between items-center">
        {/* Left controls */}
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 16h8M8 12h8m-7 8h6a2 2 0 002-2V6a2 2 0 00-2-2h-6a2 2 0 00-2 2v14z"
            />
          </svg>
          <span className="text-lg font-medium text-gray-700">
            Total Publications: <span className="font-semibold text-blue-600">{fieldData.length}</span>
          </span>
        </div>
        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Sort control */}
          <span className="text-gray-700 text-sm font-medium">Sort:</span>
          <button
            className="flex items-center px-3 py-1 border rounded hover:bg-gray-100"
            onClick={() => setSortDescending((prev) => !prev)}
            title="Sort by Year"
            type="button"
          >
            <span className="mr-1 text-sm">Year</span>
            {sortDescending ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
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

      {loading ? (
        <div className="flex items-center justify-center w-full">
          <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
        </div>
      ) : (
        <div>
          <div>
            {sortedData.map((entry, index) =>
              entry.editable ? (
                <GenericEntry
                  key={index}
                  onEdit={() => handleEdit(entry)}
                  data_details={renderDataDetails(entry.data_details)}
                  onArchive={() => handleArchive(entry)}
                />
              ) : (
                <GenericEntry
                  key={index}
                  onEdit={() => handleEdit(entry)}
                  data_details={renderDataDetails(entry.data_details)}
                  onArchive={() => handleArchive(entry)}
                />
              )
            )}
          </div>

          {isModalOpen &&
            selectedEntry &&
            !isNew &&
            (selectedEntry.editable ? (
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
              <PermanentEntryModal
                isNew={false}
                user={user}
                section={section}
                fields={selectedEntry.fields}
                user_cv_data_id={selectedEntry.data_id}
                entryType={section.title}
                fetchData={fetchData}
                onClose={handleCloseModal}
              />
            ))}
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
          {/* // (selectedEntry.editable ? (

            // ) : (
            //   PermanentEntryModal
            //     isNew={true}
            //     user={user}
            //     section={section}
            //     fields={selectedEntry.fields}
            //     user_cv_data_id={selectedEntry.data_id}
            //     entryType={section.title}
            //     fetchData={fetchData}
            //     onClose={handleCloseModal}
            //   />
            // ))} */}
          {retrievingData && (
            <PublicationsModal
              user={user}
              section={section}
              onClose={handleCloseModal}
              setRetrievingData={setRetrievingData}
              fetchData={fetchData}
            />
          )}
        </div>
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

export default PublicationsSection;
