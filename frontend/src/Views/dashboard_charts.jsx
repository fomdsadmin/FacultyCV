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

// Register chart.js components and plugins
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, ChartDataLabels);

const Dashboard = ({ userInfo }) => {
  const [user, setUser] = useState(userInfo);
  const [publicationChartData, setPublicationChartData] = useState(null);
  const [fundingChartData, setFundingChartData] = useState(null);
  const [totalPublications, setTotalPublications] = useState(0);

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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
       top: 30, // increase this to push the chart down
       right: 25,
       left: 10,
       bottom: 10,
      },
    },
    plugins: {
      datalabels: {
        color: '#333',
        anchor: 'end',
        align: 'top',
        font: {
          weight: 'bold',
        },
        formatter: (value, context) => {
          const label = context.dataset.label || '';
          return label.includes('Funding') ? formatCAD(value) : value;
        },
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
          callback: function (value) {
            const label = this.chart.data.datasets[0].label;
            return label.includes('Funding') ? formatCAD(value) : value;
          },
        },
      },
    },
  };

  return (
    <div className="p-4">
      {user && (
        <div className="text-lg font-medium text-gray-700 mb-6">
          Total Published Papers: <span className="font-bold">{totalPublications}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 mb-10">
        {/* Publications Chart */}
        {publicationChartData && (
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold mb-2">Publications Over Time</h3>
            <div className="h-64">
              <Line data={publicationChartData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Funding Chart */}
        {fundingChartData && (
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold mb-2">Research Funding Over Time</h3>
            <div className="h-64">
              <Line data={fundingChartData} options={chartOptions} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
