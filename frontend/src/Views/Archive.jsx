import React, { useEffect, useState } from "react";
import PageContainer from "./PageContainer";
import FacultyMenu from "../Components/FacultyMenu";
import { rankFields } from '../utils/rankingUtils';
import GenericEntry from "../Components/GenericEntry";

const archived = [
    {
      "data_section_id": "DS001",
      "title": "Previous Education",
      "description": "Details of the faculty member's previous education",
      "data_type": "Education",
      "attributes": {
        "university_id": "U001",
        "faculty_member_id": "F001",
        "university_name": "University A",
        "degree": "BSc Computer Science",
        "subject_area": "Computer Science",
        "dates": "2000-2004"
      }
    },
    {
      "data_section_id": "DS001",
      "title": "Previous Education",
      "description": "Details of the faculty member's previous education",
      "data_type": "Education",
      "attributes": {
        "university_id": "U002",
        "faculty_member_id": "F002",
        "university_name": "University B",
        "degree": "BA Economics",
        "subject_area": "Economics",
        "dates": "2001-2005"
      }
    },
    {
      "data_section_id": "DS002",
      "title": "Continuing Education",
      "description": "Details of the faculty member's continuing education",
      "data_type": "Education",
      "attributes": {
        "university_id": "C001",
        "faculty_member_id": "F001",
        "university_name": "University A",
        "rank": "Senior Lecturer",
        "dates": "2006-2010"
      }
    },
    {
      "data_section_id": "DS002",
      "title": "Continuing Education",
      "description": "Details of the faculty member's continuing education",
      "data_type": "Education",
      "attributes": {
        "university_id": "C002",
        "faculty_member_id": "F002",
        "university_name": "University B",
        "rank": "Assistant Professor",
        "dates": "2011-2015"
      }
    },
    {
      "data_section_id": "DS003",
      "title": "Continuing Medical Education",
      "description": "Details of the faculty member's continuing medical education",
      "data_type": "Education",
      "attributes": {
        "university_id": "M001",
        "faculty_member_id": "F001",
        "university_name": "Medical University A",
        "type": "CME",
        "detail": "Cardiology",
        "dates": "2005-2006"
      }
    },
    {
      "data_section_id": "DS003",
      "title": "Continuing Medical Education",
      "description": "Details of the faculty member's continuing medical education",
      "data_type": "Education",
      "attributes": {
        "university_id": "M002",
        "faculty_member_id": "F002",
        "university_name": "Medical University B",
        "type": "CME",
        "detail": "Neurology",
        "dates": "2007-2008"
      }
    },
    {
      "data_section_id": "DS004",
      "title": "Dissertations",
      "description": "Details of the faculty member's dissertations",
      "data_type": "Research",
      "attributes": {
        "dissertation_id": "D001",
        "faculty_member_id": "F001",
        "title": "A Study on Machine Learning Algorithms",
        "supervisor": "Dr. Smith"
      }
    },
    {
      "data_section_id": "DS004",
      "title": "Dissertations",
      "description": "Details of the faculty member's dissertations",
      "data_type": "Research",
      "attributes": {
        "dissertation_id": "D002",
        "faculty_member_id": "F002",
        "title": "Economic Impacts of Globalization",
        "supervisor": "Dr. Johnson"
      }
    },
    {
      "data_section_id": "DS005",
      "title": "Qualifications",
      "description": "Details of the faculty member's qualifications",
      "data_type": "Professional",
      "attributes": {
        "qualification_id": "Q001",
        "faculty_member_id": "F001",
        "details": "Certified Data Scientist"
      }
    },
    {
      "data_section_id": "DS005",
      "title": "Qualifications",
      "description": "Details of the faculty member's qualifications",
      "data_type": "Professional",
      "attributes": {
        "qualification_id": "Q002",
        "faculty_member_id": "F002",
        "details": "Certified Financial Analyst"
      }
    },
    {
      "data_section_id": "DS006",
      "title": "Courses Taught",
      "description": "Details of the courses taught by the faculty member",
      "data_type": "Teaching",
      "attributes": {
        "course_id": "CT001",
        "faculty_member_id": "F001",
        "course_name": "Introduction to Computer Science",
        "description": "Basics of Computer Science",
        "class_size": 100,
        "lecture_hours_taught": 30,
        "tutorial_hours_taught": 15,
        "lab_hours_taught": 10,
        "other_hours_taught": 5,
        "role": "Lecturer",
        "dates": "2020-2021"
      }
    },
    {
      "data_section_id": "DS006",
      "title": "Courses Taught",
      "description": "Details of the courses taught by the faculty member",
      "data_type": "Teaching",
      "attributes": {
        "course_id": "CT002",
        "faculty_member_id": "F002",
        "course_name": "Advanced Economics",
        "description": "In-depth study of economic theories",
        "class_size": 80,
        "lecture_hours_taught": 40,
        "tutorial_hours_taught": 10,
        "lab_hours_taught": 0,
        "other_hours_taught": 5,
        "role": "Professor",
        "dates": "2019-2020"
      }
    },
    {
      "data_section_id": "DS007",
      "title": "Students Supervised",
      "description": "Details of the students supervised by the faculty member",
      "data_type": "Mentorship",
      "attributes": {
        "student_supervised_id": "SS001",
        "faculty_member_id": "F001",
        "student_name": "John Doe",
        "program": "PhD",
        "degree": "Computer Science",
        "description": "Research on AI",
        "role": "Supervisor",
        "dates": "2018-2021"
      }
    },
    {
      "data_section_id": "DS007",
      "title": "Students Supervised",
      "description": "Details of the students supervised by the faculty member",
      "data_type": "Mentorship",
      "attributes": {
        "student_supervised_id": "SS002",
        "faculty_member_id": "F002",
        "student_name": "Jane Smith",
        "program": "Masters",
        "degree": "Economics",
        "description": "Research on market trends",
        "role": "Advisor",
        "dates": "2017-2019"
      }
    },
    {
      "data_section_id": "DS008",
      "title": "Current Employment Records",
      "description": "Details of the faculty member's current employment",
      "data_type": "Employment",
      "attributes": {
        "employment_record_id": "ECR001",
        "faculty_member_id": "F001",
        "company": "Tech Corp",
        "rank_or_title": "Senior Developer",
        "dates": "2020-Present"
      }
    },
    {
      "data_section_id": "DS008",
      "title": "Current Employment Records",
      "description": "Details of the faculty member's current employment",
      "data_type": "Employment",
      "attributes": {
        "employment_record_id": "ECR002",
        "faculty_member_id": "F002",
        "company": "Finance Inc.",
        "rank_or_title": "Chief Economist",
        "dates": "2018-Present"
      }
    },
    {
      "data_section_id": "DS009",
      "title": "Previous Employment Records",
      "description": "Details of the faculty member's previous employment",
      "data_type": "Employment",
      "attributes": {
        "employment_record_id": "PER001",
        "faculty_member_id": "F001",
        "company": "Software Solutions",
        "rank_or_title": "Developer",
        "dates": "2015-2020"
      }
    },
    {
      "data_section_id": "DS009",
      "title": "Previous Employment Records",
      "description": "Details of the faculty member's previous employment",
      "data_type": "Employment",
      "attributes": {
        "employment_record_id": "PER002",
        "faculty_member_id": "F002",
        "company": "Economics Ltd.",
        "rank_or_title": "Analyst",
        "dates": "2013-2018"
      }
    },
    {
      "data_section_id": "DS010",
      "title": "Absence",
      "description": "Details of the faculty member's absences",
      "data_type": "Employment",
      "attributes": {
        "employment_record_id": "A001",
        "faculty_member_id": "F001",
        "company": "Tech Corp",
        "type": "Sabbatical",
        "dates": "2023"
      }
    },
    {
      "data_section_id": "DS010",
      "title": "Absence",
      "description": "Details of the faculty member's absences",
      "data_type": "Employment",
      "attributes": {
        "employment_record_id": "A002",
        "faculty_member_id": "F002",
        "company": "Finance Inc.",
        "type": "Medical Leave",
        "dates": "2022"
      }
    },
    {
      "data_section_id": "DS011",
      "title": "Service",
      "description": "Details of the faculty member's service",
      "data_type": "Service",
      "attributes": {
        "service_id": "S001",
        "faculty_member_id": "F001",
        "service_type": "Committee",
        "service_title": "Tech Committee",
        "dates": "2020-2021"
      }
    },
    {
      "data_section_id": "DS011",
      "title": "Service",
      "description": "Details of the faculty member's service",
      "data_type": "Service",
      "attributes": {
        "service_id": "S002",
        "faculty_member_id": "F002",
        "service_type": "Board",
        "service_title": "Finance Board",
        "dates": "2019-2020"
      }
    },
    {
      "data_section_id": "DS012",
      "title": "Awards",
      "description": "Details of the awards received by the faculty member",
      "data_type": "Accolades",
      "attributes": {
        "award_id": "A001",
        "faculty_member_id": "F001",
        "award_name": "Best Researcher",
        "award_duration": "2021"
      }
    },
    {
      "data_section_id": "DS012",
      "title": "Awards",
      "description": "Details of the awards received by the faculty member",
      "data_type": "Accolades",
      "attributes": {
        "award_id": "A002",
        "faculty_member_id": "F002",
        "award_name": "Outstanding Analyst",
        "award_duration": "2020"
      }
    },
    {
      "data_section_id": "DS013",
      "title": "Presentations",
      "description": "Details of the presentations given by the faculty member",
      "data_type": "Research",
      "attributes": {
        "presentation_id": "P001",
        "faculty_member_id": "F001",
        "title": "AI in Modern Tech",
        "venue": "Tech Conference 2021",
        "dates": "2021"
      }
    },
    {
      "data_section_id": "DS013",
      "title": "Presentations",
      "description": "Details of the presentations given by the faculty member",
      "data_type": "Research",
      "attributes": {
        "presentation_id": "P002",
        "faculty_member_id": "F002",
        "title": "Economic Forecasting",
        "venue": "Economics Symposium 2020",
        "dates": "2020"
      }
    },
    {
      "data_section_id": "DS014",
      "title": "Participations",
      "description": "Details of the participations by the faculty member",
      "data_type": "Professional",
      "attributes": {
        "participation_id": "PA001",
        "faculty_member_id": "F001",
        "title": "Economic Conference",
        "role": "Speaker",
        "venue": "Economics Hall",
        "dates": "2022"
      }
    },
    {
      "data_section_id": "DS014",
      "title": "Participations",
      "description": "Details of the participations by the faculty member",
      "data_type": "Professional",
      "attributes": {
        "participation_id": "PA002",
        "faculty_member_id": "F002",
        "title": "Tech Expo",
        "role": "Panelist",
        "venue": "Tech Center",
        "dates": "2021"
      }
    },
    {
      "data_section_id": "DS016",
      "title": "Publications",
      "description": "Details of the publications by the faculty member",
      "data_type": "Research",
      "attributes": {
        "publication_id": "PUB001",
        "publication_type": "Journal Article",
        "publication_title": "Advancements in AI",
        "scopus_ids": "123456",
        "publisher": "Tech Journal",
        "publication_year": 2021,
        "keywords": "AI, Machine Learning",
        "journal": "Tech Journal",
        "link": "http://techjournal.com/ai",
        "doi": "10.1234/techjournal.ai2021",
        "num_citations": 10
      }
    },
    {
      "data_section_id": "DS016",
      "title": "Publications",
      "description": "Details of the publications by the faculty member",
      "data_type": "Research",
      "attributes": {
        "publication_id": "PUB002",
        "publication_type": "Conference Paper",
        "publication_title": "The Future of AI",
        "scopus_ids": "654321",
        "publisher": "AI Conference",
        "publication_year": 2020,
        "keywords": "AI, Future",
        "journal": "AI Conference Proceedings",
        "link": "http://aiconference.com/future",
        "doi": "10.1234/aiconference.future2020",
        "num_citations": 5
      }
    },
    {
      "data_section_id": "DS017",
      "title": "Grants",
      "description": "Details of the grants received by the faculty member",
      "data_type": "Research",
      "attributes": {
        "grant_id": "G001",
        "keywords": "AI, Technology",
        "agency": "National Science Foundation",
        "department": "Computer Science",
        "grant_program": "AI Research Grant",
        "project_title": "AI for Healthcare",
        "amount": 500000,
        "name": "John Doe",
        "dates": "2020-2023",
        "faculty_member_id": "F001"
      }
    },
    {
      "data_section_id": "DS017",
      "title": "Grants",
      "description": "Details of the grants received by the faculty member",
      "data_type": "Research",
      "attributes": {
        "grant_id": "G002",
        "keywords": "Economics, Globalization",
        "agency": "Economic Research Council",
        "department": "Economics",
        "grant_program": "Globalization Impact Study",
        "project_title": "Globalization and Economy",
        "amount": 300000,
        "name": "Jane Smith",
        "dates": "2019-2022",
        "faculty_member_id": "F002"
      }
    },
    {
      "data_section_id": "DS018",
      "title": "Patents",
      "description": "Details of the patents held by the faculty member",
      "data_type": "Research",
      "attributes": {
        "patent_id": "PT001",
        "patent_number": "US1234567",
        "patent_country_code": "US",
        "patent_kind_code": "A1",
        "patent_title": "AI-Based Diagnostic Tool",
        "patent_inventors": "John Doe",
        "patent_family_number": "FAM1234",
        "patent_classification": "G06F",
        "patent_publication_date": "2021-01-01",
        "faculty_member_id": "F001"
      }
    },
    {
      "data_section_id": "DS018",
      "title": "Patents",
      "description": "Details of the patents held by the faculty member",
      "data_type": "Research",
      "attributes": {
        "patent_id": "PT002",
        "patent_number": "US7654321",
        "patent_country_code": "US",
        "patent_kind_code": "B2",
        "patent_title": "Economic Analysis Software",
        "patent_inventors": "Jane Smith",
        "patent_family_number": "FAM4321",
        "patent_classification": "G06Q",
        "patent_publication_date": "2020-05-15",
        "faculty_member_id": "F002"
      }
    }
  ]

  // "data_section_id": "DS001",
  // "title": "Previous Education",
  // "description": "Details of the faculty member's previous education",
  // "data_type": "Education",
  // "attributes": {
  //   "university_id": "U001",
  //   "faculty_member_id": "F001",
  //   "university_name": "University A",
  //   "degree": "BSc Computer Science",
  //   "subject_area": "Computer Science",
  //   "dates": "2000-2004"
  // }

const Archive = ({ userInfo, getCognitoUser }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredEntries, setFilteredEntries] = useState([]);

    useEffect(() => {  
      const filtered = archived.filter(entry => {
        const { title, description, attributes } = entry;
        const [fieldA, fieldB] = rankFields(attributes);
  
        const searchTermLower = searchTerm.toLowerCase();

        console.log(searchTermLower);
  
        return (
          title.toLowerCase().includes(searchTermLower) ||
          description.toLowerCase().includes(searchTermLower) ||
          (fieldA && fieldA.toLowerCase().includes(searchTermLower)) ||
          (fieldB && fieldB.toLowerCase().includes(searchTermLower))
        );
      });
  
      setFilteredEntries(filtered);
    }, [searchTerm, userInfo]);


    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleRestore = (entry) => {
        // Implement restore functionality here
        console.log('Restoring entry ' + entry.data_section_id);
    };

    const handleDelete = (entry) => { 
        // Implement delete functionality here
        console.log('Deleting entry ' + entry.data_section_id);
    };

    return (
        <PageContainer>
            <FacultyMenu userName={userInfo.preferred_name || userInfo.first_name} getCognitoUser={getCognitoUser} />
                <main className='flex-1 !overflow-auto !h-full custom-scrollbar'>
                    <h1 className="text-left ml-4 mt-4 text-4xl font-bold text-zinc-600">Archive</h1>
                    <div className='m-4 max-w-3xl flex'>
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

                  {filteredEntries.map((entry, index) => {

                    const [fieldA, fieldB] = rankFields(entry.attributes);

                    
                    return(
                      <GenericEntry 
                        key={index} 
                        isArchived={true}
                        field1={entry.title}
                        field2={fieldA}
                        field3={fieldB}
                        onRestore={() => handleRestore(entry)}
                        onDelete={() => handleDelete(entry)}
                      ></GenericEntry>
                    )
                    
                  })}

                </main>
        </PageContainer>
    )
}

export default Archive;