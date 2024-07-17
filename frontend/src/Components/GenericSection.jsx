import React, { useState, useEffect } from 'react';
import GenericEntry from './GenericEntry';
import EntryModal from './EntryModal';
import { getUserCVData, addUserCVData } from '../graphql/graphqlHelpers';


// Function to rank fields based on importance
const rankFields = (entry) => {
    const importance = {
      dates: 1,
      title: 2,
      name: 3,
      rank: 4,
      role: 5,
      department: 6,
      type: 7,
      publisher: 8,
      journal: 9,
      details: 10,
      other: 11,
      description: 12,
      inventor: 13,
      supervisor: 14
    };
  
    const rankedFields = Object.entries(entry)
      .filter(([key, value]) => !key.toLowerCase().includes('id') && Object.keys(importance).some(importantKey => key.toLowerCase().includes(importantKey)))
      .sort((a, b) => {
        const aKey = Object.keys(importance).find(importantKey => a[0].toLowerCase().includes(importantKey));
        const bKey = Object.keys(importance).find(importantKey => b[0].toLowerCase().includes(importantKey));
        return importance[aKey] - importance[bKey];
      });
  
    if (rankedFields.length === 0) {
      return [];
    } else if (rankedFields.length === 1) {
      return [rankedFields[0][1]];
    } else {
      return rankedFields.slice(0, 2).map(([key, value]) => value);
    }
  };

  const generateEmptyEntry = (attributes) => {
    const emptyEntry = {};
    for (const key of Object.keys(attributes)) {
      emptyEntry[key] = '';
    }
    return emptyEntry;
  };

const GenericSection = ({ user, section }) => {
  const [userData, setUserData] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');

  const [fieldData, setFieldData] = useState([]);
  const [entryData, setEntryData] = useState([]);

  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const [loading, setLoading] = useState(true);

  const handleSearchChange = (event) => {
      setSearchTerm(event.target.value);
  };

  const handleEdit = (entry) => {
      console.log("entry " + entry.title);
      
      const { field1, field2, ...newEntry } = entry;
      
      setIsNew(false);
      setSelectedEntry(newEntry);
      
      console.log("selected entry " + newEntry);
      
      setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
      setSelectedEntry(null);
      setIsModalOpen(false);
  };

  const handleNew = () => {
      setIsNew(true);
      const emptyEntry = generateEmptyEntry(section.attributes);
      setSelectedEntry(emptyEntry);
      setIsModalOpen(true);
  };

  useEffect(() => {
    async function fetchData() {
      const retrievedData = await getUserCVData(user.user_id, section.data_section_id);
  
      // Parse the data_details field from a JSON string to a JSON object
      const parsedData = retrievedData.map(data => ({
        ...data,
        data_details: JSON.parse(data.data_details),
      }));

      setUserData(parsedData);
  
      console.log("parsed data: " + JSON.stringify(parsedData));
  
      const filteredData = parsedData.filter(entry => {
        const [field1, field2] = rankFields(entry.data_details);
        return (
          (field1 && field1.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (field2 && field2.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      });
      console.log("filtered data: " + JSON.stringify(filteredData));
  
      const rankedData = filteredData.map(entry => {
        const [field1, field2] = rankFields(entry.data_details);
        return { ...entry, field1, field2 };
      });
  
      const entryFields = filteredData.map(entry => {
        return { ...entry };
      });

      console.log("entry fields " + JSON.stringify(entryFields));
      console.log("ranked data " + JSON.stringify(rankedData));
  
      setEntryData(entryFields);
      setFieldData(rankedData);
  
      console.log("field data " + JSON.stringify(fieldData));
      console.log("entry data " + JSON.stringify(entryData));
      setLoading(false);
    }
    
    fetchData();
  }, [searchTerm, section.data_section_id]);

  return (
    <div>
      {loading ? (
          <div className='flex items-center justify-center w-full'>
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
        <div>
          <div className='m-4 max-w-lg flex'>
            <h2 className="text-left text-4xl font-bold text-zinc-600">{section.title}</h2>
            <button onClick={handleNew} className='ml-auto text-white btn btn-success min-h-0 h-8 leading-tight'>New</button>
          </div>

          <div className='m-4 max-w-lg flex'>
            <label className="input input-bordered flex items-center gap-2 flex-1">
            <input
                type="text"
                className="grow"
                placeholder="Search"
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

          <div>
            {fieldData.length > 0 ? (
            fieldData.map((entry, index) => (
                <GenericEntry
                key={index}
                onEdit={() => handleEdit(entry)}
                field1={entry.field1}
                field2={entry.field2}
                />
            ))
            ) : (
            <p className="m-4">No data found</p>
            )}
          </div>

          {isModalOpen && selectedEntry && !isNew && (
            <EntryModal
                isNew={false}
                {...selectedEntry}
                entryType={section.title}
                onClose={handleCloseModal}
            />
          )}

          {isModalOpen && selectedEntry && isNew && (
            <EntryModal
                isNew={true}
                {...selectedEntry}
                entryType={section.title}
                onClose={handleCloseModal}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default GenericSection;