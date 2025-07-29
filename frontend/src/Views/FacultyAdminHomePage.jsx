import React, { useState, useEffect, useMemo, useCallback } from "react";
import PageContainer from "./PageContainer.jsx";
import FacultyAdminMenu from "../Components/FacultyAdminMenu.jsx";
import AnalyticsCard from "../Components/AnalyticsCard.jsx";
import GraphCarousel from "../Components/GraphCarousel.jsx";
import {
  getAllUsers,
  getFacultyUsersInDepartment,
  getAssistantUsersInDepartment,
  getDepartmentAdminUsersInDepartment,
  getUserCVData,
  getAllSections,
  getNumberOfGeneratedCVs,
} from "../graphql/graphqlHelpers.js";

const FacultyAdminHomePage = ({ userInfo, getCognitoUser, toggleViewMode }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [faculty, setFaculty] = useState("");
  const [publications, setPublications] = useState([]);
  const [grants, setGrants] = useState([]);
  const [patents, setPatents] = useState([]);
  const [grantMoneyRaised, setGrantMoneyRaised] = useState([]);
  const [totalCVsGenerated, setTotalCVsGenerated] = useState(0);

  const TIME_RANGE = 50;

  // Determine which faculty this admin manages
  useEffect(() => {
    if (userInfo?.role) {
      if (userInfo.role === "Admin") {
        setFaculty("All");
      } else if (userInfo.role.startsWith("FacultyAdmin-")) {
        setFaculty(userInfo.role.split("FacultyAdmin-")[1]);
      }
    }
  }, [userInfo]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        let allUsers = [];

        if (userInfo.role === "Admin") {
          // Admin can see all users
          allUsers = await getAllUsers();
        } else if (userInfo.role.startsWith("FacultyAdmin-")) {
          // FacultyAdmin can only see users in their faculty
          const facultyName = userInfo.role.split("FacultyAdmin-")[1];

          // Get all users and filter by faculty
          const users = await getAllUsers();
          allUsers = users.filter(
            (user) => user.primary_faculty === facultyName || user.secondary_faculty === facultyName
          );
        }

        setUsers(allUsers);

        // Fetch CV data and other metrics
        await fetchCVDataAndMetrics(allUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userInfo?.role) {
      fetchUsers();
    }
  }, [userInfo]);

  const fetchCVDataAndMetrics = useCallback(
    async (users) => {
      try {
        // Get CV sections and generated CVs count
        const [dataSections, generatedCVs] = await Promise.all([
          getAllSections(),
          userInfo.role === "Admin" ? getNumberOfGeneratedCVs() : getNumberOfGeneratedCVs(faculty),
        ]);

        setTotalCVsGenerated(generatedCVs);

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
                .then((data) => ({ type: "publication", data, userId: user.user_id }))
                .catch(() => ({ type: "publication", data: [], userId: user.user_id }))
            );
          }
          if (otherPublicationSectionId) {
            allPromises.push(
              getUserCVData(user.user_id, otherPublicationSectionId)
                .then((data) => ({ type: "otherPublication", data, userId: user.user_id }))
                .catch(() => ({ type: "otherPublication", data: [], userId: user.user_id }))
            );
          }
          if (secureFundingSectionId) {
            allPromises.push(
              getUserCVData(user.user_id, secureFundingSectionId)
                .then((data) => ({ type: "grant", data, userId: user.user_id }))
                .catch(() => ({ type: "grant", data: [], userId: user.user_id }))
            );
          }
          if (patentSectionId) {
            allPromises.push(
              getUserCVData(user.user_id, patentSectionId)
                .then((data) => ({ type: "patent", data, userId: user.user_id }))
                .catch(() => ({ type: "patent", data: [], userId: user.user_id }))
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

        results.forEach((result) => {
          switch (result.type) {
            case "publication":
              publicationsData.push(...result.data);
              break;
            case "otherPublication":
              otherPublicationsData.push(...result.data);
              break;
            case "grant":
              grantsData.push(...result.data);
              break;
            case "patent":
              patentsData.push(...result.data);
              break;
          }
        });

        // Combine publications and process grant money
        const allPublicationsData = [...publicationsData, ...otherPublicationsData];
        const processedGrantMoney = processGrantMoney(grantsData);

        // Update state
        setPublications(allPublicationsData);
        setGrants(grantsData);
        setPatents(patentsData);
        setGrantMoneyRaised(processedGrantMoney);
      } catch (error) {
        console.error("Error fetching CV data:", error);
      }
    },
    [faculty, userInfo?.role]
  );

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

  const facultyUsers = users.filter((user) => user.role === "Faculty");
  const assistantUsers = users.filter((user) => user.role === "Assistant");
  const departmentAdminUsers = users.filter((user) => user.role.startsWith("Admin-"));
  const facultyAdminUsers = users.filter((user) => user.role.startsWith("FacultyAdmin-"));

  // Memoized grant money calculation
  const totalGrantMoneyRaised = useMemo(
    () => grantMoneyRaised.reduce((total, grant) => total + (grant.amount || 0), 0),
    [grantMoneyRaised]
  );

  // Memoized users joined over time data
  const graphData = useMemo(() => {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - TIME_RANGE);

    // Create a map to aggregate user counts by month and role
    const monthlyDataMap = new Map();

    // Get all users with their roles and timestamps
    const allUsersWithRoles = [...facultyUsers, ...assistantUsers];

    allUsersWithRoles.forEach((user) => {
      const timestamp = new Date(user.joined_timestamp);
      timestamp.setHours(0, 0, 0, 0);

      if (timestamp >= startDate && timestamp <= endDate) {
        const monthKey = `${timestamp.getFullYear()}-${timestamp.getMonth()}`;
        const formattedDate = timestamp.toLocaleString("default", { month: "short", year: "numeric" });

        // Normalize role names for consistent grouping
        let roleKey = user.role;
        if (user.role === "Faculty") {
          roleKey = "Faculty";
        } else if (user.role === "Assistant") {
          roleKey = "Assistant";
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
        });
      }
    }

    const sorted = Array.from(monthlyDataMap.values()).sort((a, b) => {
      const dateA = new Date(a.date + " 1");
      const dateB = new Date(b.date + " 1");
      return dateA - dateB;
    });

    return sorted;
  }, [facultyUsers, assistantUsers]);

  // Memoized grant money graph data
  const grantMoneyGraphData = useMemo(() => {
    const data = [];
    const yearlyDataMap = new Map();

    grantMoneyRaised.forEach((grant) => {
      if (
        grant.amount &&
        grant.years &&
        !isNaN(grant.amount) &&
        !isNaN(grant.years) &&
        grant.amount > 0 &&
        grant.years > 1900 &&
        grant.years <= new Date().getFullYear() + 10
      ) {
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

    yearlyDataMap.forEach((value) => {
      data.push(value);
    });

    data.sort((a, b) => parseInt(a.date) - parseInt(b.date));
    return data;
  }, [grantMoneyRaised]);

  // Memoized publications graph data
  const yearlyPublicationsGraphData = useMemo(() => {
    const data = [];
    const yearlyDataMap = new Map();

    publications.forEach((publication) => {
      try {
        const dataDetails = JSON.parse(publication.data_details);
        const currentYear = new Date().getFullYear();

        // Handle regular publications with year_published (same as Department Admin)
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

        // Handle other publications with dates field (same as Department Admin)
        if (dataDetails.dates && typeof dataDetails.dates === "string") {
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

        // Fallback: Handle legacy year and years fields for backward compatibility
        if (!dataDetails.year_published && !dataDetails.dates) {
          if (dataDetails.year) {
            const year = parseInt(dataDetails.year);
            if (!isNaN(year) && year >= 1900 && year <= currentYear) {
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
          } else if (dataDetails.years) {
            if (Array.isArray(dataDetails.years)) {
              dataDetails.years.forEach((yearValue) => {
                const year = parseInt(yearValue);
                if (!isNaN(year) && year >= 1900 && year <= currentYear) {
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
              });
            } else {
              const year = parseInt(dataDetails.years);
              if (!isNaN(year) && year >= 1900 && year <= currentYear) {
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
      } catch (error) {
        console.error("Error parsing publication data:", error, publication);
      }
    });

    yearlyDataMap.forEach((value) => {
      data.push(value);
    });

    data.sort((a, b) => parseInt(a.year) - parseInt(b.year));
    return data;
  }, [publications]);

  // Memoized patents graph data
  const yearlyPatentsGraphData = useMemo(() => {
    const data = [];
    const yearlyDataMap = new Map();

    patents.forEach((patent) => {
      try {
        const dataDetails = JSON.parse(patent.data_details);
        const currentYear = new Date().getFullYear();

        // Handle patents with year_published (same pattern as publications)
        if (dataDetails.year_published) {
          const year = parseInt(dataDetails.year_published);
          if (!isNaN(year) && year > 1900 && year <= currentYear) {
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

        // Handle patents with dates field (same pattern as publications)
        if (dataDetails.dates && typeof dataDetails.dates === "string") {
          const dateParts = dataDetails.dates.split("-");
          if (dateParts.length > 1) {
            let yearPart = dateParts[1];
            if (yearPart && yearPart.includes(",")) {
              const yearCommaparts = yearPart.split(",");
              if (yearCommaparts.length > 1) {
                const year = parseInt(yearCommaparts[1].trim());
                if (!isNaN(year) && year > 1900 && year <= currentYear) {
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
            }
          }
        }

        // Fallback: Handle legacy year and years fields for backward compatibility
        if (!dataDetails.year_published && !dataDetails.dates) {
          if (dataDetails.year) {
            const year = parseInt(dataDetails.year);
            if (!isNaN(year) && year >= 1900 && year <= currentYear) {
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
          } else if (dataDetails.years) {
            if (Array.isArray(dataDetails.years)) {
              dataDetails.years.forEach((yearValue) => {
                const year = parseInt(yearValue);
                if (!isNaN(year) && year >= 1900 && year <= currentYear) {
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
              });
            } else {
              const year = parseInt(dataDetails.years);
              if (!isNaN(year) && year >= 1900 && year <= currentYear) {
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
          }
        }
      } catch (error) {
        console.error("Error parsing patent data:", error, patent);
      }
    });

    yearlyDataMap.forEach((value) => {
      data.push(value);
    });

    data.sort((a, b) => parseInt(a.year) - parseInt(b.year));
    return data;
  }, [patents]);

  // Memoized graphs configuration for the carousel
  const graphsConfig = useMemo(() => {
    const graphs = [];
    // Users joined graph with multiple bars for different roles
    graphs.push({
      title: faculty === "All" ? "All Users Joined Over Time" : `Users Joined Over Time (${faculty})`,
      data: graphData,
      dataKeys: ["Faculty", "Assistant"],
      barColors: ["#3b82f6", "#10b981"],
      xAxisKey: "date",
      xAxisLabel: "Time Period",
      yAxisLabel: "Number of Users",
      showLegend: false,
      formatTooltip: (value, name) => [`${value} ${value === 1 ? "User" : "Users"}`, name],
      formatYAxis: (value) => value.toString(),
      formatXAxis: (value) => value,
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
        formatTooltip: (value, name) => [`$${value.toLocaleString()}`, "Grant Funding ($)"],
        formatYAxis: (value) => {
          if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`;
          } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(0)}K`;
          }
          return `$${value.toLocaleString()}`;
        },
        formatXAxis: (value) => value,
      });
    }

    // Publications graph (only if there's data) - same logic as Department Admin
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
        formatTooltip: (value, name) => [`${value} ${value === 1 ? "Publication" : "Publications"}`, name],
        formatYAxis: (value) => value.toString(),
        formatXAxis: (value) => value,
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
        formatTooltip: (value, name) => [`${value} ${value === 1 ? "Patent" : "Patents"}`, name],
        formatYAxis: (value) => value.toString(),
        formatXAxis: (value) => value,
      });
    }
    return graphs;
  }, [graphData, grantMoneyGraphData, yearlyPublicationsGraphData, yearlyPatentsGraphData, faculty]);

  return (
    <PageContainer>
      <FacultyAdminMenu
        getCognitoUser={getCognitoUser}
        userName={userInfo.preferred_name || userInfo.first_name}
        userInfo={userInfo}
        toggleViewMode={toggleViewMode}
      />

      <main className="px-16 w-full overflow-auto py-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Faculty Admin</h1>
            <div className="text-lg text-gray-600 mt-2">
              <span className="font-semibold text-blue-600">{faculty}</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center w-full py-12">
            <div className="text-lg text-gray-600">Loading...</div>
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <AnalyticsCard title="Faculty Members" value={facultyUsers.length} />
              <AnalyticsCard title="Assistants" value={assistantUsers.length} />
              <AnalyticsCard title="CVs Generated" value={totalCVsGenerated} />
            </div>

            {/* Additional Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <AnalyticsCard
                title="Grant Funding"
                value={
                  totalGrantMoneyRaised >= 1000000
                    ? `$${(totalGrantMoneyRaised / 1000000).toFixed(1)}M`
                    : totalGrantMoneyRaised >= 1000
                    ? `$${(totalGrantMoneyRaised / 1000).toFixed(0)}K`
                    : `$${totalGrantMoneyRaised.toLocaleString()}`
                }
              />
              <AnalyticsCard title="Grants" value={grants.length} />
              <AnalyticsCard title="Publications" value={publications.length} />
              <AnalyticsCard title="Patents" value={patents.length} />
            </div>

            {/* Graph Carousel Section */}
            <div className="mb-8">
              <GraphCarousel graphs={graphsConfig} />
            </div>

          </>
        )}
      </main>
    </PageContainer>
  );
};

export default FacultyAdminHomePage;
