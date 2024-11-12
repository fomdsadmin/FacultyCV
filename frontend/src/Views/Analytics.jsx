import React from 'react'
import { useState, useEffect } from 'react';
import PageContainer from './PageContainer.jsx';
import AdminMenu from '../Components/AdminMenu.jsx';
import AnalyticsCard from '../Components/AnalyticsCard.jsx';
import { getAllUsers, getUserCVData, getAllUniversityInfo, getUserConnections, getAllSections, getNumberOfGeneratedCVs } from '../graphql/graphqlHelpers.js';
import { formatDateToLongString } from '../utils/time.js';
import { LineGraph } from '../Components/LineGraph.jsx';

const Analytics = ({ getCognitoUser, userInfo }) => {
  const [loading, setLoading] = useState(false);
  const [facultyUsers, setFacultyUsers] = useState([]);
  const [assistantUsers, setAssistantUsers] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [facultyUserTimestamps, setFacultyUserTimestamps] = useState([]);
  const [assistantUserTimestamps, setAssistantUserTimestamps] = useState([]);
  const [adminUserTimestamps, setAdminUserTimestamps] = useState([]);
  const [allUserTimestamps, setAllUserTimestamps] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [role, setRole] = useState('All');
  const [department, setDepartment] = useState('All');
  const [publications, setPublications] = useState([]);
  const [grants, setGrants] = useState([]);
  const [patents, setPatents] = useState([]);
  const [grantMoneyRaised, setGrantMoneyRaised] = useState([]);
  const [facultyConnections, setFacultyConnections] = useState([]);
  const [totalCVsGenerated, setTotalCVsGenerated] = useState(0);
  const [departmentAdminUsers, setDepartmentAdminUsers] = useState([]);
  const [departmentAdminUserTimestamps, setDepartmentAdminUserTimestamps] = useState([]);


  // The time range in days that the graph shows
  const TIME_RANGE = 50;

  useEffect(() => {
    fetchUsers();
    fetchUniversityInfo();
    fetchGeneratedCVs();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const users = await getAllUsers();
      const filteredFacultyUsers = users.filter(user => user.role === 'Faculty');
      const filteredAssistantUsers = users.filter(user => user.role === 'Assistant');
      const filteredAdminUsers = users.filter(user => user.role === 'Admin');
      const filteredDepartmentAdminUsers = users.filter(user => user.role.startsWith('Admin-'));
      const facutlyTimestamps = filteredFacultyUsers
                                .map(user => new Date(user.joined_timestamp))
                                .sort((a, b) => a - b)
                                .map(timestamp => {
                                  timestamp.setHours(0, 0, 0, 0);
                                  return timestamp;
                                });
      const departmentAdminTimestamps = filteredDepartmentAdminUsers
                                .map(user => new Date(user.joined_timestamp))
                                .sort((a, b) => a - b)
                                .map(timestamp => {
                                  timestamp.setHours(0, 0, 0, 0);
                                  return timestamp;
                                });
      const adminTimestamps = filteredAdminUsers
                              .map(user => new Date(user.joined_timestamp))
                              .sort((a, b) => a - b)
                              .map(timestamp => {
                                timestamp.setHours(0, 0, 0, 0);
                                return timestamp;
                              });
      const assistantTimestamps = filteredAssistantUsers
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
      setAdminUsers(filteredAdminUsers);
      setDepartmentAdminUsers(filteredDepartmentAdminUsers);
      setDepartmentAdminUserTimestamps(departmentAdminTimestamps);
      setAllUserTimestamps(allTimestamps);
      setFacultyUserTimestamps(facutlyTimestamps);
      setAdminUserTimestamps(adminTimestamps);
      setAssistantUserTimestamps(assistantTimestamps);
      
      fetchAllUserCVData(filteredFacultyUsers)
      fetchFacultyConnections(filteredAssistantUsers);
    } catch (error) {
      
    }
    setLoading(false);
  }

  async function fetchUniversityInfo() {
    setLoading(true);
    try {
      const universityInfo = await getAllUniversityInfo();
      setDepartments(universityInfo.filter(info => info.type === 'Department').map(info => info.value));
    } catch (error) {
      
    }
    setLoading(false);
  }

  async function fetchGeneratedCVs() {
    setLoading(true);
    try {
      const generatedCVs = await getNumberOfGeneratedCVs();
      setTotalCVsGenerated(generatedCVs);
    } catch (error) {
      
    }
    setLoading(false);
  }

  async function fetchAllUserCVData(users) {
    
    setLoading(true);
    let dataSections = [];
    try {
      dataSections = await getAllSections();
    } catch (error) {
      
    }
  
    // Find the IDs for Publications, Secured Funding, and Patents
    const publicationSectionId = dataSections.find(section => section.title === 'Publications')?.data_section_id;
    const secureFundingSectionId = dataSections.find(section => section.title === 'Secure Funding')?.data_section_id;
    const patentSectionId = dataSections.find(section => section.title === 'Patents')?.data_section_id;

    // Initialize arrays to hold the data
    let publicationsData = [];
    let grantsData = [];
    let patentsData = [];
  
    // Loop through faculty users and fetch their CV data
    for (const user of users) {
      try {
        const fetchedPublications = await getUserCVData(user.user_id, publicationSectionId);
        publicationsData = [...publicationsData, ...fetchedPublications];
      } catch (error) {
        
      }
      try {
        const fetchedGrants = await getUserCVData(user.user_id, secureFundingSectionId);
        grantsData = [...grantsData, ...fetchedGrants];
      } catch (error) {
        
      }
      try {
        const fetchedPatents = await getUserCVData(user.user_id, patentSectionId);
        patentsData = [...patentsData, ...fetchedPatents];
      } catch (error) {
        
      }
    }

    let totalGrantMoneyRaised = [];

    for (const data of grantsData) {
      try {
        const dataDetails = JSON.parse(data.data_details);
        //add object with dataDetails as an int and data.user_id to totalGrantMoneyRaised
        totalGrantMoneyRaised.push({amount: parseInt(dataDetails.amount), user_id: data.user_id});
      } catch (error) {
        
      }
    }

    // Update state variables
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
        
      }
    }
    setFacultyConnections(connections);
    setLoading(false);
  }

  const filteredPublications = publications.filter(publication => 
    facultyUsers.some(user => user.user_id === publication.user_id && (user.primary_department === department || user.secondary_department === department))
  );
  
  const filteredGrants = grants.filter(grant => 
    facultyUsers.some(user => user.user_id === grant.user_id && (user.primary_department === department || user.secondary_department === department))
  );
  
  const filteredPatents = patents.filter(patent => 
    facultyUsers.some(user => user.user_id === patent.user_id && (user.primary_department === department || user.secondary_department === department))
  );

  const totalGrantMoneyRaised = grantMoneyRaised.reduce((total, grant) => total + grant.amount, 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const filteredGrantMoneyRaised = grantMoneyRaised
    .filter(grant => facultyUsers.some(user => user.user_id === grant.user_id && (user.primary_department === department || user.secondary_department === department)))
    .reduce((total, grant) => total + grant.amount, 0)
    .toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const getGraphData = () => {
    const data = [];
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);
    let users = 0;
    const startDate = new Date(endDate);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - TIME_RANGE);
    switch (role) {
      case 'Faculty':
        users = facultyUserTimestamps.filter(date => date < startDate).length;
        for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
          const formattedDate = formatDateToLongString(date);
          users += facultyUserTimestamps.filter(timestamp => timestamp.getTime() === date.getTime()).length;
          data.push({
            date: formattedDate,
            Users: users
          });
        }
        break;
      case 'Assistant':
        users = assistantUserTimestamps.filter(date => date < startDate).length;
        for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
          const formattedDate = formatDateToLongString(date);
          users += assistantUserTimestamps.filter(timestamp => timestamp.getTime() === date.getTime()).length;
          data.push({
            date: formattedDate,
            Users: users
          });
        }
        break;
      case 'Department Admin':
        users = departmentAdminUserTimestamps.filter(date => date < startDate).length;
        for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
          const formattedDate = formatDateToLongString(date);
          users += departmentAdminUserTimestamps.filter(timestamp => timestamp.getTime() === date.getTime()).length;
          data.push({
            date: formattedDate,
            Users: users
          });
        }
        break;
      case 'Admin':
        users = adminUserTimestamps.filter(date => date < startDate).length;
        for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
          const formattedDate = formatDateToLongString(date);
          users += adminUserTimestamps.filter(timestamp => timestamp.getTime() === date.getTime()).length;
          data.push({
            date: formattedDate,
            Users: users
          });
        }
        break;
      default:
        users = allUserTimestamps.filter(date => date < startDate).length;
        for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
          const formattedDate = formatDateToLongString(date);
          users += allUserTimestamps.filter(timestamp => timestamp.getTime() === date.getTime()).length;
          data.push({
            date: formattedDate,
            Users: users
          });
        }
    }
    return data;  
  }
  return (
    <PageContainer>
      <AdminMenu getCognitoUser={getCognitoUser} userName={userInfo.preferred_name || userInfo.first_name} />
      <main className='ml-4 pr-5 overflow-auto custom-scrollbar w-full mb-4'>
        <h1 className="text-left m-4 text-4xl font-bold text-zinc-600">Analytics</h1>
        <div className='m-4 flex space-x-4'>
          <div className='w-1/4 bg-white shadow rounded-lg p-2 flex items-center'>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 pt-0.5">Role:</label>
            <select
              id="role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="All">All</option>
              <option value="Faculty">Faculty</option>
              <option value="Assistant">Assistant</option>
              <option value="Department Admin">Department Admin</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
  
          <div className='w-1/4 bg-white shadow rounded-lg p-2 flex items-center'>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department:</label>
            <select
              id="department"
              name="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={role !== 'Faculty'}
              className={`block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${role !== 'Faculty' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <option value="All">All</option>
              {departments.map((dept, index) => (
                <option key={index} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
          <div className='flex items-center justify-center w-full mt-8'>
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <div className='mt-8'>
            <div className='m-4 max-w-3xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10'>
              {role === 'All' && (
                <>
                  <AnalyticsCard title="Total Users" value={facultyUsers.length + assistantUsers.length + adminUsers.length} />
                  <AnalyticsCard title="Faculty Users" value={facultyUsers.length} />
                  <AnalyticsCard title="Assistant Users" value={assistantUsers.length} />
                  <AnalyticsCard title="Department Admin Users" value={departmentAdminUsers.length} />
                  <AnalyticsCard title="Admin Users" value={adminUsers.length} />
                  <AnalyticsCard title="Users who Generated CVs" value={totalCVsGenerated} />
                </>
              )}
              {role === 'Faculty' && (
                <>
                  <AnalyticsCard title="Faculty Users" value={facultyUsers.length} />
                  <AnalyticsCard title="Publications" value={department === 'All' ? publications.length : filteredPublications.length} />
                  <AnalyticsCard title="Grants" value={department === 'All' ? grants.length : filteredGrants.length} />
                  <AnalyticsCard title="Patents" value={department === 'All' ? patents.length : filteredPatents.length} />
                  <AnalyticsCard title="Grant Money Raised" value={department === 'All' ? totalGrantMoneyRaised : filteredGrantMoneyRaised} />
                </>
              )}
              {role === 'Assistant' && (
                <>
                  <AnalyticsCard title="Assistant Users" value={assistantUsers.length} />
                  <AnalyticsCard title="Faculty Connections" value={facultyConnections.length} />
                </>
              )}
              {role === 'Department Admin' && (
                <>
                  <AnalyticsCard title="Department Admin Users" value={departmentAdminUsers.length} />
                </>
              )}
              {role === 'Admin' && (
                <>
                  <AnalyticsCard title="Admin Users" value={adminUsers.length} />
                </>
              )}
            </div>
            <div className='h-[300px] w-[75%]'>
              <h2 className='text-left m-4 text-l font-bold text-zinc-600 pt-[8px] pb-[8px]'>Number of Users with time</h2>
              <LineGraph data={getGraphData()} />
            </div>
          </div>
        )}
      </main>
    </PageContainer>
  )  
}

export default Analytics
