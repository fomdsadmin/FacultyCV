import React, { useEffect, useState } from "react";
import AssistantMenu from "../Components/AssistantMenu";
import Assistant_FacultyMenu from "../Components/Assistant_FacultyMenu";
import { rankFields } from '../utils/rankingUtils';
import GenericEntry from "../SharedComponents/GenericEntry";
import { getArchivedUserCVData, getAllSections, updateUserCVDataArchive } from "../graphql/graphqlHelpers";
import PageContainer from "./PageContainer";

const Assistant_Archive = ({ assistantUserInfo, userInfo, getCognitoUser }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredEntries, setFilteredEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      setLoading(true);
      fetchArchivedUserCVData();
    }, [searchTerm, userInfo]);
    
    async function fetchArchivedUserCVData() {
      try {
        const retrievedData = await getArchivedUserCVData(userInfo.user_id);
    
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
    
        const filtered = matchedData.filter(entry => {
          
          const { title, description, attributes } = entry;
          const [fieldA, fieldB] = rankFields(attributes);
    
          const searchTermLower = searchTerm.toLowerCase();
    
          
    
          return (
            title.toLowerCase().includes(searchTermLower) ||
            description.toLowerCase().includes(searchTermLower) ||
            (fieldA && fieldA.toLowerCase().includes(searchTermLower)) ||
            (fieldB && fieldB.toLowerCase().includes(searchTermLower))
          );
        });
    
        setFilteredEntries(filtered);
      } catch (error) {
        console.error('Error fetching data:', error);
        setFilteredEntries([]); // Set filteredEntries to an empty array in case of error
      }
      setLoading(false);
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

    const handleRestore = async (entry) => {
        setLoading(true);
        // Implement restore functionality here
        try {
          const result = await updateUserCVDataArchive(entry.user_cv_data_id, false);
          
        }
        catch (error) {
          console.error('Error restoring entry:', error);
        }
        await fetchArchivedUserCVData();
        setLoading(false);
    };

    return (
      <div>
        <PageContainer>
          <Assistant_FacultyMenu userInfo={userInfo} assistantUserInfo={assistantUserInfo} />
          <main className='px-[2vw] md:px-[3vw] lg:px-[5vw] overflow-auto custom-scrollbar w-full mb-4'>
          <h1 className="text-left mt-4 text-4xl font-bold text-zinc-600">Archive</h1>
          {loading ? (
            <div className='flex items-center justify-center w-full'>
              <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
            </div>
          ) : (
            <>
              <div className='my-4 flex'>
                <label className="input input-bordered flex items-center gap-y-2 flex-1">
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
              {filteredEntries.length === 0 ? (
                <div className="text-center my-4 text-lg text-zinc-600">No archived entries</div>
              ) : (
                filteredEntries.map((entry, index) => {
                  const [fieldA, fieldB] = rankFields(entry.data_details);
                  return (
                    <GenericEntry
                      key={index}
                      isArchived={true}
                      field1={entry.title}
                      field2={fieldA}
                      field3={fieldB}
                      data_details={entry.data_details}
                      onRestore={() => handleRestore(entry)}
                    />
                  );
                })
              )}
            </>
          )}
        </main>
        </PageContainer>
      </div>
      
    )
}

export default Assistant_Archive;