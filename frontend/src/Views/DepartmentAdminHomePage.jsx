import React, { useState, useEffect, useRef } from "react";
import PageContainer from "./PageContainer.jsx";
import DepartmentAdminMenu from "../Components/DepartmentAdminMenu.jsx";
import AnalyticsCard from "../Components/AnalyticsCard.jsx";
import {
  getAllUsers,
  getUserCVData,
  getAllUniversityInfo,
  getUserConnections,
  getAllSections,
  getNumberOfGeneratedCVs,
} from "../graphql/graphqlHelpers.js";
import { formatDateToLongString } from "../utils/time.js";
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

  useEffect(() => {
    fetchUsers();
    fetchGeneratedCVs();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const users = await getAllUsers();
      let filteredFacultyUsers = [];
      if (department === "All") {
        filteredFacultyUsers = users.filter(
          (user) =>
            user.role === "Faculty" 
        );
      } else {
        filteredFacultyUsers = users.filter(
          (user) =>
            user.role === "Faculty" &&
            (user.primary_department === department || user.secondary_department === department)
        );
      }

      let filteredAssistantUsers = [];
      if (department === "All") {
        filteredAssistantUsers = users.filter(
          (user) =>
            user.role === "Assistant" 
        );
      } else {
        filteredAssistantUsers = users.filter(
          (user) =>
            user.role === "Assistant" &&
            (user.primary_department === department || user.secondary_department === department)
        );
      }
      const facultyTimestamps = filteredFacultyUsers
        .map((user) => new Date(user.joined_timestamp))
        .sort((a, b) => a - b)
        .map((timestamp) => {
          timestamp.setHours(0, 0, 0, 0);
          return timestamp;
        });
      const allTimestamps = users
        .map((user) => new Date(user.joined_timestamp))
        .sort((a, b) => a - b)
        .map((timestamp) => {
          timestamp.setHours(0, 0, 0, 0);
          return timestamp;
        });
      setFacultyUsers(filteredFacultyUsers);
      setAssistantUsers(filteredAssistantUsers);
      setFacultyUserTimestamps(facultyTimestamps);
      setAllUserTimestamps(allTimestamps);

      fetchAllUserCVData(filteredFacultyUsers);
      fetchFacultyConnections(filteredAssistantUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
    setLoading(false);
  }

  async function fetchGeneratedCVs() {
    setLoading(true);
    try {
      if (department === "All") {
        const generatedCVs = await getNumberOfGeneratedCVs();
        setTotalCVsGenerated(generatedCVs);
      } else {
        const generatedCVs = await getNumberOfGeneratedCVs(department);
        setTotalCVsGenerated(generatedCVs);
      }
    } catch (error) {
      console.error("Error fetching generated CVs:", error);
    }
    setLoading(false);
  }

  async function fetchAllUserCVData(users) {
    setLoading(true);
    let dataSections = [];
    try {
      dataSections = await getAllSections();
    } catch (error) {
      console.error("Error fetching data sections:", error);
    }

    const publicationSectionId = dataSections.find((section) => section.title === "Publications")?.data_section_id;
    const secureFundingSectionId = dataSections.find(
      (section) => section.title === "Research or Equivalent Grants"
    )?.data_section_id;
    const patentSectionId = dataSections.find((section) => section.title === "Patents")?.data_section_id;

    // Fetch all publications, grants, and patents in parallel for all users
    const publicationPromises = users.map((user) =>
      getUserCVData(user.user_id, publicationSectionId).catch((e) => {
        console.error("Error fetching publications:", e);
        return [];
      })
    );
    const grantPromises = users.map((user) =>
      getUserCVData(user.user_id, secureFundingSectionId).catch((e) => {
        console.error("Error fetching grants:", e);
        return [];
      })
    );
    const patentPromises = users.map((user) =>
      getUserCVData(user.user_id, patentSectionId).catch((e) => {
        console.error("Error fetching patents:", e);
        return [];
      })
    );

    // Await all in parallel
    const [publicationsResults, grantsResults, patentsResults] = await Promise.all([
      Promise.all(publicationPromises),
      Promise.all(grantPromises),
      Promise.all(patentPromises),
    ]);

    // Flatten results
    const publicationsData = publicationsResults.flat();
    const grantsData = grantsResults.flat();
    const patentsData = patentsResults.flat();

    // Grant money
    let totalGrantMoneyRaised = [];
    for (const data of grantsData) {
      try {
        const dataDetails = JSON.parse(data.data_details);
        if (dataDetails.year) {
          totalGrantMoneyRaised.push({
            amount: parseInt(dataDetails.amount),
            user_id: data.user_id,
            years: parseInt(dataDetails.year),
          });
        }
      } catch (error) {
        console.error("Error parsing grant data:", error);
      }
    }

    setPublications(publicationsData);
    setGrants(grantsData);
    setPatents(patentsData);
    setGrantMoneyRaised(totalGrantMoneyRaised);

    setLoading(false);
  }

  async function fetchFacultyConnections(users) {
    setLoading(true);
    let connections = [];
    for (const user of users) {
      try {
        const newConnections = await getUserConnections(user.user_id, false);
        connections = [...connections, ...newConnections];
      } catch (error) {
        console.error("Error fetching connections:", error);
      }
    }
    setFacultyConnections(connections);
    setLoading(false);
  }

  const filteredPublications = publications.filter((publication) =>
    facultyUsers.some((user) => user.user_id === publication.user_id)
  );

  const filteredGrants = grants.filter((grant) => facultyUsers.some((user) => user.user_id === grant.user_id));

  const filteredPatents = patents.filter((patent) => facultyUsers.some((user) => user.user_id === patent.user_id));

  const totalGrantMoneyRaised = grantMoneyRaised
    .reduce((total, grant) => total + grant.amount, 0)
    .toLocaleString("en-US", { style: "currency", currency: "USD" });

  const getGraphData = () => {
    const data = [];
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);
    const startDate = new Date(endDate);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - TIME_RANGE);

    // Create a map to aggregate user counts by month
    const monthlyDataMap = new Map();

    facultyUserTimestamps.forEach((timestamp) => {
      if (timestamp >= startDate && timestamp <= endDate) {
        const monthKey = `${timestamp.getFullYear()}-${timestamp.getMonth()}`; // e.g., "2024-9" for Oct 2024
        const formattedDate = timestamp.toLocaleString("default", { month: "short", year: "numeric" });

        if (monthlyDataMap.has(monthKey)) {
          monthlyDataMap.get(monthKey).Users += 1;
        } else {
          monthlyDataMap.set(monthKey, {
            date: formattedDate,
            Users: 1,
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
          Users: 0, // No users for this month
        });
      }
    }

    // Convert the map to an array for the graph
    monthlyDataMap.forEach((value) => {
      data.push(value);
    });

    // Sort data by date to ensure chronological order
    data.sort((a, b) => new Date(a.date) - new Date(b.date));

    return data;
  };

  const getGrantMoneyGraphData = () => {
    const data = [];

    // Create a map to aggregate grant money by year
    const yearlyDataMap = new Map();

    grantMoneyRaised.forEach((grant) => {
      if (grant.amount && grant.years) {
        const year = grant.years;
        if (yearlyDataMap.has(year)) {
          yearlyDataMap.get(year).GrantFunding += grant.amount;
        } else {
          yearlyDataMap.set(year, {
            date: year.toString(),
            GrantFunding: grant.amount,
          });
        }
      } else {
        console.warn("Invalid year or amount in grant data:", grant);
      }
    });

    // Convert the map to an array for the graph
    yearlyDataMap.forEach((value) => {
      data.push(value);
    });

    data.sort((a, b) => parseInt(a.date) - parseInt(b.date));

    // console.log("Final data for graph:", data);
    return data;
  };

  const getYearlyPublicationsGraphData = () => {
    const data = [];

    // Create a map to aggregate publications by year
    const yearlyDataMap = new Map();

    publications.forEach((publication) => {
      try {
        const dataDetails = JSON.parse(publication.data_details);
        const currentYear = new Date().getFullYear();
        const fiveYearsago = currentYear - 5; // to get publications only for last 5 years
        if (
          dataDetails.year_published &&
          Number(dataDetails.year_published) > fiveYearsago &&
          Number(dataDetails.year_published) <= currentYear
        ) {
          const year = dataDetails.year_published.toString();
          if (yearlyDataMap.has(year)) {
            yearlyDataMap.get(year).Publications += 1;
          } else {
            yearlyDataMap.set(year, {
              year: year,
              Publications: 1,
            });
          }
        }
      } catch (error) {
        console.error("Error parsing publication data:", error);
      }
    });

    // Convert the map to an array for the graph
    yearlyDataMap.forEach((value) => {
      data.push(value);
    });

    // Sort data by year to ensure chronological order
    data.sort((a, b) => parseInt(a.year) - parseInt(b.year));

    // console.log("Final data for yearly publications graph:", data);
    return data;
  };

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

  // Minimal graph container
  const GraphContainer = ({ title, children }) => (
    <div className="bg-white rounded-lg shadow-sm p-5 mb-8 w-full">
      <h2 className="text-base font-semibold text-zinc-700 mb-3">{title}</h2>
      <div className="w-full overflow-x-auto">{children}</div>
    </div>
  );

  // Add effect to compute keywords after publications are loaded
  useEffect(() => {
    // Compute department-wide keywords from all publications
    const keywordCounts = {};
    publications.forEach((pub) => {
      try {
        const details = JSON.parse(pub.data_details);
        const keywords = details.keywords || [];
        keywords.forEach((kw) => {
          const lower = kw.toLowerCase();
          keywordCounts[lower] = (keywordCounts[lower] || 0) + 1;
        });
      } catch (e) {}
    });
    // Only keep top 25 keywords
    const sorted = Object.entries(keywordCounts)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 25);
    setKeywordData(sorted);
  }, [publications]);

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GraphContainer title="Users Joined Over Time">
                  <BarChartComponent data={getGraphData()} dataKey="Users" xAxisKey="date" barColor="#ff8042" />
                </GraphContainer>
                <GraphContainer title="Yearly Grant Funding">
                  <BarChartComponent
                    data={getGrantMoneyGraphData()}
                    dataKey="GrantFunding"
                    xAxisKey="date"
                    barColor="#82ca9d"
                  />
                </GraphContainer>
              </div>
              {/* Department Keywords Section */}
              <div className="mt-10">
                <div className="flex flex-col gap-6 p-2 rounded-lg shadow-md bg-zinc-50">
                  <h2 className="text-lg font-semibold mb-2 p-4">
                    Keywords From Publications (Department-wide, Top 25)
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
              <div className="mt-6">
                <GraphContainer title="Yearly Publications (Last 5 Years)">
                  <BarChartComponent
                    data={getYearlyPublicationsGraphData()}
                    dataKey="Publications"
                    xAxisKey="year"
                    barColor="#8884d8"
                  />
                </GraphContainer>
              </div>
            </>
          )}
        </div>
      </main>
    </PageContainer>
  );
};

export default DepartmentAdminHomePage;
