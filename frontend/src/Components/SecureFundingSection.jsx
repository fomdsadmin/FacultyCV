import React, { useState, useEffect } from 'react';
import PermanentEntry from './PermanentEntry';
import GenericEntry from './GenericEntry';
import PermanentEntryModal from './PermanentEntryModal';
import EntryModal from './EntryModal';
import { FaArrowLeft } from 'react-icons/fa';
import SecureFundingModal from './SecureFundingModal';
import { getUserCVData, updateUserCVDataArchive } from '../graphql/graphqlHelpers';
import { rankFields } from '../utils/rankingUtils';

  const generateEmptyEntry = (attributes) => {
    const emptyEntry = {};
    for (const key of Object.keys(attributes)) {
      const newKey = key.toLowerCase().replace(/ /g, '_');
      emptyEntry[newKey] = '';
    }
    return emptyEntry;
  };

const SecureFundingSection = ({ user, section, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const [fieldData, setFieldData] = useState([]);

  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const [loading, setLoading] = useState(true);
  const [retrievingData, setRetrievingData] = useState(false);


  const handleSearchChange = (event) => {
      setSearchTerm(event.target.value);
  };

  const handleArchive = async (entry) => {
    setLoading(true);
    setFieldData([]);
    // Implement restore functionality here
    try {
      const result = await updateUserCVDataArchive(entry.user_cv_data_id, true);
      
    }
    catch (error) {
      console.error('Error archiving entry:', error);
    }
    await fetchData();
    setLoading(false);
  };

  const handleEdit = (entry) => {
    const newEntry = {fields: entry.data_details, data_id: entry.user_cv_data_id, editable: entry.editable};
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
      const emptyEntry = generateEmptyEntry(section.attributes);
      
      const newEntry = {fields: emptyEntry, data_id: null};
      setSelectedEntry(newEntry);
      setIsModalOpen(true);
  };
  
  async function fetchData() {
    try {
      const retrievedData = await getUserCVData(user.user_id, section.data_section_id);
      // Parse the data_details field from a JSON string to a JSON object
      const parsedData = retrievedData.map(data => ({
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
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  }
  

  useEffect(() => {
    setLoading(true);
    setFieldData([]);
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
          </button>        </div>
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
              entry.editable ? (
                <GenericEntry
                  key={index}
                  onEdit={() => handleEdit(entry)}
                  field1={entry.field1}
                  field2={entry.field2}
                  data_details={entry.data_details}
                  onArchive={() => handleArchive(entry)}
                />
              ) : (
                <PermanentEntry
                  isArchived={false}
                  key={index}
                  onEdit={() => handleEdit(entry)}
                  field1={entry.field1}
                  field2={entry.field2}
                  data_details={entry.data_details}
                  onArchive={() => handleArchive(entry)}
                />
              )
            ))
          ) : (
              <p className="m-4">No data found</p>
          )}
          </div>
          {isModalOpen && selectedEntry && !isNew && (
            selectedEntry.editable ? (
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
            )
          )}

          {isModalOpen && selectedEntry && isNew && (
              selectedEntry.editable ? (
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
              ) : (
                  <PermanentEntryModal
                      isNew={true}
                      user={user}
                      section={section}
                      fields={selectedEntry.fields}
                      user_cv_data_id={selectedEntry.data_id}
                      entryType={section.title}
                      fetchData={fetchData}
                      onClose={handleCloseModal}
                  />
              )
          )}

          {retrievingData && (
            <SecureFundingModal
              user = {user}
              section = {section}
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

export default SecureFundingSection;