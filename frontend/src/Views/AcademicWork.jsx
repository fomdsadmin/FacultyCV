import React, { useState, useEffect } from 'react';
import PageContainer from './PageContainer.jsx';
import FacultyMenu from '../Components/FacultyMenu';
import WorkSection from '../Components/WorkSection';
import '../CustomStyles/scrollbar.css';
import Filters from '../Components/Filters.jsx';
import GenericSection from '../Components/GenericSection.jsx';
import CoursesTaughtSection from '../Components/CoursesTaughtSection.jsx';
import SecureFundingSection from '../Components/SecureFundingSection.jsx';
import PublicationsSection from '../Components/PublicationsSection.jsx';
import PatentsSection from '../Components/PatentsSection.jsx';
import { getAllSections } from '../graphql/graphqlHelpers.js';

const AcademicWork = ({ getCognitoUser, userInfo }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [dataSections, setDataSections] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    getDataSections();
  }, []);

  const getDataSections = async () => {
    const retrievedSections = await getAllSections();
  
    // Parse the attributes field from a JSON string to a JSON object
    const parsedSections = retrievedSections.map(section => ({
      ...section,
      attributes: JSON.parse(section.attributes),
    }));
    
    parsedSections.sort((a, b) => a.title.localeCompare(b.title));

    console.log(parsedSections);
    setDataSections(parsedSections);
    setLoading(false);
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filters = Array.from(new Set(dataSections.map(section => section.data_type)));

  const handleManageClick = (value) => {

    const section = dataSections.filter((section) => section.data_section_id == value);

    setActiveSection(section[0]);
  }

  const searchedSections = dataSections.filter(entry => {
    const section = entry.title || '';
    const category = entry.data_type || '';

    const matchesSearch = section.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
      category.toLowerCase().startsWith(searchTerm.toLowerCase());

    const matchesFilter = activeFilters.length === 0 || !activeFilters.includes(category);

    return matchesSearch && matchesFilter;
  });

  const handleBack = () => {
    setActiveSection(null);
  };
  
  return (
    <PageContainer>
      <FacultyMenu userName={userInfo.preferred_name || userInfo.first_name} getCognitoUser={getCognitoUser}></FacultyMenu>
      <main className='ml-4 pr-5 overflow-auto custom-scrollbar w-full mb-4'>
        {loading ? (
          <div className='w-full h-full flex items-center justify-center'>
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <>
            {activeSection === null ? (
              <div className='!overflow-auto !h-full custom-scrollbar'>
                <h1 className="text-left m-4 text-4xl font-bold text-zinc-600">Academic Work</h1>
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
                <Filters activeFilters={activeFilters} onFilterChange={setActiveFilters} filters={filters}></Filters>
                {searchedSections.map((section) => (
                  <WorkSection onClick={handleManageClick} key={section.data_section_id} id={section.data_section_id} title={section.title} category={section.data_type}></WorkSection>
                ))}
              </div>
            ) : (
              <div className='!overflow-auto !h-full custom-scrollbar'>
                {activeSection.title === 'Publications' && 
                  <PublicationsSection user={userInfo} section={activeSection} onBack={handleBack}></PublicationsSection>
                }
                {activeSection.title === 'Patents' && 
                  <PatentsSection user={userInfo} section={activeSection} onBack={handleBack}></PatentsSection>
                }
                {activeSection.title === 'Secure Funding' && 
                  <SecureFundingSection user={userInfo} section={activeSection} onBack={handleBack}></SecureFundingSection>
                }
                {activeSection.title === 'Courses Taught' && 
                  <CoursesTaughtSection user={userInfo} section={activeSection} onBack={handleBack}></CoursesTaughtSection>
                } 
                {activeSection.title !== 'Publications' && activeSection.title !== 'Patents' && activeSection.title !== 'Courses Taught' && activeSection.title !== 'Secure Funding' &&
                  <GenericSection user={userInfo} section={activeSection} onBack={handleBack}></GenericSection>
                }
              </div>
            )}
          </>
        )}
      </main>
    </PageContainer>
  );    
};

export default AcademicWork;
