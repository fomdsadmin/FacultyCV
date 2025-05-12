import React, { useState, useEffect } from 'react';
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

// Register chart components and plugins
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, ChartDataLabels);

const Dashboard = ({ userInfo }) => {
  const [user, setUser] = useState(userInfo);
  const [chartData, setChartData] = useState(null);
  const [totalPublications, setTotalPublications] = useState(0);

  useEffect(() => {
    setUser(userInfo);
    const fetchCVData = async () => {
      try {
        const section_id = '1c23b9a0-b6b5-40b8-a4aa-f822d0567f09';
        const data = await getUserCVData(user.user_id, section_id);
        const parsedData = data.map(d => ({
          ...d,
          data_details: JSON.parse(d.data_details),
        }));

        // Extract year_published from data_details
        const yearCounts = {};
        let total = 0;
        parsedData.forEach(item => {
          const year = item.data_details?.year_published;
          if (year) {
            yearCounts[year] = (yearCounts[year] || 0) + 1;
            total++;
          }
        });

       console.log(yearCounts);
       setTotalPublications(total);
       console.log(total);
        const sortedYears = Object.keys(yearCounts).sort();
        console.log(sortedYears);
        const chart = {
          labels: sortedYears,
          datasets: [
            {
              label: 'Publications per Year',
              data: sortedYears.map(year => yearCounts[year]),
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
        };

        setChartData(chart);
      } catch (error) {
        console.error('Error fetching CV data:', error);
      }
    };

    if (user?.user_id) {
      fetchCVData();
    }
  }, [userInfo, user?.user_id]);

  return (
    <div className="p-4">
      {user && (
        <div className="text-lg font-medium text-gray-700 mb-6">
          Total Published Papers: <span className="font-bold">{totalPublications}</span>
        </div>
      )}

      {!user ? (
        <div>Loading user info...</div>
      ) : !chartData ? (
        <div>Loading chart...</div>
      ) : (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">Publications Over Time</h3>
          <Line
            data={chartData}
            options={{
              plugins: {
                datalabels: {
                  color: '#333',
                  anchor: 'end',
                  align: 'top',
                  font: {
                    weight: 'bold',
                  },
                  formatter: value => value,
                },
                legend: {
                  display: true,
                  position: 'bottom',
                  labels: {
                    font: {
                      size: 14,
                    },
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    stepSize: 1,
                  },
                },
              },
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
