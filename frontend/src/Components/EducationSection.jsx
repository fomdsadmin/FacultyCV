import React, { useState, useEffect } from 'react';
import GenericEntry from "../SharedComponents/GenericEntry";
import EntryModal from "../SharedComponents/EntryModal/EntryModal";
import EducationModal from './EducationModal';
import { FaArrowLeft } from 'react-icons/fa';
import { 
  getUserCVData, 
  updateUserCVDataArchive, 
  deleteUserCVSectionData 
} from '../graphql/graphqlHelpers';
import { rankFields } from '../utils/rankingUtils';
import { useAuditLogger, AUDIT_ACTIONS } from "../Contexts/AuditLoggerContext";


const EducationSection = ({ user, section, onBack = null }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldData, setFieldData] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [retrievingData, setRetrievingData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const [notification, setNotification] = useState("");
  const { logAction } = useAuditLogger();

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleDelete = async () => {
    try {
      await deleteUserCVSectionData({
        user_id: user.user_id,
        data_section_id: section.data_section_id,
      });
      fetchData(); // Refresh data after deletion
      setNotification(`${section.title}'s data removed successfully!`);
      setTimeout(() => {
        setNotification("");
      }, 2500); // 2.5 seconds
      // Log the deletion action
      await logAction(AUDIT_ACTIONS.DELETE_CV_DATA);
    } catch (error) {
      console.error("Error deleting section data:", error);
    }
  };

  const handleArchive = async (entry) => {
    setLoading(true);
    setFieldData([]);
    try {
      await updateUserCVDataArchive(entry.user_cv_data_id, true);
      await logAction(AUDIT_ACTIONS.ARCHIVE_CV_DATA);
    } catch (error) {
      console.error('Error archiving entry:', error);
    }
    await fetchData();
    setLoading(false);
  };

  const handleEdit = (entry) => {
    const newEntry = { fields: entry.data_details, data_id: entry.user_cv_data_id };
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
    if (typeof section.attributes === 'string') {
      section.attributes = JSON.parse(section.attributes);
    }
    const emptyEntry = Object.keys(section.attributes).reduce((acc, key) => {
      acc[key.toLowerCase().replace(/ /g, '_')] = '';
      return acc;
    }, {});

    const newEntry = { fields: emptyEntry, data_id: null };
    setSelectedEntry(newEntry);
    setIsModalOpen(true);
  };

  function extractYear(dateString) {
    const yearMatch = dateString.match(/\b\d{4}\b/);
    return yearMatch ? parseInt(yearMatch[0], 10) : null;
  }

  async function fetchData() {
    setLoading(true);
    try {
      const retrievedData = await getUserCVData(user.user_id, section.data_section_id);
      const parsedData = retrievedData.map((data) => ({
        ...data,
        data_details: JSON.parse(data.data_details),
      }));

      const filteredData = parsedData.filter(entry => {
        const [field1, field2] = rankFields(entry.data_details);

        return (
          (field1 && typeof field1 === 'string' && field1.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (field2 && typeof field2 === 'string' && field2.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      });

      const rankedData = filteredData.map(entry => {
        const [field1, field2] = rankFields(entry.data_details);

        const findKeyForField = (field) => {
          return Object.keys(entry.data_details).find(key => entry.data_details[key] === field);
        };

        const key1 = findKeyForField(field1);
        const key2 = findKeyForField(field2);

        return { ...entry, field1, field2, key1, key2 };
      });

      rankedData.sort((a, b) => {
        const isDateOrYear = (key) => key && (key.toLowerCase().includes('dates') || key.toLowerCase().includes('year'));

        const dateA = isDateOrYear(a.key1) ? extractYear(a.field1) : isDateOrYear(a.key2) ? extractYear(a.field2) : null;
        const dateB = isDateOrYear(b.key1) ? extractYear(b.field1) : isDateOrYear(b.key2) ? extractYear(b.field2) : null;

        if (dateA !== null && dateB !== null) {
          return dateB - dateA;
        } else if (dateA !== null) {
          return -1;
        } else if (dateB !== null) {
          return 1;
        }
        return 0;
      });

      setFieldData(rankedData); // Ensure only filtered and ranked data is set
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  }



  useEffect(() => {
    fetchData();
  }, [searchTerm, section.data_section_id]);

  useEffect(() => {
    if (fieldData.length !== 0) {
      setIsAvailable(true);
    } else {
      setIsAvailable(false);
    }
  }, [fieldData]);

  const handleBack = () => {
    onBack();
  };

  return (
    <div>
      <div>
        {onBack && <button onClick={handleBack} className='text-zinc-800 btn btn-ghost min-h-0 h-8 leading-tight mr-4 mt-5'>
          <FaArrowLeft className="h-6 w-6 text-zinc-800" />
        </button>}
        <div className='m-4 flex'>
          <h2 className="text-left text-4xl font-bold text-zinc-600">{section.title}</h2>
          <button onClick={handleNew} className='ml-auto text-white btn btn-success min-h-0 h-8 leading-tight' disabled={retrievingData}>New</button>
          <button onClick={() => setRetrievingData(true)} className='ml-2 text-white btn btn-info min-h-0 h-8 leading-tight' disabled={retrievingData}>
            {retrievingData ? 'Retrieving...' : 'Retrieve Data'}
          </button>
        </div>
        <div className='mx-4 my-1 flex items-center'>
          <div className="flex-1 mr-12 mt-4">{section.description}</div>
          <button
            onClick={handleDelete}
            className="text-white btn btn-warning min-h-0 h-8 leading-tight"
            disabled={!isAvailable}
          >
            Remove All
          </button>
        </div>
        <div className='m-4 flex'>
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
                clipRule="evenodd" />
            </svg>
          </label>
        </div>
      </div>
      {loading ? (
        <div className='flex items-center justify-center w-full'>
          <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
        </div>
      ) : (
        <div>
          <div>
            {fieldData.length > 0 ? (
              fieldData.map((entry, index) => (
                <GenericEntry
                  key={index}
                  onEdit={() => handleEdit(entry)}
                  field1={entry.data_details.degree}
                  field2={entry.data_details.end_year}
                  data_details={entry.data_details}
                  onArchive={() => handleArchive(entry)}
                />
              ))
            ) : (
              <p className="m-4">No data found</p>
            )}
          </div>
          {isModalOpen && selectedEntry && (
            <EntryModal
              isNew={isNew}
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
            <EducationModal
              user={user}
              section={section}
              onClose={handleCloseModal}
              setRetrievingData={setRetrievingData}
              fetchData={fetchData}
            />
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

export default EducationSection;
