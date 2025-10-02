import React, { useEffect, useState } from "react";
import PageContainer from "./PageContainer";
import FacultyMenu from "../Components/FacultyMenu";
import { rankFields } from '../utils/rankingUtils';
import GenericEntry from "../SharedComponents/GenericEntry";
import { getUserCVData, getAllSections } from "../graphql/graphqlHelpers";
import { sortEntriesByDate } from "../utils/dateUtils";


function parseSectionTitle(title) {
  // Match: 8a., 8b.1., 8[f-i]., 8., etc.
  const match = title.match(/^(\d+)([a-z])?(?:\.([0-9]+))?(?:\[(.*?)\])?/i);
  let num = match ? parseInt(match[1], 10) : null;
  let letter = match && match[2] ? match[2] : "";
  let subnum = match && match[3] ? parseInt(match[3], 10) : null;
  let bracket = match && match[4] ? match[4] : "";

  // If bracket, get the start letter (e.g. 'f' from 'f-i')
  let letterIndex = "";
  if (bracket) {
    letterIndex = bracket.split("-")[0].trim();
  }

  return { num, letter, subnum, bracket, letterIndex, raw: title };
}

function sectionTitleSort(a, b) {
  const A = parseSectionTitle(a.title);
  const B = parseSectionTitle(b.title);

  // 1. Sort by number
  if (A.num !== null && B.num !== null) {
    if (A.num !== B.num) return A.num - B.num;

    // 2. If both have brackets, sort by start letter
    if (A.bracket && B.bracket) {
      return A.letterIndex.localeCompare(B.letterIndex);
    }

    // 3. If one has bracket and the other is a single letter
    if (A.bracket && B.letter) {
      const [start, end] = A.bracket.split("-").map((s) => s.trim());
      if (B.letter >= start && (!end || B.letter <= end)) return -1;
      return A.letterIndex.localeCompare(B.letter);
    }
    if (A.letter && B.bracket) {
      const [start, end] = B.bracket.split("-").map((s) => s.trim());
      if (A.letter >= start && (!end || A.letter <= end)) return 1;
      return A.letter.localeCompare(B.letterIndex);
    }

    // 4. If both are single letters, sort alphabetically
    if (A.letter && B.letter) {
      if (A.letter !== B.letter) return A.letter.localeCompare(B.letter);
    }

    // 5. Subnumber
    if ((A.subnum || 0) !== (B.subnum || 0)) return (A.subnum || 0) - (B.subnum || 0);
  }

  // 6. If one has a number and the other doesn't, number comes first
  if (A.num !== null && B.num === null) return -1;
  if (A.num === null && B.num !== null) return 1;

  // 7. Both don't have numbers, sort alphabetically
  return A.raw.localeCompare(B.raw, undefined, { sensitivity: "base" });
}

const CVSearch = ({ userInfo, getCognitoUser, toggleViewMode }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [allEntries, setAllEntries] = useState([]);
    const [filteredEntries, setFilteredEntries] = useState([]);
    const [groupedEntries, setGroupedEntries] = useState({});
    const [collapsedSections, setCollapsedSections] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      setLoading(true);
      fetchAllUserCVData();
    }, [userInfo]);
    
    useEffect(() => {
      // Filter entries whenever searchTerm changes
      filterEntries();
    }, [searchTerm, allEntries]);
    
    useEffect(() => {
      // Group and sort entries whenever filteredEntries changes
      groupAndSortEntries();
    }, [filteredEntries]);
    
    function groupAndSortEntries() {
      const grouped = {};
      
      filteredEntries.forEach(entry => {
        const sectionTitle = entry.title;
        if (!grouped[sectionTitle]) {
          grouped[sectionTitle] = [];
        }
        grouped[sectionTitle].push(entry);
      });
      
      // Sort sections by their titles
      const sortedGrouped = {};
      const sortedSectionTitles = Object.keys(grouped).sort((a, b) => 
        sectionTitleSort({ title: a }, { title: b })
      );
      
      sortedSectionTitles.forEach(title => {
        // Sort entries within each section by date (most recent first)
        const sortedEntries = sortEntriesByDate(grouped[title], false);
        sortedGrouped[title] = sortedEntries;
      });
      
      // Set up collapsed state: closed
      if (sortedSectionTitles.length > 0 && Object.keys(collapsedSections).length === 0) {
        const initialCollapsedState = {};
        sortedSectionTitles.forEach((title, index) => {
          initialCollapsedState[title] = true; // All sections collapsed by default
        });
        setCollapsedSections(initialCollapsedState);
      }
      
      setGroupedEntries(sortedGrouped);
    }
    
    const toggleSection = (sectionTitle) => {
      setCollapsedSections(prev => ({
        ...prev,
        [sectionTitle]: !prev[sectionTitle]
      }));
    };
    
    async function fetchAllUserCVData() {
      try {
        // First get all sections to get their IDs
        const allSections = await getAllSections();
        const allSectionIds = allSections.map(section => section.data_section_id);
        
        // Get all user CV data for all sections
        const retrievedData = await getUserCVData(userInfo.user_id, allSectionIds);
    
        // Parse the data_details field from a JSON string to a JSON object
        const parsedData = retrievedData.map(data => ({
          ...data,
          data_details: JSON.parse(data.data_details),
        }));
        
        // Match the data with their respective sections
        const matchedData = await fetchAndMatchSections(parsedData);
    
        if (!Array.isArray(matchedData)) {
          throw new Error('Matched data is not an array');
        }

        setAllEntries(matchedData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setAllEntries([]);
      }
      setLoading(false);
    }
    
    function filterEntries() {
      if (!searchTerm.trim()) {
        setFilteredEntries(allEntries);
        return;
      }

      const filtered = allEntries.filter(entry => {
        const { title, description, data_details } = entry;
        const [fieldA, fieldB] = rankFields(data_details);
        
        const searchTermLower = searchTerm.toLowerCase();
        
        // Search in section title, description, and the ranked fields from data_details
        return (
          title.toLowerCase().includes(searchTermLower) ||
          description.toLowerCase().includes(searchTermLower) ||
          (fieldA && fieldA.toLowerCase().includes(searchTermLower)) ||
          (fieldB && fieldB.toLowerCase().includes(searchTermLower)) ||
          // Also search within the raw data_details for more comprehensive search
          JSON.stringify(data_details).toLowerCase().includes(searchTermLower)
        );
      });
          
      setFilteredEntries(filtered);
    }
    
    async function fetchAndMatchSections(parsedData) {
      try {
        const retrievedSections = await getAllSections();
    
        // Parse the attributes field from a JSON string to a JSON object
        const parsedSections = retrievedSections.map(section => ({
          ...section,
          attributes: JSON.parse(section.attributes),
        }));
    
        // Add additional fields from parsedSections to parsedData if their data_section_ids match
        const updatedData = parsedData.map(data => {
          const matchingSection = parsedSections.find(
            section => section.data_section_id === data.data_section_id
          );
    
          if (matchingSection) {
            return {
              ...data,
              ...matchingSection,
            };
          }
    
          return data;
        });
    
        return updatedData;
      } catch (error) {
        console.error('Error fetching sections:', error);
        return []; // Return an empty array in case of error
      }
    }    

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    // const handleDelete = (entry) => { 
    //     // Implement delete functionality here
    //     
    // };

    return (
      <PageContainer>
        <FacultyMenu userName={userInfo.preferred_name || userInfo.first_name} getCognitoUser={getCognitoUser}
          toggleViewMode={toggleViewMode} userInfo={userInfo} />
        <main className='mt-2 overflow-auto custom-scrollbar w-full mb-4'>
          <div className="mb-4">
            <h1 className="text-left text-4xl font-bold text-zinc-600 mb-2">Search Academic Records</h1>
            <p className="text-gray-500 text-sm">
              Use the search bar to find specific entries, or browse by section using the expandable groups below. Entries are sorted by descending start date within each section.
            </p>
            {!loading && (
              <div className="mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-blue-50 text-blue-700">
                  Total Entries: {filteredEntries.length}
                </span>
              </div>
            )}
          </div>
          {loading ? (
            <div className='flex items-center justify-center w-full'>
              <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
            </div>
          ) : (
            <>
              <div className='my-4 flex'>
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
                      clipRule="evenodd"
                    />
                  </svg>
                </label>
              </div>  
              {Object.keys(groupedEntries).length === 0 ? (
                <div className="text-center m-4 text-lg text-zinc-600">
                  {searchTerm ? 'No matching entries found' : 'No CV entries found'}
                </div>
              ) : (
                Object.entries(groupedEntries).map(([sectionTitle, entries]) => (
                  <div key={sectionTitle} className="mb-6">
                    <div 
                      className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleSection(sectionTitle)}
                    >
                      <div className="flex items-center">
                        <h2 className="text-lg font-semibold text-zinc-700">{sectionTitle}</h2>
                        <span className="ml-3 bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                          {entries.length}
                        </span>
                      </div>
                      <svg 
                        className={`w-5 h-5 text-gray-500 transition-transform ${collapsedSections[sectionTitle] ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    
                    {!collapsedSections[sectionTitle] && (
                      <div className="mt-2 space-y-2">
                        {entries.map((entry, index) => {
                          const [fieldA, fieldB] = rankFields(entry.data_details);
                          return (
                            <GenericEntry
                              key={`${sectionTitle}-${index}`}
                              isArchived={false}
                              field1={fieldA}
                              field2={fieldB}
                              field3=""
                              data_details={entry.data_details}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </main>
      </PageContainer>
    )
}

export default CVSearch;