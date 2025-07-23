import React, { useState, useEffect } from "react";
import PageContainer from "./PageContainer.jsx";
import DepartmentAdminMenu from "../Components/DepartmentAdminMenu.jsx";
import AnalyticsCard from "../Components/AnalyticsCard.jsx";
import { getUserCVData, getUserConnections, getAllSections } from "../graphql/graphqlHelpers.js";
import GraphCarousel from "../Components/GraphCarousel.jsx";
import { useLocation, useNavigate } from "react-router-dom";

const DepartmentAdminUserInsights = ({ user, department }) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [userCVData, setUserCVData] = useState({});
  const [userConnections, setUserConnections] = useState([]);
  const [dataSections, setDataSections] = useState([]);

  useEffect(() => {
    fetchSections();
  }, []);

  useEffect(() => {
    if (user && dataSections.length > 0) {
      fetchUserAnalytics(user);
    }
    // eslint-disable-next-line
  }, [user, dataSections]);

  async function fetchSections() {
    try {
      const sections = await getAllSections();
      setDataSections(sections);
    } catch (error) {
      console.error("Error fetching sections:", error);
    }
  }

  async function fetchUserAnalytics(user) {
    setLoading(true);
    try {
      const sectionIds = {
        Publications: dataSections.find((s) => s.title.includes("Publications") && !s.title.includes("Other"))?.data_section_id,
        OtherPublications: dataSections.find((s) => s.title.includes("Publications") && s.title.includes("Other"))?.data_section_id,
        Grants: dataSections.find((s) => s.title.includes("Research or Equivalent Grants"))?.data_section_id,
        Patents: dataSections.find((s) => s.title.includes("Patents"))?.data_section_id,
      };

      const publications = sectionIds.Publications ? await getUserCVData(user.user_id, sectionIds.Publications) : [];
      const otherPublications = sectionIds.OtherPublications ? await getUserCVData(user.user_id, sectionIds.OtherPublications) : [];
      const grants = sectionIds.Grants ? await getUserCVData(user.user_id, sectionIds.Grants) : [];
      const patents = sectionIds.Patents ? await getUserCVData(user.user_id, sectionIds.Patents) : [];

      // Combine regular publications and other publications
      const allPublications = [...publications, ...otherPublications];

      let grantMoneyRaised = [];
      for (const data of grants) {
        try {
          const dataDetails = JSON.parse(data.data_details);
          if (dataDetails.year && dataDetails.amount) {
            const amount = parseFloat(dataDetails.amount);
            const year = parseInt(dataDetails.year);
            // Only add grants with valid numeric amounts and years
            if (!isNaN(amount) && !isNaN(year) && amount > 0) {
              grantMoneyRaised.push({
                amount: amount,
                years: year,
              });
            }
          }
        } catch (error) {
          // ignore invalid data
        }
      }

      setUserCVData({
        publications: allPublications, // Now includes both regular and other publications
        grants,
        patents,
        grantMoneyRaised,
      });

      // Connections
      const connections = await getUserConnections(user.user_id, false);
      setUserConnections(connections);
    } catch (error) {
      console.error("Error fetching user analytics:", error);
    }
    setLoading(false);
  }

  // Graph data for grants
  const getGrantMoneyGraphData = () => {
    const data = [];
    const yearlyDataMap = new Map();
    (userCVData.grantMoneyRaised || []).forEach((grant) => {
      // Validate that both amount and years are valid numbers
      if (grant.amount && grant.years && !isNaN(grant.amount) && !isNaN(grant.years) && grant.amount > 0) {
        const year = grant.years;
        if (yearlyDataMap.has(year)) {
          yearlyDataMap.get(year).Funding += grant.amount;
        } else {
          yearlyDataMap.set(year, {
            date: year.toString(),
            Funding: grant.amount,
          });
        }
      }
    });
    yearlyDataMap.forEach((value) => data.push(value));
    data.sort((a, b) => parseInt(a.date) - parseInt(b.date));
    return data;
  };

  // Graph data for publications
  const getYearlyPublicationsGraphData = () => {
    const data = [];
    const yearlyDataMap = new Map();
    (userCVData.publications || []).forEach((publication) => {
      try {
        const dataDetails = JSON.parse(publication.data_details);
        const currentYear = new Date().getFullYear();
        const fiveYearsAgo = currentYear - 5;

        // Handle regular publications with year_published (same as Department Admin)
        if (dataDetails.year_published) {
          const year = parseInt(dataDetails.year_published);
          if (!isNaN(year) && year > fiveYearsAgo && year <= currentYear) {
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
        if (dataDetails.dates && typeof dataDetails.dates === 'string') {
          const dateParts = dataDetails.dates.split("-");
          if (dateParts.length > 1) {
            let yearPart = dateParts[1];
            if (yearPart && yearPart.includes(",")) {
              const yearCommaparts = yearPart.split(",");
              if (yearCommaparts.length > 1) {
                const year = parseInt(yearCommaparts[1].trim());
                if (!isNaN(year) && year > fiveYearsAgo && year <= currentYear) {
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
            if (!isNaN(year) && year > fiveYearsAgo && year <= currentYear) {
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
              dataDetails.years.forEach(yearValue => {
                const year = parseInt(yearValue);
                if (!isNaN(year) && year > fiveYearsAgo && year <= currentYear) {
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
              if (!isNaN(year) && year > fiveYearsAgo && year <= currentYear) {
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
        // ignore invalid data
      }
    });
    yearlyDataMap.forEach((value) => data.push(value));
    data.sort((a, b) => parseInt(a.year) - parseInt(b.year));
    return data;
  };

  // Summary cards for selected user
  const UserSummaryCards = () => {
    const pubCount = userCVData.publications ? userCVData.publications.length : 0;
    const grantCount = userCVData.grants ? userCVData.grants.length : 0;
    const patentCount = userCVData.patents ? userCVData.patents.length : 0;
    const totalFunding = (userCVData.grantMoneyRaised || [])
      .reduce((total, g) => {
        // Check if amount exists and is a valid number
        const amount = g && g.amount && !isNaN(g.amount) ? parseFloat(g.amount) : 0;
        return total + amount;
      }, 0);
    const Funding = totalFunding > 0 
      ? totalFunding.toLocaleString("en-US", { style: "currency", currency: "USD" })
      : "$0";
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <AnalyticsCard title="Publications" value={pubCount} />
        <AnalyticsCard title="Grants" value={grantCount} />
        <AnalyticsCard title="Patents" value={patentCount} />
        <AnalyticsCard title="Grant Funding" value={Funding} />
      </div>
    );
  };

  // Reusable graph container component (kept for compatibility if needed)
  const GraphContainer = ({ title, children }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-4 w-full h-full flex flex-col">
      <h3 className="text-lg font-semibold text-zinc-700 mb-6">{title}</h3>
      <div className="w-full flex-1 min-h-[350px]">{children}</div>
    </div>
  );

  // Graph configuration for the carousel
  const graphsConfig = () => {
    const graphs = [];

    // Grant funding graph (only if there's data)
    const grantData = getGrantMoneyGraphData();
    if (grantData.length > 0) {
      graphs.push({
        title: "Yearly Grant Funding",
        data: grantData,
        dataKey: "Funding",
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
    const publicationsData = getYearlyPublicationsGraphData();
    if (publicationsData.length > 0) {
      graphs.push({
        title: "Yearly Publications (Last 5 Years)",
        data: publicationsData,
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
  };

  return (
    <div className="py-4 px-12 bg-white rounded-lg shadow w-full">
      <h2 className="text-xl font-bold text-zinc-700 my-4">User Analytics</h2>
      {loading && (
        <div className="flex items-center justify-center w-full mt-8">
          <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
        </div>
      )}
      {!loading && user && (
        <>
          <UserSummaryCards />
          {/* Graph Carousel Section */}
          <div className="mt-8">
            <GraphCarousel graphs={graphsConfig()} />
          </div>
        </>
      )}
    </div>
  );
};

export default DepartmentAdminUserInsights;
