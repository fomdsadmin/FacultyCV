import React, { useState, useEffect, useMemo, useCallback } from "react";
import { getAllSections, getUserCVData } from "../../graphql/graphqlHelpers";
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import AnalyticsCard from "../../Components/AnalyticsCard.jsx";
import GraphCarousel from "../../Components/GraphCarousel.jsx";
import KeywordsSection from "./KeywordsSection.jsx";

// Register all Chart.js components including scales
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels
);

const DashboardCharts = ({ userInfo }) => {
  const [user, setUser] = useState(userInfo);
  const [loading, setLoading] = useState(false);
  const [publications, setPublications] = useState([]);
  const [grants, setGrants] = useState([]);
  const [totalPublications, setTotalPublications] = useState(0);
  const [totalGrants, setTotalGrants] = useState(0);

  // Consolidated data loading
  useEffect(() => {
    setUser(userInfo);
    if (userInfo?.user_id) {
      loadAllData();
    }
  }, [userInfo]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const dataSections = await getAllSections();
      await fetchUserCVData(dataSections);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  const fetchUserCVData = useCallback(
    async (dataSections) => {
      if (!userInfo?.user_id) return;

      try {
        // Find section IDs
        const publicationSectionId = dataSections.find(
          (section) => section.title.includes("Publications") && !section.title.includes("Other")
        )?.data_section_id;

        const otherPublicationSectionId = dataSections.find(
          (section) => section.title.includes("Publications") && section.title.includes("Other")
        )?.data_section_id;

        const secureFundingSectionId = dataSections.find((section) =>
          section.title.includes("Research or Equivalent Grants and Contracts")
        )?.data_section_id;

        // Fetch data in parallel
        const [pubData, otherPubData, fundData] = await Promise.all([
          publicationSectionId ? getUserCVData(userInfo.user_id, publicationSectionId).catch(() => []) : [],
          otherPublicationSectionId ? getUserCVData(userInfo.user_id, otherPublicationSectionId).catch(() => []) : [],
          secureFundingSectionId ? getUserCVData(userInfo.user_id, secureFundingSectionId).catch(() => []) : [],
        ]);

        // Process publications data
        const allPublications = [...pubData, ...otherPubData];
        setPublications(allPublications);
        setTotalPublications(allPublications.length);

        // Process grants data
        setGrants(fundData);
        setTotalGrants(fundData.length);
      } catch (error) {
        console.error("Error fetching CV data:", error);
      }
    },
    [userInfo]
  );

  // Memoized publication chart data
  const publicationChartData = useMemo(() => {
    const pubYearCounts = {};
    publications.forEach((pub) => {
      try {
        const details = JSON.parse(pub.data_details);

        // Handle other publications with dates field
        if (details.end_date && typeof details.end_date === "string") {
          const dateParts = details.end_date.trim().split(/\s+/); // Split by one or more whitespace
          if (dateParts.length >= 1) {
            const yearPart = dateParts[dateParts.length - 1]; // Take the last part as year
            const year = parseInt(yearPart);
            if (!isNaN(year) && year > 1900 && year <= new Date().getFullYear()) {
              pubYearCounts[year] = (pubYearCounts[year] || 0) + 1;
            }
          }
        }
      } catch (error) {
        console.error("Error parsing publication data:", error, pub);
      }
    });

    const sortedYears = Object.keys(pubYearCounts).sort();
    return {
      labels: sortedYears,
      datasets: [
        {
          label: "Publications per Year",
          data: sortedYears.map((year) => pubYearCounts[year]),
          borderColor: "#4bc0c0",
          backgroundColor: "rgba(75,192,192,0.2)",
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#4bc0c0",
          pointBorderColor: "#fff",
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    };
  }, [publications]);

  // Memoized funding chart data
  const fundingChartData = useMemo(() => {
    const fundYearData = {};
    
    grants.forEach((grant) => {
      try {
        const details = JSON.parse(grant.data_details);
        const amount = parseFloat(details.amount || 0);
        const type = details.type ? details.type.trim() : '';

        // Determine funding category
        let category = 'grants';
        if (type === 'All Types Contract') {
          category = 'contracts';
        }

        // Handle dates field which can be "January 2021 - February 2021" or "January 2021"
        if (details.dates && typeof details.dates === "string") {
          const dateStr = details.dates.trim();
          let year = null;

          if (dateStr.includes("-")) {
            // Format: "January 2021 - February 2021"
            // Extract year from the first date part
            const firstDatePart = dateStr.split("-")[0].trim();
            const yearMatch = firstDatePart.match(/\b(\d{4})\b/);
            if (yearMatch) {
              year = parseInt(yearMatch[1]);
            }
          } else {
            // Format: "January 2021"
            // Extract year directly
            const yearMatch = dateStr.match(/\b(\d{4})\b/);
            if (yearMatch) {
              year = parseInt(yearMatch[1]);
            }
          }

          // Add amount and count to the year if valid
          if (year && !isNaN(year) && year > 1900 && year <= new Date().getFullYear() + 10) {
            if (!fundYearData[year]) {
              fundYearData[year] = {
                grants: { amount: 0, count: 0 },
                contracts: { amount: 0, count: 0 }
              };
            }
            // Always count the item, but only add amount if it's valid and > 0
            fundYearData[year][category].count += 1;
            if (amount && !isNaN(amount) && amount > 0) {
              fundYearData[year][category].amount += amount;
            }
          }
        }

        // Fallback: Handle year field directly if dates field is not available
        if (!details.dates && details.year) {
          const yearNum = parseInt(details.year);
          if (yearNum && !isNaN(yearNum) && yearNum > 1900 && yearNum <= new Date().getFullYear() + 10) {
            if (!fundYearData[yearNum]) {
              fundYearData[yearNum] = {
                grants: { amount: 0, count: 0 },
                contracts: { amount: 0, count: 0 }
              };
            }
            // Always count the item, but only add amount if it's valid and > 0
            fundYearData[yearNum][category].count += 1;
            if (amount && !isNaN(amount) && amount > 0) {
              fundYearData[yearNum][category].amount += amount;
            }
          }
        }
      } catch (error) {
        console.error("Error parsing grant data:", error, grant);
      }
    });

    const sortedYears = Object.keys(fundYearData).sort();
    return {
      labels: sortedYears,
      fundYearData: fundYearData, // Store for tooltip formatting
      datasets: [
        {
          label: "Research Grants",
          data: sortedYears.map((year) => fundYearData[year]?.grants?.amount || 0),
          backgroundColor: "#7e57c2",
          borderColor: "#7e57c2",
          borderWidth: 1,
        },
        {
          label: "Contract Funding",
          data: sortedYears.map((year) => fundYearData[year]?.contracts?.amount || 0),
          backgroundColor: "#4bc0c0",
          borderColor: "#4bc0c0",
          borderWidth: 1,
        },
      ],
    };
  }, [grants]);

  // Total funding calculation
  const totalFunding = useMemo(() => {
    const total = grants.reduce((sum, grant) => {
      try {
        const details = JSON.parse(grant.data_details);
        const amount = parseInt(details.amount || 0);
        return sum + (isNaN(amount) || amount <= 0 ? 0 : amount);
      } catch (error) {
        return sum;
      }
    }, 0);
    
    // Format the total as currency
    if (total >= 1000000) {
      return `$${(total / 1000000).toFixed(1)}M`;
    } else if (total >= 1000) {
      return `$${(total / 1000).toFixed(0)}K`;
    }
    return `$${total.toLocaleString()}`;
  }, [grants]);

  // Memoized graphs configuration for the carousel
  const graphsConfig = useMemo(() => {
    const graphs = [];

    // Publications chart (only if there's data)
    if (publicationChartData.labels.length > 0) {
      graphs.push({
        title: "Publications Over Time",
        data: publicationChartData.labels.map((year, index) => ({
          year: year,
          Publications: publicationChartData.datasets[0].data[index],
        })),
        dataKey: "Publications",
        xAxisKey: "year",
        xAxisLabel: "Year",
        yAxisLabel: "Number of Publications",
        barColor: "#4bc0c0",
        showLegend: false,
        formatTooltip: (value, name) => [`${value} ${value === 1 ? "Publication" : "Publications"}`, name],
        formatYAxis: (value) => value.toString(),
        formatXAxis: (value) => value,
      });
    }

    // Funding chart (only if there's data)
    if (fundingChartData.labels.length > 0) {
      graphs.push({
        title: "Research Funding Over Time",
        data: fundingChartData.labels.map((year, index) => ({
          year: year,
          "Research Grants": fundingChartData.datasets[0].data[index],
          "Contract Funding": fundingChartData.datasets[1].data[index],
          // Include count data for tooltips
          grantsCount: fundingChartData.fundYearData[year]?.grants?.count || 0,
          contractsCount: fundingChartData.fundYearData[year]?.contracts?.count || 0,
        })),
        dataKeys: ["Research Grants", "Contract Funding"],
        xAxisKey: "year",
        xAxisLabel: "Year",
        yAxisLabel: "Funding Amount (CAD)",
        barColors: ["#7e57c2", "#4bc0c0"],
        showLegend: true,
        isMultiBar: true,
        formatTooltip: (value, name, props) => {
          const payload = props?.payload;
          let count = 0;
          
          if (name === "Research Grants") {
            count = payload?.grantsCount || 0;
          } else if (name === "Contract Funding") {
            count = payload?.contractsCount || 0;
          }
          
          const formattedValue = (() => {
            if (value >= 1000000) {
              return `$${(value / 1000000).toFixed(1)}M`;
            } else if (value >= 1000) {
              return `$${(value / 1000).toFixed(0)}K`;
            }
            return `$${value.toLocaleString()}`;
          })();
          
          return [`${formattedValue} (${count} ${count === 1 ? 'item' : 'items'})`, name];
        },
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

    return graphs;
  }, [publicationChartData, fundingChartData]);

  // Summary Cards Component
  const SummaryCards = () => (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-2 mb-2 mt-2">
      <AnalyticsCard title="Total Publications" value={totalPublications} />
      <AnalyticsCard title="Total Grants" value={totalGrants} />
      <AnalyticsCard title="Total Funding" value={totalFunding} />
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full mt-16">
        <div className="text-lg text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto">
      <SummaryCards />

      {/* Graph Carousel Section */}
      <div className="mb-4 mr-4">
        <GraphCarousel graphs={graphsConfig} />
      </div>

      {/* Keywords Section */}
      <KeywordsSection publications={publications} />
    </div>
  );
};

export default DashboardCharts;
