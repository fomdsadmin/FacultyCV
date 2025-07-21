import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import PageContainer from "./PageContainer.jsx";
import DepartmentAdminMenu from "../Components/DepartmentAdminMenu.jsx";
import AnalyticsCard from "../Components/AnalyticsCard.jsx";
import GraphCarousel from "../Components/GraphCarousel.jsx";
import {
  getAllUsers,
  getUserCVData,
  getAllUniversityInfo,
  getUserConnections,
  getAllSections,
  getNumberOfGeneratedCVs,
} from "../graphql/graphqlHelpers.js";
import { LineGraph } from "../Components/LineGraph.jsx";
import BarChartComponent from "../Components/BarChart.jsx";
import ChartJS from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { WordCloudController, WordElement } from "chartjs-chart-wordcloud";

// Register word cloud plugin if not already registered
ChartJS.register(WordCloudController, WordElement, ChartDataLabels);

const DepartmentAdminHomePage = ({ getCognitoUser, userInfo, department }) => {
  const [loading, setLoading] = useState(false);
  const [facultyUsers, setFacultyUsers] = useState([]);
  const [assistantUsers, setAssistantUsers] = useState([]);
  const [facultyUserTimestamps, setFacultyUserTimestamps] = useState([]);
  const [allUserTimestamps, setAllUserTimestamps] = useState([]);
  const [publications, setPublications] = useState([]);
  const [grants, setGrants] = useState([]);
  const [patents, setPatents] = useState([]);
  const [grantMoneyRaised, setGrantMoneyRaised] = useState([]);
  const [totalCVsGenerated, setTotalCVsGenerated] = useState(0);
  const [facultyConnections, setFacultyConnections] = useState([]);
  const [keywordData, setKeywordData] = useState([]);
  const [showAllKeywords, setShowAllKeywords] = useState(false);
  const [renderWordCloud, setRenderWordCloud] = useState(false); // NEW: control rendering
  const wordCloudCanvasRef = useRef(null);

  const TIME_RANGE = 50;

  // Consolidated data loading
  useEffect(() => {
    loadAllData();
  }, [department]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all basic data in parallel
      const [users, dataSections, generatedCVs] = await Promise.all([
        getAllUsers(),
        getAllSections(),
        department === "All" ? getNumberOfGeneratedCVs() : getNumberOfGeneratedCVs(department)
      ]);

      setTotalCVsGenerated(generatedCVs);

      // Filter users based on department
      const { filteredFacultyUsers, filteredAssistantUsers } = filterUsersByDepartment(users, department);
      
      setFacultyUsers(filteredFacultyUsers);
      setAssistantUsers(filteredAssistantUsers);
      setFacultyUserTimestamps(processUserTimestamps(filteredFacultyUsers));
      setAllUserTimestamps(processUserTimestamps(users));

      // Fetch CV data and connections in parallel
      await Promise.all([
        fetchAllUserCVData(filteredFacultyUsers, dataSections),
        fetchFacultyConnections(filteredAssistantUsers)
      ]);

    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [department]);

  // Helper function to filter users by department
  const filterUsersByDepartment = useCallback((users, dept) => {
    if (dept === "All") {
      return {
        filteredFacultyUsers: users.filter((user) => user.role === "Faculty" || user.role.startsWith("Admin-")),
        filteredAssistantUsers: users.filter((user) => user.role === "Assistant")
      };
    } else {
      return {
        filteredFacultyUsers: users.filter(
          (user) =>
            (user.role === "Faculty" || user.role.startsWith("Admin-")) &&
            (user.primary_department === dept || user.secondary_department === dept)
        ),
        filteredAssistantUsers: users.filter(
          (user) =>
            user.role === "Assistant" &&
            (user.primary_department === dept || user.secondary_department === dept)
        )
      };
    }
  }, []);

  // Helper function to process user timestamps
  const processUserTimestamps = useCallback((users) => {
    return users
      .map((user) => new Date(user.joined_timestamp))
      .sort((a, b) => a - b)
      .map((timestamp) => {
        timestamp.setHours(0, 0, 0, 0);
        return timestamp;
      });
  }, []);

  const fetchAllUserCVData = useCallback(async (users, dataSections) => {
    if (users.length === 0) return;

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

      // Create all promises for parallel execution
      const allPromises = [];
      
      users.forEach((user) => {
        if (publicationSectionId) {
          allPromises.push(
            getUserCVData(user.user_id, publicationSectionId)
              .then(data => ({ type: 'publication', data, userId: user.user_id }))
              .catch(() => ({ type: 'publication', data: [], userId: user.user_id }))
          );
        }
        if (otherPublicationSectionId) {
          allPromises.push(
            getUserCVData(user.user_id, otherPublicationSectionId)
              .then(data => ({ type: 'otherPublication', data, userId: user.user_id }))
              .catch(() => ({ type: 'otherPublication', data: [], userId: user.user_id }))
          );
        }
        if (secureFundingSectionId) {
          allPromises.push(
            getUserCVData(user.user_id, secureFundingSectionId)
              .then(data => ({ type: 'grant', data, userId: user.user_id }))
              .catch(() => ({ type: 'grant', data: [], userId: user.user_id }))
          );
        }
        if (patentSectionId) {
          allPromises.push(
            getUserCVData(user.user_id, patentSectionId)
              .then(data => ({ type: 'patent', data, userId: user.user_id }))
              .catch(() => ({ type: 'patent', data: [], userId: user.user_id }))
          );
        }
      });

      // Execute all promises in parallel
      const results = await Promise.all(allPromises);

      // Process results
      const publicationsData = [];
      const otherPublicationsData = [];
      const grantsData = [];
      const patentsData = [];

      results.forEach(result => {
        switch (result.type) {
          case 'publication':
            publicationsData.push(...result.data);
            break;
          case 'otherPublication':
            otherPublicationsData.push(...result.data);
            break;
          case 'grant':
            grantsData.push(...result.data);
            break;
          case 'patent':
            patentsData.push(...result.data);
            break;
        }
      });
      console.log(patentsData);
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
  }, []);

  const processGrantMoney = useCallback((grantsData) => {
    const totalGrantMoneyRaised = [];
    for (const data of grantsData) {
      try {
        const dataDetails = JSON.parse(data.data_details);
        if (dataDetails.year && dataDetails.amount) {
          const amount = parseInt(dataDetails.amount);
          const year = parseInt(dataDetails.year);
          
          // Only add if both amount and year are valid numbers and amount is greater than 0
          if (!isNaN(amount) && !isNaN(year) && amount > 0 && year > 1900 && year <= new Date().getFullYear() + 10) {
            totalGrantMoneyRaised.push({
              amount: amount,
              user_id: data.user_id,
              years: year,
            });
          }
        }
      } catch (error) {
        console.error("Error parsing grant data:", error);
      }
    }
    return totalGrantMoneyRaised;
  }, []);

  const fetchFacultyConnections = useCallback(async (users) => {
    if (users.length === 0) {
      setFacultyConnections([]);
      return;
    }

    try {
      const connectionPromises = users.map((user) =>
        getUserConnections(user.user_id, false).catch((error) => {
          console.error("Error fetching connections:", error);
          return [];
        })
      );
      
      const connectionsResults = await Promise.all(connectionPromises);
      const allConnections = connectionsResults.flat();
      setFacultyConnections(allConnections);
    } catch (error) {
      console.error("Error fetching faculty connections:", error);
    }
  }, []);

  // Memoized filtered data to avoid recalculations on every render
  const filteredPublications = useMemo(() =>
    department === "All"
      ? publications
      : publications.filter((publication) =>
          facultyUsers.some((user) => user.user_id === publication.user_id)
        ), [publications, facultyUsers, department]
  );

  const filteredGrants = useMemo(() =>
    department === "All"
      ? grants
      : grants.filter((grant) => facultyUsers.some((user) => user.user_id === grant.user_id)),
    [grants, facultyUsers, department]
  );

  const filteredPatents = useMemo(() =>
    department === "All"
      ? patents
      : patents.filter((patent) => facultyUsers.some((user) => user.user_id === patent.user_id)),
    [patents, facultyUsers, department]
  );

  // Memoized grant money filtering and calculation
  const filteredGrantMoney = useMemo(() =>
    department === "All"
      ? grantMoneyRaised
      : grantMoneyRaised.filter((grant) => facultyUsers.some((user) => user.user_id === grant.user_id)),
    [grantMoneyRaised, facultyUsers, department]
  );

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
  const graphData = useMemo(() => {
    const data = [];
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);
    const startDate = new Date(endDate);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - TIME_RANGE);

    // Create a map to aggregate user counts by month and role
    const monthlyDataMap = new Map();

    // Get all users with their roles and timestamps
    const allUsersWithRoles = department === "All" 
      ? [...facultyUsers, ...assistantUsers]
      : [...facultyUsers, ...assistantUsers]; // Already filtered by department

    allUsersWithRoles.forEach((user) => {
      const timestamp = new Date(user.joined_timestamp);
      timestamp.setHours(0, 0, 0, 0);
      
      if (timestamp >= startDate && timestamp <= endDate) {
        const monthKey = `${timestamp.getFullYear()}-${timestamp.getMonth()}`; // e.g., "2024-9" for Oct 2024
        const formattedDate = timestamp.toLocaleString("default", { month: "short", year: "numeric" });

        // Normalize role names for consistent grouping
        let roleKey = user.role;
        if (user.role === "Faculty") {
          roleKey = "Faculty";
        } else if (user.role === "Assistant") {
          roleKey = "Assistant";
        } else if (user.role.startsWith("Admin-")) {
          roleKey = "Dept Admin";
        } else if (user.role === "Admin") {
          roleKey = "System Admin";
        } else {
          roleKey = "Other";
        }

        if (monthlyDataMap.has(monthKey)) {
          const monthData = monthlyDataMap.get(monthKey);
          monthData[roleKey] = (monthData[roleKey] || 0) + 1;
        } else {
          monthlyDataMap.set(monthKey, {
            date: formattedDate,
            [roleKey]: 1,
          });
        }
      }
    });

    // Add data points for each month even if there are no users
    for (let date = new Date(startDate); date <= endDate; date.setMonth(date.getMonth() + 1)) {
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const formattedDate = date.toLocaleString("default", { month: "short", year: "numeric" });

      if (!monthlyDataMap.has(monthKey)) {
        monthlyDataMap.set(monthKey, {
          date: formattedDate,
          Faculty: 0,
          Assistant: 0,
          "Dept Admin": 0,
          "System Admin": 0,
          Other: 0,
        });
      } else {
        // Ensure all role keys exist with default value 0
        const monthData = monthlyDataMap.get(monthKey);
        monthData.Faculty = monthData.Faculty || 0;
        monthData.Assistant = monthData.Assistant || 0;
        monthData["Dept Admin"] = monthData["Dept Admin"] || 0;
        monthData["System Admin"] = monthData["System Admin"] || 0;
        monthData.Other = monthData.Other || 0;
      }
    }

    // Convert the map to an array for the graph
    monthlyDataMap.forEach((value) => {
      data.push(value);
    });

    // Sort data by date to ensure chronological order
    data.sort((a, b) => new Date(a.date) - new Date(b.date));

    return data;
  }, [facultyUsers, assistantUsers, department, TIME_RANGE]);

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
        const currentYear = new Date().getFullYear();
        
        // Handle regular publications with year_published
        if (dataDetails.year_published) {
          const year = parseInt(dataDetails.year_published);
          if (!isNaN(year) && year > 1900 && year <= currentYear) {
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
        
        // Handle other publications with dates field
        if (dataDetails.dates && typeof dataDetails.dates === 'string') {
          const dateParts = dataDetails.dates.split("-");
          if (dateParts.length > 1) {
            let yearPart = dateParts[1];
            // do for all except the ones with 'Current'
            if (yearPart && yearPart.includes(",")) {
              const yearCommaparts = yearPart.split(",");
              if (yearCommaparts.length > 1) {
                const year = parseInt(yearCommaparts[1].trim());
                if (!isNaN(year) && year > 1900 && year <= currentYear) {
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

  const SummaryCards = () => (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8 mt-4">
        <AnalyticsCard title="Faculty Users" value={facultyUsers.length} />
        <AnalyticsCard title="Assistant Users" value={assistantUsers.length} />
        <AnalyticsCard title="CVs Generated" value={totalCVsGenerated} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8 mt-4">
        <AnalyticsCard title="Grant Funding" value={totalGrantMoneyRaised} />
        <AnalyticsCard title="Grants" value={filteredGrants.length} />
        <AnalyticsCard title="Publications" value={filteredPublications.length} />
        <AnalyticsCard title="Patents" value={filteredPatents.length} />
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
  }, [filteredPublications]);

  // Memoized graphs configuration for the carousel
  const graphsConfig = useMemo(() => {
    const graphs = [];

    // Users joined graph with multiple bars for different roles
    graphs.push({
      title: department === "All" ? "All Users Joined Over Time" : "Users Joined Over Time",
      data: graphData,
      dataKeys: ["Faculty", "Assistant"],
      barColors: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
      xAxisKey: "date",
      xAxisLabel: "Time Period",
      yAxisLabel: "Number of Users",
      showLegend: false,
      formatTooltip: (value, name) => [`${value} ${value === 1 ? 'User' : 'Users'}`, name],
      formatYAxis: (value) => value.toString(),
      formatXAxis: (value) => value
    });

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

    return graphs;
  }, [graphData, grantMoneyGraphData, yearlyPublicationsGraphData, department]);

  // Set keyword data when it changes
  useEffect(() => {
    setKeywordData(computedKeywordData);
  }, [computedKeywordData]);

  // Word cloud rendering effect
  useEffect(() => {
    if (!renderWordCloud || !wordCloudCanvasRef.current || keywordData.length === 0) return;

    const container = wordCloudCanvasRef.current.parentElement;
    const containerWidth = container.offsetWidth;
    const containerHeight = 500;

    wordCloudCanvasRef.current.width = containerWidth;
    wordCloudCanvasRef.current.height = containerHeight;
    wordCloudCanvasRef.current.style.width = `${containerWidth}px`;
    wordCloudCanvasRef.current.style.height = `${containerHeight}px`;

    const maxValue = Math.max(...keywordData.map((d) => d.value));
    const minValue = Math.min(...keywordData.map((d) => d.value));
    const numKeywords = keywordData.length;

    let baseSize = Math.max(10, Math.min(16, containerWidth / 40));
    let maxSize = Math.max(baseSize * 1.2, Math.min(24, containerWidth / 25));
    let minSize = Math.max(8, baseSize * 0.8);

    if (numKeywords > 50) {
      maxSize = Math.min(maxSize, 18);
      minSize = Math.max(minSize, 8);
    } else if (numKeywords > 30) {
      maxSize = Math.min(maxSize, 20);
      minSize = Math.max(minSize, 10);
    }

    const chart = new ChartJS(wordCloudCanvasRef.current, {
      type: "wordCloud",
      data: {
        labels: keywordData.map((d) => d.text),
        datasets: [
          {
            label: "Keywords",
            data: keywordData.map((d) => {
              const ratio = maxValue === minValue ? 1 : (d.value - minValue) / (maxValue - minValue);
              return minSize + (maxSize - minSize) * ratio;
            }),
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          tooltip: { enabled: false },
          datalabels: { display: false },
        },
        layout: {
          padding: {
            top: 60,
            right: 60,
            left: 60,
            bottom: 60,
          },
        },
        elements: {
          word: {
            color: (ctx) => {
              const label = ctx.element?.text;
              const wordObj = keywordData.find((d) => d.text === label);
              const isMax = wordObj && wordObj.value === maxValue;
              return isMax ? "#facc15" : "#4a5568";
            },
            padding: 5,
            rotation: () => 0,
            family: "Arial, sans-serif",
            weight: (ctx) => {
              const label = ctx.element?.text;
              const wordObj = keywordData.find((d) => d.text === label);
              const isMax = wordObj && wordObj.value === maxValue;
              return isMax ? "bold" : "normal";
            },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [keywordData, renderWordCloud]);

  return (
    <PageContainer>
      <DepartmentAdminMenu getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} />
      <main className="px-5 lg:px-8 xl:px-12 py-4 w-full min-h-screen bg-zinc-50 mb-16">
        <div className="max-w-7xl mx-auto">
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
                        : "Top Keywords From Publications (Department-wide, Top 25)"}
                    </h2>
                  {keywordData.length > 0 && (
                    <div className="flex-1 min-w-0 p-4">
                      <div className="flex flex-wrap gap-2">
                        {keywordData.map((item, index) => {
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
                    </div>
                  )}

                  {/* Render word cloud separately, only when button is clicked */}
                  <div className="flex flex-col items-start gap-2 p-4">
                    <button
                      className="px-4 py-2 rounded bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
                      onClick={() => setRenderWordCloud((v) => !v)}
                    >
                      {renderWordCloud ? "Hide Word Cloud" : "Show Word Cloud"}
                    </button>
                    {renderWordCloud && keywordData.length > 0 && (
                      <div
                        style={{
                          width: "100%",
                          maxWidth: "100%",
                          height: "500px",
                          position: "relative",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          overflow: "hidden",
                        }}
                      >
                        <canvas
                          ref={wordCloudCanvasRef}
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "block",
                          }}
                        ></canvas>
                      </div>
                    )}
                  </div>
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
