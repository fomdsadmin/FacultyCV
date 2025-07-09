import React, { useState, useEffect } from "react";
import GenericEntry from "../SharedComponents/GenericEntry";
import EntryModal from "../SharedComponents/EntryModal/EntryModal";
import EmploymentModal from "./EmploymentModal";
import { FaArrowLeft } from "react-icons/fa";
import {
  getUserCVData,
  updateUserCVDataArchive,
  deleteUserCVSectionData,
} from "../graphql/graphqlHelpers";
import { useAuditLogger, AUDIT_ACTIONS } from "../Contexts/AuditLoggerContext";

const EmploymentSection = ({ user, section, onBack }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [fieldData, setFieldData] = useState([]);
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
    } catch (error) {
      console.error("Error archiving entry:", error);
    }
    await fetchData();
    await logAction(AUDIT_ACTIONS.ARCHIVE_CV_DATA);
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
      setFieldData(parsedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [searchTerm, section.data_section_id]);

  // Add a function to sort employment entries
  const sortEmploymentEntries = (entries) => {
    return [...entries].sort((a, b) => {
      const typeA = a.data_details.type?.toLowerCase();
      const typeB = b.data_details.type?.toLowerCase();

      // Put "present" entries first
      if (typeA === "present" && typeB !== "present") return -1;
      if (typeA !== "present" && typeB === "present") return 1;

      // Extract start dates from date strings for both entries
      const getStartDate = (dateStr) => {
        const parts = dateStr.split(" - ");
        const startPart = parts[0];

        try {
          const [month, year] = startPart.split(", ");
          const monthIndex = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ].indexOf(month);

          return new Date(parseInt(year), monthIndex);
        } catch (error) {
          // Handle any parsing errors
          return new Date(0);
        }
      };

      // For two "present" entries, sort by start date (descending)
      if (typeA === "present" && typeB === "present") {
        const startDateA = getStartDate(a.data_details.dates);
        const startDateB = getStartDate(b.data_details.dates);

        // Sort descending (newer start dates first)
        return startDateB - startDateA;
      }

      // For prior entries, sort by end date (descending)
      if (typeA === "prior" && typeB === "prior") {
        // Extract end dates from date strings
        const getEndDate = (dateStr) => {
          const parts = dateStr.split(" - ");
          if (parts.length < 2) return new Date(0); // No end date

          const endPart = parts[1];
          // Parse the end date (format: "Month, Year")
          try {
            const [month, year] = endPart.split(", ");
            const monthIndex = [
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ].indexOf(month);

            return new Date(parseInt(year), monthIndex);
          } catch (error) {
            // Handle any parsing errors
            return new Date(0);
          }
        };

        const dateA = getEndDate(a.data_details.dates);
        const dateB = getEndDate(b.data_details.dates);

        // Sort descending (newer dates first)
        return dateB - dateA;
      }

      return 0;
    });
  };

  useEffect(() => {
    if (fieldData.length !== 0) {
      setIsAvailable(true);
    }
  }, [fieldData]);

  const handleBack = () => {
    onBack();
  };

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
        <div>
          <div>
            {fieldData.length > 0 ? (
              sortEmploymentEntries(fieldData).map((entry, index) => (
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
