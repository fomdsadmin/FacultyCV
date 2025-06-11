import React, { useState, useEffect } from 'react';
import GenericEntry from "../SharedComponents/GenericEntry";
import EntryModal from "../SharedComponents/EntryModal";
import EmploymentModal from './EmploymentModal';
import { FaArrowLeft } from 'react-icons/fa';
import { getUserCVData, updateUserCVDataArchive } from '../graphql/graphqlHelpers';

const EmploymentSection = ({ user, section, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldData, setFieldData] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [retrievingData, setRetrievingData] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleArchive = async (entry) => {
    setLoading(true);
    setFieldData([]);
    try {
      await updateUserCVDataArchive(entry.user_cv_data_id, true);
    } catch (error) {
      console.error('Error archiving entry:', error);
    }
    await fetchData();
    setLoading(false);
  };

  const handleEdit = (entry) => {
    const transformedFields = {
      ...entry.data_details,
      endDateMonth: entry.data_details.endDateMonth === "present" ? "Current" : entry.data_details.endDateMonth,
      endDateYear: entry.data_details.endDateYear === "N/A" || entry.data_details.endDateYear === "present" ? "None" : entry.data_details.endDateYear,
    };
  
    const newEntry = { fields: transformedFields, data_id: entry.user_cv_data_id };
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

  async function fetchData() {
    setLoading(true);
    try {
      const retrievedData = await getUserCVData(user.user_id, section.data_section_id);
      const parsedData = retrievedData.map((data) => ({
        ...data,
        data_details: JSON.parse(data.data_details),
      }));
      setFieldData(parsedData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [searchTerm, section.data_section_id]);

  const handleBack = () => {
    onBack();
  };

  return (
    <div>
      <div>
        <button onClick={handleBack} className='text-zinc-800 btn btn-ghost min-h-0 h-8 leading-tight mr-4 mt-5'>
          <FaArrowLeft className="h-6 w-6 text-zinc-800" />
        </button>
        <div className='m-4 flex'>
          <h2 className="text-left text-4xl font-bold text-zinc-600">{section.title}</h2>
          <button onClick={handleNew} className='ml-auto text-white btn btn-success min-h-0 h-8 leading-tight' disabled={retrievingData}>New</button>
          <button onClick={() => setRetrievingData(true)} className='ml-2 text-white btn btn-info min-h-0 h-8 leading-tight' disabled={retrievingData}>
            {retrievingData ? 'Retrieving...' : 'Retrieve Data'}
          </button>
        </div>
        <div className='m-4 flex'>{section.description}</div>
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
                  field1={entry.data_details.rank_or_title}
                  field2={entry.data_details.university_or_organization}
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
            <EmploymentModal
              user={user}
              section={section}
              onClose={handleCloseModal}
              setRetrievingData={setRetrievingData}
              fetchData={fetchData}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default EmploymentSection;
