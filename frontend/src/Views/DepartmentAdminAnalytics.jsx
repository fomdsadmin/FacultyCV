import React, { useState, useEffect } from 'react';
import PageContainer from './PageContainer.jsx';
import DepartmentAdminMenu from '../Components/DepartmentAdminMenu.jsx';
import AnalyticsCard from '../Components/AnalyticsCard.jsx';
import { getAllUsers, getUserCVData, getAllUniversityInfo, getUserConnections, getAllSections, getNumberOfGeneratedCVs } from '../graphql/graphqlHelpers.js';
import { formatDateToLongString } from '../utils/time.js';
import { LineGraph } from '../Components/LineGraph.jsx';
import BarChartComponent from '../Components/BarChart.jsx';


const DepartmentAdminAnalytics = ({ getCognitoUser, userInfo, department }) => {
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


  const TIME_RANGE = 50;

  useEffect(() => {
    fetchUsers();
    fetchGeneratedCVs();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const users = await getAllUsers();
      const filteredFacultyUsers = users.filter(user => user.role === 'Faculty' && (user.primary_department === department || user.secondary_department === department));
      const filteredAssistantUsers = users.filter(user => user.role === 'Assistant' && (user.primary_department === department || user.secondary_department === department));
      const facultyTimestamps = filteredFacultyUsers
                                .map(user => new Date(user.joined_timestamp))
                                .sort((a, b) => a - b)
                                .map(timestamp => {
                                  timestamp.setHours(0, 0, 0, 0);
                                  return timestamp;
                                });
      const allTimestamps = users.map(user => new Date(user.joined_timestamp))
                            .sort((a, b) => a - b)
                            .map(timestamp => {
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
      console.error('Error fetching users:', error);
    }
    setLoading(false);
  }

  async function fetchGeneratedCVs() {
    setLoading(true);
    try {
      const generatedCVs = await getNumberOfGeneratedCVs(department);
      setTotalCVsGenerated(generatedCVs);
    } catch (error) {
      console.error('Error fetching generated CVs:', error);
    }
    setLoading(false);
  }


  async function fetchAllUserCVData(users) {
    setLoading(true);
    let dataSections = [];
    try {
      dataSections = await getAllSections();
    } catch (error) {
      console.error('Error fetching data sections:', error);
    }

    const publicationSectionId = dataSections.find(section => section.title === 'Publications')?.data_section_id;
    const secureFundingSectionId = dataSections.find(section => section.title === 'Secure Funding')?.data_section_id;
    const patentSectionId = dataSections.find(section => section.title === 'Patents')?.data_section_id;

    let publicationsData = [];
    let grantsData = [];
    let patentsData = [];

    for (const user of users) {
      try {
        const fetchedPublications = await getUserCVData(user.user_id, publicationSectionId);
        publicationsData = [...publicationsData, ...fetchedPublications];
      } catch (error) {
        console.error('Error fetching publications:', error);
      }
      try {
        const fetchedGrants = await getUserCVData(user.user_id, secureFundingSectionId);
        grantsData = [...grantsData, ...fetchedGrants];
      } catch (error) {
        console.error('Error fetching grants:', error);
      }
      try {
        const fetchedPatents = await getUserCVData(user.user_id, patentSectionId);
        patentsData = [...patentsData, ...fetchedPatents];
      } catch (error) {
        console.error('Error fetching patents:', error);
      }
    }


    let totalGrantMoneyRaised = [];


    for (const data of grantsData) {
      try {
          const dataDetails = JSON.parse(data.data_details);
          if (dataDetails.year) {
              totalGrantMoneyRaised.push({ amount: parseInt(dataDetails.amount), user_id: data.user_id, years: parseInt(dataDetails.year) });
          } else {
              console.warn(`Missing dates field in grant data at index ${grantsData.indexOf(data)}`);
          }
      } catch (error) {
          console.error('Error parsing grant data:', error);
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
        console.error('Error fetching connections:', error);
      }
    }
    setFacultyConnections(connections);
    setLoading(false);
  }

  const filteredPublications = publications.filter(publication => 
    facultyUsers.some(user => user.user_id === publication.user_id)
  );

  const filteredGrants = grants.filter(grant => 
    facultyUsers.some(user => user.user_id === grant.user_id)
  );

  const filteredPatents = patents.filter(patent => 
    facultyUsers.some(user => user.user_id === patent.user_id)
  );

  const totalGrantMoneyRaised = grantMoneyRaised.reduce((total, grant) => total + grant.amount, 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const getGraphData = () => {
    const data = [];
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);
    const startDate = new Date(endDate);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - TIME_RANGE);
  
    // Create a map to aggregate user counts by month
    const monthlyDataMap = new Map();
  
    facultyUserTimestamps.forEach(timestamp => {
      if (timestamp >= startDate && timestamp <= endDate) {
        const monthKey = `${timestamp.getFullYear()}-${timestamp.getMonth()}`; // e.g., "2024-9" for Oct 2024
        const formattedDate = timestamp.toLocaleString('default', { month: 'short', year: 'numeric' });
  
        if (monthlyDataMap.has(monthKey)) {
          monthlyDataMap.get(monthKey).Users += 1;
        } else {
          monthlyDataMap.set(monthKey, {
            date: formattedDate,
            Users: 1
          });
        }
      }
    });
  
    // Add data points for each month even if there are no users
    for (let date = new Date(startDate); date <= endDate; date.setMonth(date.getMonth() + 1)) {
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const formattedDate = date.toLocaleString('default', { month: 'short', year: 'numeric' });
  
      if (!monthlyDataMap.has(monthKey)) {
        monthlyDataMap.set(monthKey, {
          date: formattedDate,
          Users: 0 // No users for this month
        });
      }
    }
  
    // Convert the map to an array for the graph
    monthlyDataMap.forEach(value => {
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

    grantMoneyRaised.forEach(grant => {
        if (grant.amount && grant.years) {
            const year = grant.years;
            if (yearlyDataMap.has(year)) {
                yearlyDataMap.get(year).GrantMoney += grant.amount;
            } else {
                yearlyDataMap.set(year, {
                    date: year.toString(),
                    GrantMoney: grant.amount
                });
            }
        } else {
            console.warn('Invalid year or amount in grant data:', grant);
        }
    });

    // Convert the map to an array for the graph
    yearlyDataMap.forEach(value => {
        data.push(value);
    });

    data.sort((a, b) => parseInt(a.date) - parseInt(b.date));

    console.log("Final data for graph:", data);
    return data;
};

  const getYearlyPublicationsGraphData = () => {
    const data = [];

    // Create a map to aggregate publications by year
    const yearlyDataMap = new Map();

    publications.forEach(publication => {
      try {
        const dataDetails = JSON.parse(publication.data_details);
        if (dataDetails.year_published) {
          const year = dataDetails.year_published.toString();
          if (yearlyDataMap.has(year)) {
            yearlyDataMap.get(year).Publications += 1;
          } else {
            yearlyDataMap.set(year, {
              year: year,
              Publications: 1,
            });
          }
        } else {
          console.warn('Missing year in publication data:', publication);
        }
      } catch (error) {
        console.error('Error parsing publication data:', error);
      }
    });

    // Convert the map to an array for the graph
    yearlyDataMap.forEach(value => {
      data.push(value);
    });

    // Sort data by year to ensure chronological order
    data.sort((a, b) => parseInt(a.year) - parseInt(b.year));

    console.log("Final data for yearly publications graph:", data);
    return data;
  };

  
  const GraphContainer = ({ title, children }) => (
    <div className="graph-container h-[350px] w-[100%] mt-4 mb-8"> {/* Adjusted heights and margins */}
      <h2 className="graph-title text-left text-l font-bold text-zinc-600 mb-2"> {/* Added `mb-2` for margin below the title */}
        {title}
      </h2>
      {children}
    </div>
  );


  return (
    <PageContainer>
    <DepartmentAdminMenu getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} />
    <main className="ml-4 pr-5 overflow-auto custom-scrollbar w-full mb-4">
        <h1 className="text-left m-4 text-4xl font-bold text-zinc-600">Department Analytics for {department}</h1>
        
        {loading ? (
            <div className="flex items-center justify-center w-full mt-8">
                <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
            </div>
        ) : (
            <div className="mt-8">
                <div className="m-4 max-w-3xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 auto-resize [grid-template-columns:repeat(auto-fill,_minmax(min-content,_max-content))]">
                    <div className='auto-resize'> 
                      <AnalyticsCard title="Faculty Users" value={facultyUsers.length} />
                    </div>
                    <AnalyticsCard title="Assistant Users" value={assistantUsers.length} />
                    <AnalyticsCard title="Publications" value={filteredPublications.length} />
                    <AnalyticsCard title="Grants" value={filteredGrants.length} />
                    <AnalyticsCard title="Patents" value={filteredPatents.length} />
                    <AnalyticsCard title="Users who Generated CVs" value={totalCVsGenerated} />
                    <div className='auto-resize'> 
                    <AnalyticsCard title="Grant Money Raised" value={totalGrantMoneyRaised} />
                    </div>
                </div>

                    <div className="flex flex-col items-left">
                    {/* Line Graph for Number of Users Over Time */}
                    <GraphContainer title="Number of Users Over Time">
                      <LineGraph data={getGraphData()} dataKey="Users" lineColor="#8884d8" />
                    </GraphContainer>

                    {/* Line Graph for Grant Money Raised Over Time */}
                    <GraphContainer title="Grant Money Raised Over Time">
                      <LineGraph data={getGrantMoneyGraphData()} dataKey="GrantMoney" lineColor="#82ca9d" />
                    </GraphContainer>

                   {/* Bar Chart for Yearly Publications */}
                  <GraphContainer title="Yearly Publications">
                    <div className="w-full">
                      <BarChartComponent
                        data={getYearlyPublicationsGraphData()}
                        dataKey="Publications"
                        xAxisKey="year"
                        barColor="#8884d8"
                      />
                    </div>
                  </GraphContainer>
                  </div>
            </div>
        )}
    </main>
</PageContainer>

  )
}

export default DepartmentAdminAnalytics;