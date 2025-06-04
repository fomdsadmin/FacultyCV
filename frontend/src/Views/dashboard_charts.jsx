import React, { useState, useEffect, useRef } from 'react';
import { getUserCVData } from '../graphql/graphqlHelpers';
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

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, ChartDataLabels, WordCloudController, WordElement);

const Dashboard = ({ userInfo }) => {
  const [user, setUser] = useState(userInfo);
  const [publicationChartData, setPublicationChartData] = useState(null);
  const [fundingChartData, setFundingChartData] = useState(null);
  const [totalPublications, setTotalPublications] = useState(0);
  const [keywordData, setKeywordData] = useState([]);
  const [showAllKeywords, setShowAllKeywords] = useState(false);
  const wordCloudCanvasRef = useRef(null);

  const formatCAD = value =>
    new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(value);

  useEffect(() => {
    setUser(userInfo);

    const fetchData = async () => {
      try {
        const pubSectionId = '1c23b9a0-b6b5-40b8-a4aa-f822d0567f09';
        const pubData = await getUserCVData(user.user_id, pubSectionId);
        const parsedPubs = pubData.map(d => ({
          ...d,
          data_details: JSON.parse(d.data_details),
        }));

        const keywordCounts = {};
        parsedPubs.forEach(item => {
          const keywords = item.data_details?.keywords || [];
          keywords.forEach(kw => {
            const lower = kw.toLowerCase();
            keywordCounts[lower] = (keywordCounts[lower] || 0) + 1;
          });
        });

        const wordCloudData = Object.entries(keywordCounts)
          .map(([text, value]) => ({ text, value }))
          .filter(item => item.value);
        setKeywordData(wordCloudData);

        const pubYearCounts = {};
        let pubTotal = 0;
        parsedPubs.forEach(item => {
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
              label: 'Publications per Year',
              data: sortedPubYears.map(year => pubYearCounts[year]),
              borderColor: '#4bc0c0',
              backgroundColor: 'rgba(75,192,192,0.2)',
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#4bc0c0',
              pointBorderColor: '#fff',
              pointRadius: 5,
              pointHoverRadius: 7,
            },
          ],
        });

        const fundSectionId = '26939d15-7ef9-46f6-9b49-22cf95074e88';
        const fundData = await getUserCVData(user.user_id, fundSectionId);
        const parsedFunds = fundData.map(d => ({
          ...d,
          data_details: JSON.parse(d.data_details),
        }));

        const fundYearSums = {};
        parsedFunds.forEach(item => {
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
              label: 'Funding Amount per Year (CAD)',
              data: sortedFundYears.map(year => fundYearSums[year]),
              borderColor: '#7e57c2',
              backgroundColor: 'rgba(126,87,194,0.2)',
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#7e57c2',
              pointBorderColor: '#fff',
              pointRadius: 5,
              pointHoverRadius: 7,
            },
          ],
        });
      } catch (error) {
        console.error('Error fetching CV data:', error);
      }
    };

    if (user?.user_id) {
      fetchData();
    }
  }, [userInfo, user?.user_id]);

  useEffect(() => {
    if (!wordCloudCanvasRef.current || keywordData.length === 0) return;
    const maxValue = Math.max(...keywordData.map(d => d.value));
    const chart = new ChartJS(wordCloudCanvasRef.current, {
      type: 'wordCloud',
      data: {
        labels: keywordData.map(d => d.text),
        datasets: [
          {
            label: 'Keywords',
            data: keywordData.map(d => 3 + d.value * 3),
          },
        ],
      },
      options: {
        plugins: {
          tooltip: { enabled: false },
          datalabels: { display: false },
        },
        elements: {
          word: {
            color: (ctx) => {
              const label = ctx.element?.text;
              const wordObj = keywordData.find(d => d.text === label);
              const isMax = wordObj && wordObj.value === maxValue;
              return isMax ? '#facc15' : '#000000';
            },
            padding: 10,
            rotation: 0,
          },
        },
      },
    });
    return () => chart.destroy();
  }, [keywordData]);

  const sortedKeywords = [...keywordData].sort((a, b) => b.value - a.value);
  const displayLimit = 20;
  const visibleKeywords = showAllKeywords ? sortedKeywords : sortedKeywords.slice(0, displayLimit);

  return (
    <div className="dashboard">
      {/* Publication Chart, Funding Chart, etc. */}

      {keywordData.length > 0 && (
        <div className="flex-1 min-w-0">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Keywords From Publications</h3>
            <div className="flex flex-wrap gap-2">
              {visibleKeywords.map((item, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-sm bg-gray-200 rounded-full text-gray-800"
                >
                  {item.text} {item.value !== 0 && `(${item.value})`}
                </span>
              ))}
            </div>
            {keywordData.length > displayLimit && (
              <button
                onClick={() => setShowAllKeywords(!showAllKeywords)}
                className="mt-2 text-blue-600 hover:underline text-sm"
              >
                {showAllKeywords ? 'Show Less' : `Show All (${keywordData.length})`}
              </button>
            )}
          </div>
          <div style={{ width: '100%', height: '500px' }}>
            <canvas ref={wordCloudCanvasRef} style={{ width: '100%', height: '100%' }}></canvas>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
