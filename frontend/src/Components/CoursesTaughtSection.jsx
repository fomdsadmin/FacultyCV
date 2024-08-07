import React, { useState, useEffect } from 'react';
import GenericEntry from './GenericEntry';
import EntryModal from './EntryModal';
import { getUserCVData, updateUserCVDataArchive, getTeachingDataMatches, addUserCVData } from '../graphql/graphqlHelpers';
import { rankFields } from '../utils/rankingUtils';

const generateEmptyEntry = (attributes) => {
  const emptyEntry = {};
  for (const key of Object.keys(attributes)) {
    const newKey = key.toLowerCase().replace(/ /g, '_');
    emptyEntry[newKey] = '';
  }
  return emptyEntry;
};

const CoursesTaughtSection = ({ user, section }) => {
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
      console.log('Archived entry ', result);
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
    console.log(newEntry);
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
      console.log("emptyEntry", emptyEntry);
      const newEntry = {fields: emptyEntry, data_id: null};
      setSelectedEntry(newEntry);
      setIsModalOpen(true);
  };

  async function fetchCourseData() {
    setRetrievingData(true);
    try {
      const retrievedData = await getTeachingDataMatches(user.institution_user_id);
      console.log(retrievedData);

      for (const dataObject of retrievedData) {
        const { data_details } = dataObject; // Extract the data_details property

        // Handle adding new entry using data_details
        try {
          const data_details_json = data_details.replace(/"/g, '\\"'); // Escape special characters
          console.log('Adding new entry:', `"${data_details_json}"`);
          const result = await addUserCVData(user.user_id, section.data_section_id, `"${data_details_json}"`);
          console.log(result);
        } catch (error) {
          console.error('Error adding new entry:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
    }
    fetchData();
    setRetrievingData(false);
  }
  
  async function fetchData() {
    try {
      const retrievedData = await getUserCVData(user.user_id, section.data_section_id);
      // Parse the data_details field from a JSON string to a JSON object
      const parsedData = retrievedData.map(data => ({
        ...data,
        data_details: JSON.parse(data.data_details),
      }));

      console.log(parsedData)

      const filteredData = parsedData.filter(entry => {
        const [field1, field2] = rankFields(entry.data_details);
        console.log(field1, field2);
        return (
          (field1 && typeof field1 === 'string' && field1.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (field2 && typeof field2 === 'string' && field2.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      });
      console.log("filtered data: " + JSON.stringify(filteredData));
  
      const rankedData = filteredData.map(entry => {
        const [field1, field2] = rankFields(entry.data_details);
        return { ...entry, field1, field2 };
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

  return (
    <div>
      <div>
        <div className='m-4 max-w-lg flex'>
          <h2 className="text-left text-4xl font-bold text-zinc-600">{section.title}</h2>
          <button onClick={handleNew} className='ml-auto text-white btn btn-success min-h-0 h-8 leading-tight'>New</button>
          <button onClick={fetchCourseData} className='ml-2 text-white btn btn-info min-h-0 h-8 leading-tight' disabled={retrievingData}>
            {retrievingData ? 'Retrieving...' : 'Retrieve Data'}
          </button>
        </div>
        <div className='m-4 max-w-lg flex'>{section.description}</div>
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
                onArchive={() =>  handleArchive(entry)}
                />
            ))
            ) : (
            <p className="m-4">No data found</p>
            )}
          </div>

          {isModalOpen && selectedEntry && !isNew && (
            <EntryModal
                isNew={false}
                user = {user}
                section = {section}
                fields = {selectedEntry.fields}
                user_cv_data_id = {selectedEntry.data_id}
                entryType={section.title}
                fetchData={fetchData}
                onClose={handleCloseModal}
            />
          )}

          {isModalOpen && selectedEntry && isNew && (
            <EntryModal
              isNew={true}
              user = {user}
              section = {section}
              userData = {fieldData}
              fields = {selectedEntry.fields}
              user_cv_data_id = {selectedEntry.data_id}
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

export default CoursesTaughtSection;