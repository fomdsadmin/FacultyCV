import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { getAllSections, getUserCVData } from "../../graphql/graphqlHelpers";
import { Chart as ChartJS } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { WordCloudController, WordElement } from "chartjs-chart-wordcloud";
import AnalyticsCard from "../../Components/AnalyticsCard.jsx";
import GraphCarousel from "../../Components/GraphCarousel.jsx";

// Register word cloud plugin if not already registered
ChartJS.register(WordCloudController, WordElement, ChartDataLabels);

const Dashboard = ({ userInfo }) => {
  const [user, setUser] = useState(userInfo);
  const [loading, setLoading] = useState(false);
  const [publications, setPublications] = useState([]);
  const [grants, setGrants] = useState([]);
  const [totalPublications, setTotalPublications] = useState(0);
  const [totalGrants, setTotalGrants] = useState(0);
  const [keywordData, setKeywordData] = useState([]);
  const [showAllKeywords, setShowAllKeywords] = useState(false);
  const [renderWordCloud, setRenderWordCloud] = useState(false);
  const wordCloudCanvasRef = useRef(null);

  const formatCAD = (value) =>
    new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
    }).format(value);

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

  const fetchUserCVData = useCallback(async (dataSections) => {
    if (!userInfo?.user_id) return;

    try {
      // Find section IDs
      const publicationSectionId = dataSections.find(
        (section) => section.title.includes("Publication") && !section.title.includes("Other")
      )?.data_section_id;
      
      const otherPublicationSectionId = dataSections.find(
        (section) => section.title.includes("Publication") && section.title.includes("Other")
      )?.data_section_id;
      
      const secureFundingSectionId = dataSections.find((section) =>
        section.title.includes("Research or Equivalent Grants")
      )?.data_section_id;

      // Fetch data in parallel
      const [pubData, otherPubData, fundData] = await Promise.all([
        publicationSectionId ? getUserCVData(userInfo.user_id, publicationSectionId).catch(() => []) : [],
        otherPublicationSectionId ? getUserCVData(userInfo.user_id, otherPublicationSectionId).catch(() => []) : [],
        secureFundingSectionId ? getUserCVData(userInfo.user_id, secureFundingSectionId).catch(() => []) : []
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
  }, [userInfo]);

  // Memoized keyword computation
  const computedKeywordData = useMemo(() => {
    const keywordCounts = {};
    publications.forEach((pub) => {
      try {
        const details = JSON.parse(pub.data_details);
        const keywords = details.keywords || [];
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
    
    const sorted = Object.entries(keywordCounts)
      .map(([text, value]) => ({ text, value }))
      .filter((item) => item.value > 1) // Filter out keywords with count <= 1
      .sort((a, b) => b.value - a.value);
    return sorted;
  }, [publications]);

  // Memoized publication chart data
  const publicationChartData = useMemo(() => {
    const pubYearCounts = {};
    publications.forEach((pub) => {
      try {
        const details = JSON.parse(pub.data_details);
        
        // Handle regular publications with year_published
        if (details.year_published) {
          const year = parseInt(details.year_published);
          if (!isNaN(year) && year > 1900 && year <= new Date().getFullYear()) {
            pubYearCounts[year] = (pubYearCounts[year] || 0) + 1;
          }
        }
        
        // Handle other publications with dates field
        if (details.dates && typeof details.dates === 'string') {
          const dateParts = details.dates.split("-");
          if (dateParts.length > 1) {
            let yearPart = dateParts[1];
            if (yearPart && yearPart.includes(",")) {
              const yearCommaparts = yearPart.split(",");
              if (yearCommaparts.length > 1) {
                const year = parseInt(yearCommaparts[1].trim());
                if (!isNaN(year) && year > 1900 && year <= new Date().getFullYear()) {
                  pubYearCounts[year] = (pubYearCounts[year] || 0) + 1;
                }
              }
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
    const fundYearSums = {};
    grants.forEach((grant) => {
      try {
        const details = JSON.parse(grant.data_details);
        const year = details.year;
        const amount = parseFloat(details.amount || 0);
        if (year && amount && !isNaN(amount) && amount > 0) {
          const yearNum = parseInt(year);
          if (!isNaN(yearNum) && yearNum > 1900 && yearNum <= new Date().getFullYear() + 10) {
            fundYearSums[yearNum] = (fundYearSums[yearNum] || 0) + amount;
          }
        }
      } catch (error) {
        console.error("Error parsing grant data:", error, grant);
      }
    });

    const sortedYears = Object.keys(fundYearSums).sort();
    return {
      labels: sortedYears,
      datasets: [
        {
          label: "Funding Amount per Year (CAD)",
          data: sortedYears.map((year) => fundYearSums[year]),
          borderColor: "#7e57c2",
          backgroundColor: "rgba(126,87,194,0.2)",
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#7e57c2",
          pointBorderColor: "#fff",
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    };
  }, [grants]);

  // Total funding calculation
  const totalFunding = useMemo(() => {
    const total = grants.reduce((sum, grant) => {
      try {
        const details = JSON.parse(grant.data_details);
        const amount = parseFloat(details.amount || 0);
        return sum + (isNaN(amount) || amount <= 0 ? 0 : amount);
      } catch (error) {
        return sum;
      }
    }, 0);
    return formatCAD(total);
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
          Publications: publicationChartData.datasets[0].data[index]
        })),
        dataKey: "Publications",
        xAxisKey: "year",
        xAxisLabel: "Year",
        yAxisLabel: "Number of Publications",
        barColor: "#4bc0c0",
        showLegend: false,
        formatTooltip: (value, name) => [`${value} ${value === 1 ? 'Publication' : 'Publications'}`, name],
        formatYAxis: (value) => value.toString(),
        formatXAxis: (value) => value
      });
    }

    // Funding chart (only if there's data)
    if (fundingChartData.labels.length > 0) {
      graphs.push({
        title: "Research Funding Over Time",
        data: fundingChartData.labels.map((year, index) => ({
          year: year,
          Funding: fundingChartData.datasets[0].data[index]
        })),
        dataKey: "Funding",
        xAxisKey: "year",
        xAxisLabel: "Year",
        yAxisLabel: "Funding Amount (CAD)",
        barColor: "#7e57c2",
        showLegend: false,
        formatTooltip: (value, name) => [formatCAD(value), 'Research Funding (CAD)'],
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

    return graphs;
  }, [publicationChartData, fundingChartData]);

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
    <div className="max-w-7xl mx-auto">      
      <SummaryCards />
      
      {/* Graph Carousel Section */}
      <div className="mb-4 mr-4">
        <GraphCarousel graphs={graphsConfig} />
      </div>

      {/* Keywords Section */}
      <div className="mt-2">
        <div className="flex flex-col gap-2 p-2 rounded-lg shadow-md bg-zinc-50">
          <h2 className="text-lg font-semibold p-4">
            Keywords From Your Publications
          </h2>
          {keywordData.length > 0 && (
            <div className="flex-1 min-w-0 p-4">
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const sortedKeywords = [...keywordData].sort((a, b) => b.value - a.value);
                  const maxValue = Math.max(...sortedKeywords.map((k) => k.value || 0));
                  const displayKeywords = showAllKeywords ? sortedKeywords : sortedKeywords.slice(0, 10);

                  const keywordElements = displayKeywords.map((item, index) => {
                    const isMax = item.value === maxValue && maxValue > 0;
                    return (
                      <span
                        key={index}
                        className={`py-2 px-3 text-sm rounded-full ${
                          isMax
                            ? "bg-yellow-400 text-black font-bold"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        {item.text.toUpperCase()} {item.value !== 0 && `(${item.value})`}
                      </span>
                    );
                  });

                  if (sortedKeywords.length > 10) {
                    keywordElements.push(
                      <button
                        key="show-all-btn"
                        onClick={() => setShowAllKeywords(!showAllKeywords)}
                        className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition"
                      >
                        {showAllKeywords ? "Show Top 10" : "Show All"}
                      </button>
                    );
                  }

                  return keywordElements;
                })()}
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
    </div>
  );
};

export default Dashboard;
