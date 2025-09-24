import React, { useState, useEffect } from "react";
import GenericEntry from "../SharedComponents/GenericEntry";
import EntryModal from "../SharedComponents/EntryModal/EntryModal";
import EmploymentModal from "./EmploymentModal";
import { FaArrowLeft } from "react-icons/fa";
import {
  getUserCVData,
  updateUserCVDataArchive,
  deleteUserCVSectionData,
  getAllSections,
} from "../graphql/graphqlHelpers";
import { useAuditLogger, AUDIT_ACTIONS } from "../Contexts/AuditLoggerContext";
import { sortEntriesByDate } from "../utils/dateUtils";

const EmploymentSection = ({ user, section, onBack }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [fieldData, setFieldData] = useState([]);
  const [sortAscending, setSortAscending] = useState(false); // false = descending (most recent first)
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [retrievingData, setRetrievingData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const [notification, setNotification] = useState(""); // <-- Add this

    const { logAction } = useAuditLogger();
  
  
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
    // Don't try to transform non-existent endDateMonth/endDateYear fields
    // Just pass the original data as is
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
    setRetrievingData(false);
  };

  const handleNew = () => {
    setIsNew(true);
    if (typeof section.attributes === "string") {
      section.attributes = JSON.parse(section.attributes);
    }
    const emptyEntry = Object.keys(section.attributes).reduce((acc, key) => {
      acc[key.toLowerCase().replace(/ /g, "_")] = "";
      return acc;
    }, {});

    const newEntry = { fields: emptyEntry, data_id: null };
    setSelectedEntry(newEntry);
    setIsModalOpen(true);
  };

  const toggleSortOrder = () => {
    setSortAscending(!sortAscending);
  };

  async function fetchData() {
    setLoading(true);
    try {
      const retrievedData = await getUserCVData(
        user.user_id,
        section.data_section_id
      );
      const parsedData = retrievedData.map((data) => ({
        ...data,
        data_details: JSON.parse(data.data_details),
      }));
      
      // Sort using the new date utility
      const sortedData = sortEntriesByDate(parsedData, sortAscending);
      setFieldData(sortedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
    // Fetch when section or sort order changes
  }, [section.data_section_id, sortAscending]);

  useEffect(() => {
    if (fieldData.length !== 0) {
      setIsAvailable(true);
    }
  }, [fieldData]);

  const handleBack = () => {
    onBack();
  };

  // Filter fieldData by search term (case-insensitive, checks university/organization and dates)
  const filteredData = fieldData.filter((entry) => {
    const org = entry.data_details["university/organization"]?.toLowerCase() || "";
    const dates = entry.data_details["dates"]?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return org.includes(search) || dates.includes(search);
  });

  return (
    <div>
      <div>
        <button
          onClick={handleBack}
          className="text-zinc-800 btn btn-ghost min-h-0 h-8 leading-tight mr-4 mt-5"
        >
          <FaArrowLeft className="h-6 w-6 text-zinc-800" />
        </button>
        <div className="mt-4 mx-4 flex">
          <h2 className="text-left text-4xl font-bold text-zinc-600">
            {section.title}
          </h2>
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
          <div className="flex-1 mr-12 mt-4">{section.description}</div>
          <button
            onClick={handleDelete}
            className="text-white btn btn-warning min-h-0 h-8 leading-tight"
            disabled={isAvailable ? false : true}
          >
            Remove All
          </button>
        </div>
        <div className="m-4 flex items-center gap-3">
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
          <div className="rounded-lg border border-gray-300 p-2 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Total: <span className="font-semibold text-blue-600">{filteredData.length}</span>
            </span>
            <button
              onClick={toggleSortOrder}
              className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-colors duration-200"
              title={`Sort by date: ${sortAscending ? 'Oldest first' : 'Newest first'} (click to toggle)`}
            >
              <svg 
                className="w-4 h-4 text-gray-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
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
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center w-full">
          <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
        </div>
      ) : (
        <div>
          <div>
            {filteredData.length > 0 ? (
              filteredData.map((entry, index) => (
                <GenericEntry
                  key={index}
                  onEdit={() => handleEdit(entry)}
                  field1={entry.data_details["university/organization"]}
                  field2={entry.data_details["dates"]}
                  data_details={entry.data_details}
                  onArchive={() => handleArchive(entry)}
                />
              ))
            ) : (
              <p className="m-4">No data found</p>
            )}
          </div>
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

          {retrievingData && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center w-full justify-center mx-auto">
              <EmploymentModal
                user={user}
                section={section}
                onClose={handleCloseModal}
                setRetrievingData={setRetrievingData}
                fetchData={fetchData}
              />
            </div>
          )}
        </div>
      )}
      {notification && (
        <div className="fixed top-8 right-6 z-50 bg-green-600 text-white px-4 py-2 rounded shadow-lg transition-all">
          {notification}
        </div>
      )}
    </div>
  );
};

export default EmploymentSection;
