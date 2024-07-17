import React, { useState, useEffect } from 'react';
import GenericEntry from './GenericEntry';
import EntryModal from './EntryModal';
import { rankFields } from '../utils/rankingUtils';


  const generateEmptyEntry = (attributes) => {
    const emptyEntry = {};
    for (const key of Object.keys(attributes)) {
      emptyEntry[key] = '';
    }
    return emptyEntry;
  };

const GenericSection = ({ section }) => {

    const mockData = {
        DS001: [
          {
            university_id: 'U001',
            faculty_member_id: 'F001',
            university_name: 'University A',
            degree: 'BSc Computer Science',
            subject_area: 'Computer Science',
            dates: '2000-2004',
          },
          {
            university_id: 'U002',
            faculty_member_id: 'F002',
            university_name: 'University B',
            degree: 'BA Economics',
            subject_area: 'Economics',
            dates: '2001-2005',
          },
        ],
        DS002: [
          {
            university_id: 'C001',
            faculty_member_id: 'F001',
            university_name: 'University A',
            rank: 'Senior Lecturer',
            dates: '2006-2010',
          },
          {
            university_id: 'C002',
            faculty_member_id: 'F002',
            university_name: 'University B',
            rank: 'Assistant Professor',
            dates: '2011-2015',
          },
        ],
        DS003: [
          {
            university_id: 'M001',
            faculty_member_id: 'F001',
            university_name: 'Medical University A',
            type: 'CME',
            detail: 'Cardiology',
            dates: '2005-2006',
          },
          {
            university_id: 'M002',
            faculty_member_id: 'F002',
            university_name: 'Medical University B',
            type: 'CME',
            detail: 'Neurology',
            dates: '2007-2008',
          },
        ],
        DS004: [
          {
            dissertation_id: 'D001',
            faculty_member_id: 'F001',
            title: 'A Study on Machine Learning Algorithms',
            supervisor: 'Dr. Smith',
          },
          {
            dissertation_id: 'D002',
            faculty_member_id: 'F002',
            title: 'Economic Impacts of Globalization',
            supervisor: 'Dr. Johnson',
          },
        ],
        DS005: [
          {
            qualification_id: 'Q001',
            faculty_member_id: 'F001',
            details: 'Certified Data Scientist',
          },
          {
            qualification_id: 'Q002',
            faculty_member_id: 'F002',
            details: 'Certified Financial Analyst',
          },
        ],
        DS006: [
          {
            course_id: 'CT001',
            faculty_member_id: 'F001',
            course_name: 'Introduction to Computer Science',
            description: 'Basics of Computer Science',
            class_size: 100,
            lecture_hours_taught: 30,
            tutorial_hours_taught: 15,
            lab_hours_taught: 10,
            other_hours_taught: 5,
            role: 'Lecturer',
            dates: '2020-2021',
          },
          {
            course_id: 'CT002',
            faculty_member_id: 'F002',
            course_name: 'Advanced Economics',
            description: 'In-depth study of economic theories',
            class_size: 80,
            lecture_hours_taught: 40,
            tutorial_hours_taught: 10,
            lab_hours_taught: 0,
            other_hours_taught: 5,
            role: 'Professor',
            dates: '2019-2020',
          },
        ],
        DS007: [
          {
            student_supervised_id: 'SS001',
            faculty_member_id: 'F001',
            student_name: 'John Doe',
            program: 'PhD',
            degree: 'Computer Science',
            description: 'Research on AI',
            role: 'Supervisor',
            dates: '2018-2021',
          },
          {
            student_supervised_id: 'SS002',
            faculty_member_id: 'F002',
            student_name: 'Jane Smith',
            program: 'Masters',
            degree: 'Economics',
            description: 'Research on market trends',
            role: 'Advisor',
            dates: '2017-2019',
          },
        ],
        DS008: [
          {
            employment_record_id: 'ECR001',
            faculty_member_id: 'F001',
            company: 'Tech Corp',
            rank_or_title: 'Senior Developer',
            dates: '2020-Present',
          },
          {
            employment_record_id: 'ECR002',
            faculty_member_id: 'F002',
            company: 'Finance Inc.',
            rank_or_title: 'Chief Economist',
            dates: '2018-Present',
          },
        ],
        DS009: [
          {
            employment_record_id: 'PER001',
            faculty_member_id: 'F001',
            company: 'Software Solutions',
            rank_or_title: 'Developer',
            dates: '2015-2020',
          },
          {
            employment_record_id: 'PER002',
            faculty_member_id: 'F002',
            company: 'Economics Ltd.',
            rank_or_title: 'Analyst',
            dates: '2013-2018',
          },
        ],
        DS010: [
          {
            employment_record_id: 'A001',
            faculty_member_id: 'F001',
            company: 'Tech Corp',
            type: 'Sabbatical',
            dates: '2023',
          },
          {
            employment_record_id: 'A002',
            faculty_member_id: 'F002',
            company: 'Finance Inc.',
            type: 'Medical Leave',
            dates: '2022',
          },
        ],
        DS011: [
          {
            service_id: 'S001',
            faculty_member_id: 'F001',
            service_type: 'Committee',
            service_title: 'Tech Committee',
            dates: '2020-2021',
          },
          {
            service_id: 'S002',
            faculty_member_id: 'F002',
            service_type: 'Board',
            service_title: 'Finance Board',
            dates: '2019-2020',
          },
        ],
        DS012: [
          {
            award_id: 'A001',
            faculty_member_id: 'F001',
            award_name: 'Best Researcher',
            award_duration: '2021',
          },
          {
            award_id: 'A002',
            faculty_member_id: 'F002',
            award_name: 'Outstanding Analyst',
            award_duration: '2020',
          },
        ],
        DS013: [
          {
            presentation_id: 'P001',
            faculty_member_id: 'F001',
            title: 'AI in Modern Tech',
            venue: 'Tech Conference 2021',
            dates: '2021',
          },
          {
            presentation_id: 'P002',
            faculty_member_id: 'F002',
            title: 'Economic Forecasting',
            venue: 'Economics Symposium 2020',
            dates: '2020',
          },
        ],
        DS014: [
          {
            participation_id: 'PA001',
            faculty_member_id: 'F001',
            title: 'Economic Conference',
            role: 'Speaker',
            venue: 'Economics Hall',
            dates: '2022',
          },
          {
            participation_id: 'PA002',
            faculty_member_id: 'F002',
            title: 'Tech Expo',
            role: 'Panelist',
            venue: 'Tech Center',
            dates: '2021',
          },
        ],
        DS016: [
          {
            publication_id: 'PUB001',
            publication_type: 'Journal Article',
            publication_title: 'Advancements in AI',
            scopus_ids: '123456',
            publisher: 'Tech Journal',
            publication_year: 2021,
            keywords: 'AI, Machine Learning',
            journal: 'Tech Journal',
            link: 'http://techjournal.com/ai',
            doi: '10.1234/techjournal.ai2021',
            num_citations: 10,
          },
          {
            publication_id: 'PUB002',
            publication_type: 'Conference Paper',
            publication_title: 'The Future of AI',
            scopus_ids: '654321',
            publisher: 'AI Conference',
            publication_year: 2020,
            keywords: 'AI, Future',
            journal: 'AI Conference Proceedings',
            link: 'http://aiconference.com/future',
            doi: '10.1234/aiconference.future2020',
            num_citations: 5,
          },
        ],
        DS017: [
          {
            grant_id: 'G001',
            keywords: 'AI, Technology',
            agency: 'National Science Foundation',
            department: 'Computer Science',
            grant_program: 'AI Research Grant',
            project_title: 'AI for Healthcare',
            amount: 500000,
            name: 'John Doe',
            dates: '2020-2023',
            faculty_member_id: 'F001',
          },
          {
            grant_id: 'G002',
            keywords: 'Economics, Globalization',
            agency: 'Economic Research Council',
            department: 'Economics',
            grant_program: 'Globalization Impact Study',
            project_title: 'Globalization and Economy',
            amount: 300000,
            name: 'Jane Smith',
            dates: '2019-2022',
            faculty_member_id: 'F002',
          },
        ],
        DS018: [
          {
            patent_id: 'PT001',
            patent_number: 'US1234567',
            patent_country_code: 'US',
            patent_kind_code: 'A1',
            patent_title: 'AI-Based Diagnostic Tool',
            patent_inventors: 'John Doe',
            patent_family_number: 'FAM1234',
            patent_classification: 'G06F',
            patent_publication_date: '2021-01-01',
            faculty_member_id: 'F001',
          },
          {
            patent_id: 'PT002',
            patent_number: 'US7654321',
            patent_country_code: 'US',
            patent_kind_code: 'B2',
            patent_title: 'Economic Analysis Software',
            patent_inventors: 'Jane Smith',
            patent_family_number: 'FAM4321',
            patent_classification: 'G06Q',
            patent_publication_date: '2020-05-15',
            faculty_member_id: 'F002',
          },
        ],
      };

    
    const [searchTerm, setSearchTerm] = useState('');

    const [fieldData, setFieldData] = useState([]);
    const [entryData, setEntryData] = useState([]);

    const [selectedEntry, setSelectedEntry] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isNew, setIsNew] = useState(false);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleArchive = (entry) => {
      console.log("archived entry " + entry.title);
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
        const filteredData = mockData[section.data_section_id]?.filter(entry => {
        const [field1, field2] = rankFields(entry);
        return (
            (field1 && field1.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (field2 && field2.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        }) || [];

        const rankedData = filteredData.map(entry => {
          const [field1, field2] = rankFields(entry);
        
          return { ...entry, field1, field2 };
        });

        const entryFields = filteredData.map(entry => {

        return { ...entry };
        });

        setEntryData(entryFields);

        setFieldData(rankedData);

        console.log("field data " + JSON.stringify(fieldData));
        console.log("entry data " + JSON.stringify(entryData));
        
    }, [searchTerm, section.data_section_id]);

    return (
        <div>
        <div className='m-4 max-w-lg flex'>
            <h2 className="text-left text-4xl font-bold text-zinc-600">{section.title}</h2>
            <button onClick={handleNew} className='ml-auto text-white btn btn-success min-h-0 h-8 leading-tight'>new</button>
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
    );
};

export default GenericSection;