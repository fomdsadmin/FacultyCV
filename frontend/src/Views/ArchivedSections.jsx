import React, { useState, useEffect } from 'react';
import PageContainer from './PageContainer.jsx';
import AdminMenu from '../Components/AdminMenu.jsx';
import { getArchivedSections, updateSection } from '../graphql/graphqlHelpers.js';
import ArchiveSection from '../Components/ArchiveSection.jsx';

const ArchivedSections = ({ getCognitoUser, userInfo }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dataSections, setDataSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDataSections();
  }, []);

  const getDataSections = async () => {
    setDataSections([]);
    try {
      const retrievedSections = await getArchivedSections();

      const parsedSections = retrievedSections.map(section => ({
        ...section,
        attributes: JSON.parse(section.attributes),
      }));

      parsedSections.sort((a, b) => a.title.localeCompare(b.title));

      

      setDataSections(parsedSections);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
    setLoading(false);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const searchedSections = dataSections.filter(entry => {
    const section = entry.title || '';
    const category = entry.data_type || '';

    const matchesSearch = section.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
      category.toLowerCase().startsWith(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const restoreSection = async (id, attributes) => {
    setLoading(true);
    try {
      const attributesString = JSON.stringify(attributes)
      const result = await updateSection(id, false, attributesString);
      
    } catch (error) {
      console.error('Error restoring section:', error);
    }
    
    await getDataSections();
    setLoading(false);
  };

  return (
    <PageContainer>
      <AdminMenu getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} />
      <main className='ml-4 pr-5 overflow-auto custom-scrollbar w-full mb-4'>
        {loading ? (
          <div className='w-full h-full flex items-center justify-center'>
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <div className='!overflow-auto !h-full custom-scrollbar'>
            <h1 className="text-left m-4 text-4xl font-bold text-zinc-600">Archived Sections</h1>
            <div className='m-4 flex'>
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
            {searchedSections.length === 0 ? (
                <div className="text-zinc-600 mt-4 ml-4">No archived sections</div>
              ) : (
                <>
                  {searchedSections.map((section) => (
                    <ArchiveSection key={section.data_section_id} section={section} restoreSection={restoreSection}></ArchiveSection>
                  ))}
                </>
              )}            
          </div>
        )}
      </main>
    </PageContainer>
  )
}

export default ArchivedSections;
