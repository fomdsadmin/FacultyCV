import React, { useEffect, useState, useMemo } from "react";
import PageContainer from "./PageContainer";
import FacultyMenu from "../Components/FacultyMenu";
import { rankFields } from '../utils/rankingUtils';
import GenericEntry from "../SharedComponents/GenericEntry";
import { getUserCVData, getAllSections } from "../graphql/graphqlHelpers";
import { sortEntriesByDate } from "../utils/dateUtils";
import { sectionTitleSort } from "../utils/sectionUtils";

const CVSearch = ({ userInfo, getCognitoUser, toggleViewMode }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [allEntries, setAllEntries] = useState([]);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch all data on mount
  useEffect(() => {
    setLoading(true);
    fetchAllUserCVData();
  }, [userInfo]);

  // Pre-process all entries with searchable content (computed once)
  const entriesWithSearchContent = useMemo(() => {
    return allEntries.map((entry) => {
      const { data_details } = entry;
      
      // Pre-compute searchable string once
      const searchableContent = [
        JSON.stringify(data_details)
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      
      return {
        ...entry,
        searchableContent
      };
    });
  }, [allEntries]);

  // Memoize filtered entries based on search term
  const filteredEntriesMemo = useMemo(() => {
    if (!searchTerm.trim()) {
      return entriesWithSearchContent;
    }

    const searchTermLower = searchTerm.toLowerCase();
    return entriesWithSearchContent.filter((entry) => {
      return entry.searchableContent.includes(searchTermLower);
    });
  }, [searchTerm, entriesWithSearchContent]);

  // Memoize grouped and sorted entries
  const groupedEntriesMemo = useMemo(() => {
    const grouped = {};

    filteredEntriesMemo.forEach((entry) => {
      const sectionTitle = entry.title;
      if (!grouped[sectionTitle]) {
        grouped[sectionTitle] = [];
      }
      grouped[sectionTitle].push(entry);
    });

    // Sort sections by their titles
    const sortedGrouped = {};
    const sortedSectionTitles = Object.keys(grouped).sort((a, b) => sectionTitleSort({ title: a }, { title: b }));

    sortedSectionTitles.forEach((title) => {
      // Sort entries within each section by date (most recent first)
      const sortedEntries = sortEntriesByDate(grouped[title], false);
      sortedGrouped[title] = sortedEntries;
    });

    return sortedGrouped;
  }, [filteredEntriesMemo]);

  // Initialize collapsed state when grouped entries first load or sections change
  useEffect(() => {
    const sectionTitles = Object.keys(groupedEntriesMemo);
    if (sectionTitles.length > 0) {
      setCollapsedSections((prev) => {
        const newState = {};
        sectionTitles.forEach((title) => {
          // Preserve existing state if available, otherwise collapse by default
          newState[title] = prev[title] !== undefined ? prev[title] : true;
        });
        return newState;
      });
    }
  }, [groupedEntriesMemo]);

  const toggleSection = (sectionTitle) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  async function fetchAllUserCVData() {
    try {
      // Fetch all sections once and store them
      const retrievedSections = await getAllSections();
      
      const allSectionIds = retrievedSections.map((section) => section.data_section_id);

      // Get all user CV data for all sections
      const retrievedData = await getUserCVData(userInfo.user_id, allSectionIds);

      // Parse section attributes once (create lookup map for O(1) access)
      const sectionsMap = new Map(
        retrievedSections.map((section) => [
          section.data_section_id,
          {
            ...section,
            attributes: JSON.parse(section.attributes),
          },
        ])
      );

      // Single pass: parse data_details and match with sections
      const matchedData = retrievedData.map((data) => {
        const matchingSection = sectionsMap.get(data.data_section_id);
        return {
          ...data,
          data_details: JSON.parse(data.data_details),
          ...(matchingSection || {}),
        };
      });

      if (!Array.isArray(matchedData)) {
        throw new Error("Matched data is not an array");
      }

      setAllEntries(matchedData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setAllEntries([]);
    }
    setLoading(false);
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <PageContainer>
      <FacultyMenu
        userName={userInfo.preferred_name || userInfo.first_name}
        getCognitoUser={getCognitoUser}
        toggleViewMode={toggleViewMode}
        userInfo={userInfo}
      />
      <main className="mt-2 overflow-auto custom-scrollbar w-full mb-4">
        <div className="mb-4">
          <h1 className="text-left text-4xl font-bold text-zinc-600 mb-2 mt-1">Search Academic Records</h1>
          <p className="text-gray-500 text-sm">
            Use the search bar to find specific entries, or browse by section using the expandable groups below. Entries
            are sorted by descending start date within each section.
          </p>
          {!loading && (
            <div className="mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-blue-50 text-blue-700">
                Total Entries: {filteredEntriesMemo.length}
              </span>
            </div>
          )}
        </div>
        {loading ? (
          <div className="flex items-center justify-center w-full">
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <>
            <div className="my-4 flex">
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
            {Object.keys(groupedEntriesMemo).length === 0 ? (
              <div className="text-center m-4 text-lg text-zinc-600">
                {searchTerm ? "No matching entries found" : "No CV entries found"}
              </div>
            ) : (
              Object.entries(groupedEntriesMemo).map(([sectionTitle, entries]) => (
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
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        collapsedSections[sectionTitle] ? "rotate-180" : ""
                      }`}
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
  );
};

export default CVSearch;
