import React, { useState, useEffect } from 'react';
import PageContainer from './PageContainer.jsx';
import FacultyMenu from '../Components/FacultyMenu';
import { Container, Section, Bar } from '@column-resizer/react';
import WorkSection from '../Components/WorkSection';
import '../CustomStyles/scrollbar.css';
import Filters from '../Components/Filters.jsx';
import Publications from '../Components/Publications';

const sectionsMockObject = [
  { section: 'Publications', category: '' },
  { section: 'Grants', category: '' },
  { section: 'Patents', category: '' },
  { section: 'Awards', category: 'Accolades' },
  { section: 'Primary Education', category: 'Education' },
  { section: 'Courses', category: 'Teaching' },
  { section: 'Service', category: '' }
];

const AcademicWork = ({ userInfo, getCognitoUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [user, setUser] = useState(userInfo);

  useEffect(() => {
    setUser(userInfo);
  }, [userInfo]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const searchedSections = sectionsMockObject.filter(entry => {
    const section = entry.section || '';
    const category = entry.category || '';

    const matchesSearch = section.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
      category.toLowerCase().startsWith(searchTerm.toLowerCase());

    const matchesFilter = activeFilters.length === 0 || !activeFilters.includes(category);

    return matchesSearch && matchesFilter;
  });

  return (
    <PageContainer>
      <FacultyMenu userName={user.preferred_name || user.first_name} getCognitoUser={getCognitoUser}></FacultyMenu>
      <main className='flex-1 h-full'>
        <Container className='w-full h-full'>
          <Section minSize={330} className='!overflow-auto !h-full custom-scrollbar'>
            <h1 className="text-left m-4 text-4xl font-bold text-zinc-600">Academic Work</h1>
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
            <Filters activeFilters={activeFilters} onFilterChange={setActiveFilters}></Filters>
            {searchedSections.map((section) => (
              <WorkSection key={section.section} title={section.section} category={section.category}></WorkSection>
            ))}
          </Section>
          <Bar size={4} className='bg-neutral h-screen' style={{ cursor: 'col-resize' }} />
          <Section minSize={240} className='!overflow-auto !h-full custom-scrollbar'>
            <Publications></Publications>
          </Section>
        </Container>
      </main>
    </PageContainer>
  );
};

export default AcademicWork;


