import React, { useState, useEffect, useRef} from 'react';
import { getAllSections, getUserCVData } from '../../graphql/graphqlHelpers';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { WordCloudController, WordElement } from 'chartjs-chart-wordcloud';

// Register chart.js components and plugins
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, ChartDataLabels,WordCloudController,WordElement);

const Dashboard = ({ userInfo }) => {
  const [user, setUser] = useState(userInfo);
  const [publicationChartData, setPublicationChartData] = useState(null);
  const [fundingChartData, setFundingChartData] = useState(null);
  const [totalPublications, setTotalPublications] = useState(0);
  const [keywordData, setKeywordData] = useState(userInfo);
  const wordCloudCanvasRef = useRef(null);
  const [totalGrants, setTotalGrants] = useState(0);
  const [showAllKeywords, setShowAllKeywords] = useState(false);
  
  const formatCAD = (value) =>
    new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
    }).format(value);

  useEffect(() => {
    setUser(userInfo);

    const fetchData = async () => {
      try {
            let dataSections = [];
        try {
          dataSections = await getAllSections();
        } catch (error) {
          
        }
      
      const section1 = 'Publications';
      const section2 = "9b. Research or Equivalent Grants";

      const publicationSectionId = dataSections.find(section => section.title === section1)?.data_section_id;
      const secureFundingSectionId = dataSections.find(section => section.title.includes(section2))?.data_section_id;

      const pubSectionId = publicationSectionId;
        
      const pubData = await getUserCVData(user.user_id, pubSectionId);
      const parsedPubs = pubData.map((d) => ({
          ...d,
          data_details: JSON.parse(d.data_details),
        }));

        const keywordCounts = {};
        parsedPubs.forEach((item) => {
          const keywords = item.data_details?.keywords || [];
          keywords.forEach((kw) => {
            const lower = kw.toLowerCase();
            keywordCounts[lower] = (keywordCounts[lower] || 0) + 1;
          });
        });

        const wordCloudData = Object.entries(keywordCounts)
          .map(([text, value]) => ({ text, value }))
          .filter((item) => item.value > 1); // Filter out keywords with count <= 1
        setKeywordData(wordCloudData);

        const pubYearCounts = {};
        let pubTotal = 0;
        parsedPubs.forEach((item) => {
          const year = item.data_details?.year_published;
          if (year) {
            pubYearCounts[year] = (pubYearCounts[year] || 0) + 1;
            pubTotal++;
          }
        });

        const sortedPubYears = Object.keys(pubYearCounts).sort();
        setTotalPublications(pubTotal);

        setPublicationChartData({
          labels: sortedPubYears,
          datasets: [
            {
              label: "Publications per Year",
              data: sortedPubYears.map((year) => pubYearCounts[year]),
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
        });

        const fundSectionId = secureFundingSectionId;
        const fundData = await getUserCVData(user.user_id, fundSectionId);
        const parsedFunds = fundData.map((d) => ({
          ...d,
          data_details: JSON.parse(d.data_details),
        }));
        setTotalGrants(parsedFunds.length);

        const fundYearSums = {};
        parsedFunds.forEach((item) => {
          const year = item.data_details?.year;
          const amount = parseFloat(item.data_details?.amount || 0);
          if (year && amount) {
            fundYearSums[year] = (fundYearSums[year] || 0) + amount;
          }
        });
        const sortedFundYears = Object.keys(fundYearSums).sort();

        setFundingChartData({
          labels: sortedFundYears,
          datasets: [
            {
              label: "Funding Amount per Year (CAD)",
              data: sortedFundYears.map((year) => fundYearSums[year]),
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
        });
      } catch (error) {
        console.error("Error fetching CV data:", error);
      }
    };

    if (user?.user_id) {
      fetchData();
    }
  }, [userInfo, user?.user_id]);

  useEffect(() => {
    if (!wordCloudCanvasRef.current || keywordData.length === 0) return;

    const container = wordCloudCanvasRef.current.parentElement;
    const containerWidth = container.offsetWidth;
    const containerHeight = 500;

    // Set canvas dimensions
    wordCloudCanvasRef.current.width = containerWidth;
    wordCloudCanvasRef.current.height = containerHeight;
    wordCloudCanvasRef.current.style.width = `${containerWidth}px`;
    wordCloudCanvasRef.current.style.height = `${containerHeight}px`;

    // Calculate font sizes - much more conservative
    const maxValue = Math.max(...keywordData.map((d) => d.value));
    const minValue = Math.min(...keywordData.map((d) => d.value));
    const numKeywords = keywordData.length;

    // Much smaller font sizes to ensure fitting
    let baseSize = Math.max(10, Math.min(16, containerWidth / 40));
    let maxSize = Math.max(baseSize * 1.2, Math.min(24, containerWidth / 25));
    let minSize = Math.max(8, baseSize * 0.8);

    // Adjust based on number of keywords
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
              const ratio =
                maxValue === minValue
                  ? 1
                  : (d.value - minValue) / (maxValue - minValue);
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
            top: 60, // Increased padding significantly
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
            padding: 5, // Fixed padding
            rotation: () => 0, // No rotation to prevent edge issues
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
  }, [keywordData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    fitToHeight: true,
    fitToWidth: true,
    layout: {
      padding: {
        top: 10, // increase this to push the chart down
        right: 10,
        left: 10,
        bottom: 10,
      },
    },
    plugins: {
      datalabels: {
        color: "#333",
        anchor: "end",
        align: "top",
        font: {
          weight: "bold",
        },
        formatter: (value, context) => {
          const label = context.dataset.label || "";
          return label.includes("Funding") ? formatCAD(value) : value;
        },
      },
      legend: {
        display: true,
        position: "bottom",
        labels: {
          font: {
            size: 12,
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            const label = this.chart.data.datasets[0].label;
            return label.includes("Funding") ? formatCAD(value) : value;
          },
        },
      },
    },
  };

  return (
    <div>
      <div className="p-2 rounded-lg shadow-md bg-zinc-50">
        <div className="flex flex-col md:flex-row gap-6 mb-10 mt-8">
          {/* Publications Chart */}
          {publicationChartData && (
            <div className="flex-1 min-w-0 flex flex-col items-center">
              <h3 className="text-lg font-semibold mb-4 text-center">
                Publications Over Time
              </h3>
              <div className="h-64 w-full">
                <Line data={publicationChartData} options={chartOptions} />
              </div>
              <div className="text-md font-medium text-gray-700 text-center">
                Total Published Papers:{" "}
                <span className="font-bold">{totalPublications}</span>
              </div>
            </div>
          )}

          {/* Funding Chart */}
          {fundingChartData && (
            <div className="flex-1 min-w-0 flex flex-col items-center">
              <h3 className="text-lg font-semibold mb-4 text-center">
                Research Funding Over Time
              </h3>
              <div className="h-64 w-full">
                <Line data={fundingChartData} options={chartOptions} />
              </div>
              <div className="text-md font-medium text-gray-700 text-center">
                Total Grants: <span className="font-bold">{totalGrants}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Keywords Section */}
      <h3 className="text-lg font-semibold mb-2 mt-10">
        Keywords From Publications
      </h3>
      <div className="flex flex-col gap-6 p-2 rounded-lg shadow-md bg-zinc-50">
        {keywordData.length > 0 && (
          <div className="flex-1 min-w-0 p-4">
            <div className="">
              <div className="flex flex-wrap gap-3">
                {(() => {
                  const sortedKeywords = [...keywordData].sort(
                    (a, b) => b.value - a.value
                  );
                  const maxValue = Math.max(
                    ...sortedKeywords.map((k) => k.value || 0)
                  );
                  const displayKeywords = showAllKeywords
                    ? sortedKeywords
                    : sortedKeywords.slice(0, 10);

                  const keywordElements = displayKeywords.map((item, index) => {
                    const isMax = item.value === maxValue && maxValue > 0;
                    return (
                      <span
                        key={index}
                        className={`py-2 px-3 text-sm rounded-full ${
                          isMax
                            ? "bg-yellow-400 text-black font-bold" // highlighted
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        {item.text} {item.value !== 0 && `(${item.value})`}
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
          </div>
        )}

        {keywordData.length > 0 && (
          <div className="flex-1 min-w-0 p-4 mb-4 mt-[-3vh]">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;