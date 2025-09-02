import React, { useState, useEffect, useMemo, useCallback } from "react";
import PageContainer from "./PageContainer.jsx";
import FacultyAdminMenu from "../Components/FacultyAdminMenu.jsx";
import AnalyticsCard from "../Components/AnalyticsCard.jsx";
import GraphCarousel from "../Components/GraphCarousel.jsx";
import {
  getAllSections,
  getNumberOfGeneratedCVs,
  getFacultyWideCVData,
} from "../graphql/graphqlHelpers.js";

const FacultyAdminHomePage = ({ userInfo, getCognitoUser, toggleViewMode }) => {
  const [loading, setLoading] = useState(true);
  const [faculty, setFaculty] = useState("");
  const [userCounts, setUserCounts] = useState({
    total_count: 0,
    faculty_count: 0,
    assistant_count: 0,
    dept_admin_count: 0,
    admin_count: 0,
    faculty_admin_count: 0,
  });
  const [publications, setPublications] = useState([]);
  const [grants, setGrants] = useState([]);
  const [patents, setPatents] = useState([]);
  const [grantMoneyRaised, setGrantMoneyRaised] = useState([]);
  // const [totalCVsGenerated, setTotalCVsGenerated] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        let userCounts = {};
        if (userInfo.role === "Admin") {
          setFaculty("All");
        } else if (userInfo.role.startsWith("FacultyAdmin-")) {
          // FacultyAdmin can only see users in their faculty
          const facultyName = userInfo.role.split("FacultyAdmin-")[1];
          setFaculty(facultyName);
        }
        // Fetch CV data and other metrics
        await fetchCVDataAndMetrics();
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

  const fetchCVDataAndMetrics = useCallback(async () => {
    try {
      // Get CV sections and generated CVs count
      const [dataSections, generatedCVs] = await Promise.all([
        getAllSections(),
        // userInfo.role === "Admin" ? getNumberOfGeneratedCVs() : getNumberOfGeneratedCVs(faculty),
      ]);

      // setTotalCVsGenerated(generatedCVs);

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

      // Use getDepartmentCVData for efficient faculty-wide data fetching
      const promises = [];

      if (publicationSectionId) {
        promises.push(
          getFacultyWideCVData(publicationSectionId, faculty, "Publication")
            .then((response) => ({ type: "publication", data: response.data }))
            .catch(() => ({ type: "publication", data: [] }))
        );
      }

      if (otherPublicationSectionId) {
        promises.push(
          getFacultyWideCVData(otherPublicationSectionId, faculty, "Other Publication")
            .then((response) => ({ type: "otherPublication", data: response.data }))
            .catch(() => ({ type: "otherPublication", data: [] }))
        );
      }

      if (secureFundingSectionId) {
        promises.push(
          getFacultyWideCVData(secureFundingSectionId, faculty, "Grant")
            .then((response) => ({ type: "grant", data: response.data }))
            .catch(() => ({ type: "grant", data: [] }))
        );
      }

      if (patentSectionId) {
        promises.push(
          getFacultyWideCVData(patentSectionId, faculty, "Patent")
            .then((response) => ({ type: "patent", data: response.data }))
            .catch(() => ({ type: "patent", data: [] }))
        );
      }

      // Execute all promises in parallel
      const results = await Promise.all(promises);

      // Process results
      const publicationsData = [];
      const otherPublicationsData = [];
      const grantsData = [];
      const patentsData = [];

      results.forEach((result) => {
        switch (result.type) {
          case "publication":
            // Convert CVData format to the expected format
            publicationsData.push(
              ...result.data.map((item) => ({
                data_section_id: item.data_section_id,
                data_details:
                  typeof item.data_details === "string" ? item.data_details : JSON.stringify(item.data_details),
              }))
            );
            break;
          case "otherPublication":
            otherPublicationsData.push(
              ...result.data.map((item) => ({
                data_section_id: item.data_section_id,
                data_details:
                  typeof item.data_details === "string" ? item.data_details : JSON.stringify(item.data_details),
              }))
            );
            break;
          case "grant":
            grantsData.push(
              ...result.data.map((item) => ({
                data_section_id: item.data_section_id,
                data_details:
                  typeof item.data_details === "string" ? item.data_details : JSON.stringify(item.data_details),
              }))
            );
            break;
          case "patent":
            patentsData.push(
              ...result.data.map((item) => ({
                data_section_id: item.data_section_id,
                data_details:
                  typeof item.data_details === "string" ? item.data_details : JSON.stringify(item.data_details),
              }))
            );
            break;
          case "default":
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
  }, [faculty, userInfo?.role]);

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

          if (dateString.includes(" - ")) {
            // Date range format: "July, 2008 - June, 2011"
            // Extract the end date (second part after ' - ')
            const endDate = dateString.split(" - ")[1].trim();
            if (endDate.includes(",")) {
              // Format: "June, 2011"
              year = endDate.split(",")[1].trim();
            } else {
              // Fallback: try to extract year from end of string
              const yearMatch = endDate.match(/\d{4}/);
              year = yearMatch ? yearMatch[0] : null;
            }
          } else {
            // Single date format: "July, 2008"
            if (dateString.includes(",")) {
              // Format: "July, 2008"
              year = dateString.split(",")[1].trim();
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

  // Since data is already filtered by faculty in getFacultyWideCVData, no need for frontend filtering
  const filteredPublications = publications;
  const filteredGrants = grants;
  const filteredPatents = patents;
  const filteredGrantMoney = grantMoneyRaised;

  const totalGrantMoneyRaised = useMemo(
    () =>
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

    // Use filtered grant money data based on faculty
    filteredGrantMoney.forEach((grant) => {
      // Add guards to ensure valid data
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

    // Use filtered publications based on faculty
    filteredPublications.forEach((publication) => {
      try {
        const dataDetails = JSON.parse(publication.data_details);

        // Handle publications with end_date field
        if (dataDetails.end_date) {
          let year;
          const endDateString = dataDetails.end_date.trim();

          if (endDateString.includes(" ")) {
            // Format: "June 2019" - extract the year part
            const parts = endDateString.split(" ");
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
  }, [grantMoneyGraphData, yearlyPublicationsGraphData, yearlyPatentsGraphData, faculty]);

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
              <AnalyticsCard
                title="Faculty Members"
                value={(userCounts.faculty_count + userCounts.faculty_admin_count).toLocaleString()}
              />
              <AnalyticsCard title="Delegates" value={userCounts.assistant_count.toLocaleString()} />
              {/* <AnalyticsCard title="CVs Generated" value={totalCVsGenerated.toLocaleString()} /> */}
            </div>

            {/* Additional Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <AnalyticsCard
                title="Grant Funding"
                value={
                  totalGrantMoneyRaised >= 1000000
                    ? `${(totalGrantMoneyRaised / 1000000).toFixed(1)}M`
                    : totalGrantMoneyRaised >= 1000
                    ? `${(totalGrantMoneyRaised / 1000).toFixed(0)}K`
                    : `${totalGrantMoneyRaised.toLocaleString()}`
                }
              />
              <AnalyticsCard title="Grants" value={grants.length.toLocaleString()} />
              <AnalyticsCard title="Publications" value={publications.length.toLocaleString()} />
              <AnalyticsCard title="Patents" value={patents.length.toLocaleString()} />
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
