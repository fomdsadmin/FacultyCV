import React, { useState, useEffect, useMemo, useCallback } from "react";
import PageContainer from "./PageContainer.jsx";
import DepartmentAdminMenu from "../Components/DepartmentAdminMenu.jsx";
import AnalyticsCard from "../Components/AnalyticsCard.jsx";
import GraphCarousel from "../Components/GraphCarousel.jsx";
import {
  getAllUsersCount,
  getAllSections,
  getNumberOfGeneratedCVs,
  getDepartmentCVData
} from "../graphql/graphqlHelpers.js";

const DepartmentAdminHomePage = ({ getCognitoUser, userInfo, department }) => {
  const [loading, setLoading] = useState(false);
  const [userCounts, setUserCounts] = useState({
    total_count: 0,
    faculty_count: 0,
    assistant_count: 0,
    dept_admin_count: 0,
    admin_count: 0,
    faculty_admin_count: 0
  });
  const [publications, setPublications] = useState([]);
  const [grants, setGrants] = useState([]);
  const [patents, setPatents] = useState([]);
  const [grantMoneyRaised, setGrantMoneyRaised] = useState([]);
  const [totalCVsGenerated, setTotalCVsGenerated] = useState(0);
  const [keywordData, setKeywordData] = useState([]);
  const [showAllKeywords, setShowAllKeywords] = useState(false);

  // Consolidated data loading
  useEffect(() => {
    loadAllData();
  }, [department]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all basic data in parallel
      const [userCounts, dataSections, generatedCVs] = await Promise.all([
        department.trim() === "All" ? getAllUsersCount() : getAllUsersCount(department),
        getAllSections(),
        department.trim() === "All" ? getNumberOfGeneratedCVs() : getNumberOfGeneratedCVs(department)
      ]);

      setUserCounts(userCounts);
      setTotalCVsGenerated(generatedCVs);

      // Fetch CV data
      await fetchAllUserCVData(dataSections);

    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [department]);

  const fetchAllUserCVData = useCallback(async (dataSections) => {

    try {
      // Find section IDs
      const publicationSectionId = dataSections.find(
        (section) => section.title.includes("Publication") && !section.title.includes("Other")
      )?.data_section_id;
      const otherPublicationSectionId = dataSections.find(
        (section) => section.title.includes("Publication") && section.title.includes("Other")
      )?.data_section_id;
      const secureFundingSectionId = dataSections.find((section) =>
        section.title.includes("Research or Equivalent Grants and Contracts")
      )?.data_section_id;
      const patentSectionId = dataSections.find((section) => section.title.includes("Patent"))?.data_section_id;

      // Create promises for parallel execution using getDepartmentCVData
      const promises = [];
      
      if (publicationSectionId) {
        promises.push(
          getDepartmentCVData(publicationSectionId, department, "Publication")
            .then(response => ({ type: 'publication', data: response.data }))
            .catch(() => ({ type: 'publication', data: [] }))
        );
      }
      
      if (otherPublicationSectionId) {
        promises.push(
          getDepartmentCVData(otherPublicationSectionId, department, "Other Publication")
            .then(response => ({ type: 'otherPublication', data: response.data }))
            .catch(() => ({ type: 'otherPublication', data: [] }))
        );
      }
      
      if (secureFundingSectionId) {
        promises.push(
          getDepartmentCVData(secureFundingSectionId, department, "Grant")
            .then(response => ({ type: 'grant', data: response.data }))
            .catch(() => ({ type: 'grant', data: [] }))
        );
      }
      
      if (patentSectionId) {
        promises.push(
          getDepartmentCVData(patentSectionId, department, "Patent")
            .then(response => ({ type: 'patent', data: response.data }))
            .catch(() => ({ type: 'patent', data: [] }))
        );
      }

      // Execute all promises in parallel
      const results = await Promise.all(promises);

      // Process results
      const publicationsData = [];
      const otherPublicationsData = [];
      const grantsData = [];
      const patentsData = [];

      results.forEach(result => {
        switch (result.type) {
          case 'publication':
            // Convert CVData format to the expected format
            publicationsData.push(...result.data.map(item => ({
              data_section_id: item.data_section_id,
              data_details: typeof item.data_details === 'string' ? item.data_details : JSON.stringify(item.data_details)
            })));
            break;
          case 'otherPublication':
            otherPublicationsData.push(...result.data.map(item => ({
              data_section_id: item.data_section_id,
              data_details: typeof item.data_details === 'string' ? item.data_details : JSON.stringify(item.data_details)
            })));
            break;
          case 'grant':
            grantsData.push(...result.data.map(item => ({
              data_section_id: item.data_section_id,
              data_details: typeof item.data_details === 'string' ? item.data_details : JSON.stringify(item.data_details)
            })));
            break;
          case 'patent':
            patentsData.push(...result.data.map(item => ({
              data_section_id: item.data_section_id,
              data_details: typeof item.data_details === 'string' ? item.data_details : JSON.stringify(item.data_details)
            })));
            break;
        }
      });
      
      // Combine publications and process grant money
      const allPublicationsData = [...publicationsData, ...otherPublicationsData];
      const processedGrantMoney = processGrantMoney(grantsData);

      // Update state in batch
      setPublications(allPublicationsData);
      setGrants(grantsData);
      setPatents(patentsData);
      setGrantMoneyRaised(processedGrantMoney);

    } catch (error) {
      console.error("Error fetching CV data:", error);
    }
  }, [department]);

  const processGrantMoney = useCallback((grantsData) => {
    const totalGrantMoneyRaised = [];
    for (const data of grantsData) {
      try {
        const dataDetails = JSON.parse(data.data_details);
        if (dataDetails.dates && dataDetails.amount) {
          const amount = parseFloat(dataDetails.amount);
          let year;
          
          // Handle both date formats: "July, 2008 - June, 2011" and "July, 2008"
          const dateString = dataDetails.dates.trim();
          
          if (dateString.includes(' - ')) {
            // Date range format: "July, 2008 - June, 2011"
            // Extract the end date (second part after ' - ')
            const endDate = dateString.split(' - ')[1].trim();
            if (endDate.includes(',')) {
              // Format: "June, 2011"
              year = endDate.split(',')[1].trim();
            } else {
              // Fallback: try to extract year from end of string
              const yearMatch = endDate.match(/\d{4}/);
              year = yearMatch ? yearMatch[0] : null;
            }
          } else {
            // Single date format: "July, 2008"
            if (dateString.includes(',')) {
              // Format: "July, 2008"
              year = dateString.split(',')[1].trim();
            } else {
              // Fallback: try to extract year from string
              const yearMatch = dateString.match(/\d{4}/);
              year = yearMatch ? yearMatch[0] : null;
            }
          }
        
          // Only add grants with valid numeric amounts and years
          if (!isNaN(amount) && year && !isNaN(year) && amount > 0) {
            totalGrantMoneyRaised.push({
              amount: amount,
              years: parseInt(year), // Convert to integer for consistency
            });
          }
        }
      } catch (error) {
        console.error("Error parsing grant data:", error);
      }
    }
    return totalGrantMoneyRaised;
  }, []);


  // Since data is already filtered by department in getDepartmentCVData, no need for frontend filtering
  const filteredPublications = publications;
  const filteredGrants = grants;
  const filteredPatents = patents;
  const filteredGrantMoney = grantMoneyRaised;

  const totalGrantMoneyRaised = useMemo(() =>
    filteredGrantMoney
      .reduce((total, grant) => {
        // Make sure amount is a valid number and greater than 0
        const amount = Number(grant.amount);
        return total + (isNaN(amount) || amount <= 0 ? 0 : amount);
      }, 0)
      .toLocaleString("en-US", { style: "currency", currency: "USD" }),
    [filteredGrantMoney]
  );

  // Memoized graph data functions to avoid expensive recalculations
  const grantMoneyGraphData = useMemo(() => {
    const data = [];
    const yearlyDataMap = new Map();

    // Use filtered grant money data based on department
    filteredGrantMoney.forEach((grant) => {
      // Add guards to ensure valid data
      if (grant.amount && grant.years && 
          !isNaN(grant.amount) && !isNaN(grant.years) && 
          grant.amount > 0 && grant.years > 1900 && grant.years <= new Date().getFullYear() + 10) {
        const year = grant.years;
        if (yearlyDataMap.has(year)) {
          yearlyDataMap.get(year).GrantFunding += grant.amount;
        } else {
          yearlyDataMap.set(year, {
            date: year.toString(),
            GrantFunding: grant.amount,
          });
        }
      }
    });

    // Convert the map to an array for the graph
    yearlyDataMap.forEach((value) => {
      data.push(value);
    });

    data.sort((a, b) => parseInt(a.date) - parseInt(b.date));
    return data;
  }, [filteredGrantMoney]);

  const yearlyPublicationsGraphData = useMemo(() => {
    const data = [];
    const yearlyDataMap = new Map();

    // Use filtered publications based on department
    filteredPublications.forEach((publication) => {
      try {
        const dataDetails = JSON.parse(publication.data_details);

        // Handle publications with end_date field
        if (dataDetails.end_date) {
          let year;
          const endDateString = dataDetails.end_date.trim();
          
          if (endDateString.includes(' ')) {
            // Format: "June 2019" - extract the year part
            const parts = endDateString.split(' ');
            const yearPart = parts[parts.length - 1]; // Get the last part (year)
            year = parseInt(yearPart);
          } else {
            // Format: "2019" - direct year
            year = parseInt(endDateString);
          }
          
          // Only include valid years
          if (!isNaN(year)) {
            const yearStr = year.toString();
            if (yearlyDataMap.has(yearStr)) {
              yearlyDataMap.get(yearStr).Publications += 1;
            } else {
              yearlyDataMap.set(yearStr, {
                year: yearStr,
                Publications: 1,
              });
            }
          }
        }

      } catch (error) {
        console.error("Error parsing publication data:", error, publication);
      }
    });

    // Convert the map to an array for the graph
    yearlyDataMap.forEach((value) => {
      data.push(value);
    });

    // Sort data by year to ensure chronological order
    data.sort((a, b) => parseInt(a.year) - parseInt(b.year));
    return data;
  }, [filteredPublications]);

  // Memoized patents graph data
  const yearlyPatentsGraphData = useMemo(() => {
    const data = [];
    const yearlyDataMap = new Map();

    // Use filtered patents based on department
    filteredPatents.forEach((patent) => {
      try {
        const dataDetails = JSON.parse(patent.data_details);

        // Handle patents with end_date field (same pattern as publications)
        if (dataDetails.end_date) {
          let year;
          const endDateString = dataDetails.end_date.trim();
          
          if (endDateString.includes(' ')) {
            // Format: "June 2019" - extract the year part
            const parts = endDateString.split(' ');
            const yearPart = parts[parts.length - 1]; // Get the last part (year)
            year = parseInt(yearPart);
          } else {
            // Format: "2019" - direct year
            year = parseInt(endDateString);
          }
          
          // Only include valid years
          if (!isNaN(year)) {
            const yearStr = year.toString();
            if (yearlyDataMap.has(yearStr)) {
              yearlyDataMap.get(yearStr).Patents += 1;
            } else {
              yearlyDataMap.set(yearStr, {
                year: yearStr,
                Patents: 1,
              });
            }
          }
        }

      } catch (error) {
        console.error("Error parsing patent data:", error, patent);
      }
    });

    // Convert the map to an array for the graph
    yearlyDataMap.forEach((value) => {
      data.push(value);
    });

    // Sort data by year to ensure chronological order
    data.sort((a, b) => parseInt(a.year) - parseInt(b.year));
    return data;
  }, [filteredPatents]);

  const SummaryCards = () => (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8 mt-4">
        <AnalyticsCard title="Faculty" value={(userCounts.faculty_count + userCounts.faculty_admin_count).toLocaleString()} />
        <AnalyticsCard title="Delegates" value={userCounts.assistant_count.toLocaleString()} />
        <AnalyticsCard title="CVs Generated" value={totalCVsGenerated.toLocaleString()} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8 mt-4">
        <AnalyticsCard title="Grant Funding" value={totalGrantMoneyRaised} />
        <AnalyticsCard title="Grants" value={filteredGrants.length.toLocaleString()} />
        <AnalyticsCard title="Publications" value={filteredPublications.length.toLocaleString()} />
        <AnalyticsCard title="Patents" value={filteredPatents.length.toLocaleString()} />
      </div>
    </>
  );

  // Memoized keyword computation
  const computedKeywordData = useMemo(() => {
    // Compute department-wide keywords from filtered publications (including other publications)
    const keywordCounts = {};
    filteredPublications.forEach((pub) => {
      try {
        const details = JSON.parse(pub.data_details);
        const keywords = details.keywords || [];
        // Ensure keywords is an array and contains valid strings
        if (Array.isArray(keywords) && keywords.length > 0) {
          keywords.forEach((kw) => {
            if (kw && typeof kw === 'string' && kw.trim().length > 0) {
              const lower = kw.toLowerCase().trim();
              keywordCounts[lower] = (keywordCounts[lower] || 0) + 1;
            }
          });
        }
      } catch (e) {
        console.error("Error parsing publication data for keywords:", e, pub);
      }
    });
    // Only keep top 25 keywords
    const sorted = Object.entries(keywordCounts)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 25);
    return sorted;
  }, [publications]);

  // Memoized graphs configuration for the carousel
  const graphsConfig = useMemo(() => {
    const graphs = [];

    // Grant funding graph (only if there's data)
    if (grantMoneyGraphData.length > 0) {
      graphs.push({
        title: "Yearly Grant Funding",
        data: grantMoneyGraphData,
        dataKey: "GrantFunding",
        xAxisKey: "date",
        xAxisLabel: "Year",
        yAxisLabel: "Grant Funding ($)",
        barColor: "#10b981",
        showLegend: false,
        formatTooltip: (value, name) => [`$${value.toLocaleString()}`, 'Grant Funding ($)'],
        formatYAxis: (value) => {
          if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`;
          } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(0)}K`;
          }
          return `$${value.toLocaleString()}`;
        },
        formatXAxis: (value) => value
      });
    }

    // Publications graph (only if there's data)
    if (yearlyPublicationsGraphData.length > 0) {
      graphs.push({
        title: "Yearly Publications",
        data: yearlyPublicationsGraphData,
        dataKey: "Publications",
        xAxisKey: "year",
        xAxisLabel: "Year",
        yAxisLabel: "Number of Publications",
        barColor: "#8b5cf6",
        showLegend: false,
        formatTooltip: (value, name) => [`${value} ${value === 1 ? 'Publication' : 'Publications'}`, name],
        formatYAxis: (value) => value.toString(),
        formatXAxis: (value) => value
      });
    }

    // Patents graph (only if there's data)
    if (yearlyPatentsGraphData.length > 0) {
      graphs.push({
        title: "Yearly Patents",
        data: yearlyPatentsGraphData,
        dataKey: "Patents",
        xAxisKey: "year",
        xAxisLabel: "Year",
        yAxisLabel: "Number of Patents",
        barColor: "#f59e0b",
        showLegend: false,
        formatTooltip: (value, name) => [`${value} ${value === 1 ? 'Patent' : 'Patents'}`, name],
        formatYAxis: (value) => value.toString(),
        formatXAxis: (value) => value
      });
    }

    return graphs;
  }, [grantMoneyGraphData, yearlyPublicationsGraphData, yearlyPatentsGraphData, department]);

  // Set keyword data when it changes
  useEffect(() => {
    setKeywordData(computedKeywordData);
  }, [computedKeywordData]);

  return (
    <PageContainer>
      <DepartmentAdminMenu getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} />
      <main className="px-16 py-4 w-full min-h-screen bg-zinc-50 mb-16">
        <div className="mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-700 mb-1 mt-2">Department Analytics</h1>
          <h2 className="text-xl font-semibold text-blue-700 mb-6 mt-2">{department}</h2>
          {loading ? (
            <div className="flex items-center justify-center w-full mt-16">
              <div className="text-lg text-zinc-500">Loading...</div>
            </div>
          ) : (
            <>
              <SummaryCards />
              
              {/* Graph Carousel Section */}
              <div className="mb-8">
                <GraphCarousel 
                  graphs={graphsConfig} 
                />
              </div>

              {/* Department Keywords Section */}
              <div className="mt-8">
                <div className="flex flex-col gap-2 p-2 rounded-lg shadow-md bg-zinc-50">
                  <h2 className="text-lg font-semibold p-4">
                    {department === "All" ?
                      "Top Keywords From Publications (All Departments)"
                      : "Top Keywords From Publications (Department-wide)"}
                  </h2>
                  {keywordData.length > 0 && (
                    <div className="flex-1 min-w-0 p-4">
                      <div className="flex flex-wrap gap-2">
                        {(showAllKeywords ? keywordData : keywordData.slice(0, 10)).map((item, index) => {
                          const isMax = item.value === Math.max(...keywordData.map((k) => k.value || 0));
                          return (
                            <span
                              key={index}
                              className={`py-2 px-3 text-sm rounded-full ${
                                isMax ? "bg-yellow-400 text-black font-bold" : "bg-gray-200 text-gray-800"
                              }`}
                            >
                              {item.text.toUpperCase()} {item.value !== 0 && `(${item.value})`}
                            </span>
                          );
                        })}
                      </div>
                      {keywordData.length > 10 && (
                        <button
                          className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                          onClick={() => setShowAllKeywords(!showAllKeywords)}
                        >
                          {showAllKeywords ? `Show Less (Top 10)` : `Show All ${keywordData.length} Keywords`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </PageContainer>
  );
};

export default DepartmentAdminHomePage;
