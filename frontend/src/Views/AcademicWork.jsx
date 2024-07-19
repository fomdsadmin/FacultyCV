import React, { useState, useEffect } from 'react';
import PageContainer from './PageContainer.jsx';
import FacultyMenu from '../Components/FacultyMenu';
import { Container, Section, Bar } from '@column-resizer/react';
import WorkSection from '../Components/WorkSection';
import '../CustomStyles/scrollbar.css';
import Filters from '../Components/Filters.jsx';
import Publications from '../Components/Publications';
import GenericSection from '../Components/GenericSection.jsx';
import { getAllSections } from '../graphql/graphqlHelpers.js';

// const dataSections = [
//   {
//     data_section_id: 'DS016',
//     title: 'Publications',
//     description: 'Details of the publications by the faculty member',
//     data_type: 'Research',
//     attributes: {
//       publication_id: 'varchar',
//       publication_type: 'varchar',
//       publication_title: 'varchar',
//       scopus_ids: 'varchar',
//       publisher: 'varchar',
//       publication_year: 'int',
//       keywords: 'varchar',
//       journal: 'varchar',
//       link: 'varchar',
//       doi: 'varchar',
//       num_citations: 'int',
//     },
//   },
//   {
//     data_section_id: 'DS001',
//     title: 'Previous Education',
//     description: 'Details of the faculty member\'s previous education',
//     data_type: 'Education',
//     attributes: {
//       faculty_member_id: 'varchar',
//       university_name: 'varchar',
//       degree: 'varchar',
//       subject_area: 'varchar',
//       dates: 'varchar',
//     },
//   },
//   {
//     data_section_id: 'DS002',
//     title: 'Continuing Education',
//     description: 'Details of the faculty member\'s continuing education',
//     data_type: 'Education',
//     attributes: {
//       faculty_member_id: 'varchar',
//       university_name: 'varchar',
//       rank: 'varchar',
//       dates: 'varchar',
//     },
//   },
//   {
//     data_section_id: 'DS003',
//     title: 'Continuing Medical Education',
//     description: 'Details of the faculty member\'s continuing medical education',
//     data_type: 'Education',
//     attributes: {
//       faculty_member_id: 'varchar',
//       university_name: 'varchar',
//       type: 'varchar',
//       detail: 'varchar',
//       dates: 'varchar',
//     },
//   },
//   {
//     data_section_id: 'DS004',
//     title: 'Dissertations',
//     description: 'Details of the faculty member\'s dissertations',
//     data_type: 'Research',
//     attributes: {
//       faculty_member_id: 'varchar',
//       title: 'varchar',
//       supervisor: 'varchar',
//     },
//   },
//   {
//     data_section_id: 'DS005',
//     title: 'Qualifications',
//     description: 'Details of the faculty member\'s qualifications',
//     data_type: 'Professional',
//     attributes: {
//       faculty_member_id: 'varchar',
//       details: 'varchar',
//     },
//   },
//   {
//     data_section_id: 'DS006',
//     title: 'Courses Taught',
//     description: 'Details of the courses taught by the faculty member',
//     data_type: 'Teaching',
//     attributes: {
//       faculty_member_id: 'varchar',
//       course_name: 'varchar',
//       description: 'varchar',
//       class_size: 'int',
//       lecture_hours_taught: 'int',
//       tutorial_hours_taught: 'int',
//       lab_hours_taught: 'int',
//       other_hours_taught: 'int',
//       role: 'varchar',
//       dates: 'varchar',
//     },
//   },
//   {
//     data_section_id: 'DS007',
//     title: 'Students Supervised',
//     description: 'Details of the students supervised by the faculty member',
//     data_type: 'Mentorship',
//     attributes: {
//       faculty_member_id: 'varchar',
//       student_name: 'varchar',
//       program: 'varchar',
//       degree: 'varchar',
//       description: 'varchar',
//       role: 'varchar',
//       dates: 'varchar',
//     },
//   },
//   {
//     data_section_id: 'DS008',
//     title: 'Current Employment Records',
//     description: 'Details of the faculty member\'s current employment',
//     data_type: 'Employment',
//     attributes: {
//       faculty_member_id: 'varchar',
//       company: 'varchar',
//       rank_or_title: 'varchar',
//       dates: 'varchar',
//     },
//   },
//   {
//     data_section_id: 'DS009',
//     title: 'Previous Employment Records',
//     description: 'Details of the faculty member\'s previous employment',
//     data_type: 'Employment',
//     attributes: {
//       faculty_member_id: 'varchar',
//       company: 'varchar',
//       rank_or_title: 'varchar',
//       dates: 'varchar',
//     },
//   },
//   {
//     data_section_id: 'DS010',
//     title: 'Absence',
//     description: 'Details of the faculty member\'s absences',
//     data_type: 'Employment',
//     attributes: {
//       faculty_member_id: 'varchar',
//       company: 'varchar',
//       type: 'varchar',
//       dates: 'varchar',
//     },
//   },
//   {
//     data_section_id: 'DS011',
//     title: 'Service',
//     description: 'Details of the faculty member\'s service',
//     data_type: 'Service',
//     attributes: {
//       faculty_member_id: 'varchar',
//       service_type: 'varchar',
//       service_title: 'varchar',
//       dates: 'varchar',
//     },
//   },
//   {
//     data_section_id: 'DS012',
//     title: 'Awards',
//     description: 'Details of the awards received by the faculty member',
//     data_type: 'Accolades',
//     attributes: {
//       faculty_member_id: 'varchar',
//       award_name: 'varchar',
//       award_duration: 'varchar',
//     },
//   },
//   {
//     data_section_id: 'DS013',
//     title: 'Presentations',
//     description: 'Details of the presentations given by the faculty member',
//     data_type: 'Research',
//     attributes: {
//       faculty_member_id: 'varchar',
//       title: 'varchar',
//       venue: 'varchar',
//       dates: 'varchar',
//     },
//   },
//   {
//     data_section_id: 'DS014',
//     title: 'Participations',
//     description: 'Details of the participations by the faculty member',
//     data_type: 'Professional',
//     attributes: {
//       faculty_member_id: 'varchar',
//       title: 'varchar',
//       role: 'varchar',
//       venue: 'varchar',
//       dates: 'varchar',
//     },
//   },
//   {
//     data_section_id: 'DS017',
//     title: 'Grants',
//     description: 'Details of the grants received by the faculty member',
//     data_type: 'Research',
//     attributes: {
//       grant_id: 'varchar',
//       keywords: 'varchar',
//       agency: 'varchar',
//       department: 'varchar',
//       grant_program: 'varchar',
//       project_title: 'varchar',
//       amount: 'int',
//       name: 'varchar',
//       dates: 'varchar',
//       faculty_member_id: 'varchar',
//     },
//   },
//   {
//     data_section_id: 'DS018',
//     title: 'Patents',
//     description: 'Details of the patents held by the faculty member',
//     data_type: 'Research',
//     attributes: {
//       patent_id: 'varchar',
//       patent_number: 'varchar',
//       patent_country_code: 'varchar',
//       patent_kind_code: 'varchar',
//       patent_title: 'varchar',
//       patent_inventors: 'varchar',
//       patent_family_number: 'varchar',
//       patent_classification: 'varchar',
//       patent_publication_date: 'varchar',
//       faculty_member_id: 'varchar',
//     },
//   },
// ];

const AcademicWork = ({ userInfo, getCognitoUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [user, setUser] = useState(userInfo);
  const [dataSections, setDataSections] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    setUser(userInfo);
    getDataSections();
  }, []);

  const getDataSections = async () => {
    const retrievedSections = await getAllSections();
  
    // Parse the attributes field from a JSON string to a JSON object
    const parsedSections = retrievedSections.map(section => ({
      ...section,
      attributes: JSON.parse(section.attributes),
    }));

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

  return (
    <PageContainer>
      <FacultyMenu userName={user.preferred_name || user.first_name} getCognitoUser={getCognitoUser}></FacultyMenu>
      <main className='flex-1 h-full'>
        {loading ? (
            <div className='flex items-center justify-center w-full'>
              <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
            </div>
          ) : (
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
              <Filters activeFilters={activeFilters} onFilterChange={setActiveFilters} filters={filters}></Filters>
              {searchedSections.map((section) => (
                <WorkSection onClick={handleManageClick} key={section.data_section_id} id={section.data_section_id} title={section.title} category={section.data_type}></WorkSection>
              ))}
            </Section>
            <Bar size={4} className='bg-neutral h-screen' style={{ cursor: 'col-resize' }} />
            <Section minSize={240} className='!overflow-auto !h-full custom-scrollbar'>
              {activeSection!=null && activeSection.title == 'Publications' && 
                <Publications></Publications>
              } 

              {activeSection!=null && activeSection.title != 'Publications' &&
                <GenericSection user = {user} section={activeSection}></GenericSection>
              }
            </Section>
          </Container>
        )}
      </main>
    </PageContainer>
  );
};

export default AcademicWork;


