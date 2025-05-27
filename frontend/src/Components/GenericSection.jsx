import React, { useState, useEffect } from 'react';
import GenericEntry from './GenericEntry';
import EntryModal from './EntryModal';
import { FaArrowLeft } from 'react-icons/fa';
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

const GenericSection = ({ user, section, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const [fieldData, setFieldData] = useState([]);

  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const [loading, setLoading] = useState(true);

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
    const newEntry = {fields: entry.data_details, data_id: entry.user_cv_data_id};
    setIsNew(false);
    setSelectedEntry(newEntry);
    
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
      setSelectedEntry(null);
      setIsModalOpen(false);
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

            const findKeyForField = (field) => {
                return Object.keys(entry.data_details).find(key => entry.data_details[key] === field);
            };

            const key1 = findKeyForField(field1);
            const key2 = findKeyForField(field2);

            return { ...entry, field1, field2, key1, key2 };
        });

        const extractYear = (dateStr) => {
            if (dateStr.toLowerCase().includes('current')) {
                return Infinity; // Use Infinity to ensure "Current" is always sorted higher
            }
            const years = dateStr.match(/\b\d{4}\b/g);
            return years ? parseInt(years[years.length - 1]) : null; // Use the last year in the string
        };
        
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
      {
        onBack &&
        <button onClick={handleBack} className='text-zinc-800 btn btn-ghost min-h-0 h-8 mt-5 leading-tight mr-4'>
          <FaArrowLeft className="h-6 w-6 text-zinc-800" />
        </button>
      }
      <div className='m-4 flex items-center'>
        <h2 className="text-left text-4xl font-bold text-zinc-600">{section.title}</h2>
        <button onClick={handleNew} className='ml-auto text-white btn btn-success min-h-0 h-8 leading-tight'>New</button>
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
                  isArchived={false}
                  key={index}
                  onEdit={() => handleEdit(entry)}
                  field1={entry.field1}
                  field2={entry.field2}
                  data_details={entry.data_details}
                  onArchive={() => handleArchive(entry)}
                />
              ))
            ) : (
              <p className="m-4">No data found</p>
            )}
          </div>

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

          {isModalOpen && selectedEntry && isNew && (
            <EntryModal
              isNew={true}
              user={user}
              section={section}
              userData={fieldData}
              fields={selectedEntry.fields}
              user_cv_data_id={selectedEntry.data_id}
              entryType={section.title}
              fetchData={fetchData}
              onClose={handleCloseModal}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default GenericSection;