import React, { useState, useEffect } from 'react';
import PageContainer from './PageContainer.jsx';
import FacultyMenu from '../Components/FacultyMenu';
import AssociatedUser from '../Components/AssociatedUser.jsx';
import { getUserConnections } from '../graphql/graphqlHelpers.js';

// const assistants = [
//   {
//     id: 1,
//     firstName: 'Alice Betty Joan',
//     lastName: 'Johnson Smith Carter',
//     department: 'Anatomy',
//     faculty: 'Faculty of Medicine',
//     status: 'confirmed'
//   },
//   {
//     id: 2,
//     firstName: 'Bob',
//     lastName: 'Smith',
//     department: 'Physiology',
//     faculty: 'Faculty of Medicine',
//     status: 'confirmed'
//   },
//   {
//     id: 3,
//     firstName: 'Carol',
//     lastName: 'Davis',
//     department: 'Biochemistry',
//     faculty: 'Faculty of Medicine',
//     status: 'confirmed'
//   },
//   {
//     id: 4,
//     firstName: 'David',
//     lastName: 'Martinez',
//     department: 'Pharmacology',
//     faculty: 'Faculty of Medicine',
//     status: 'pending'
//   },
//   {
//     id: 5,
//     firstName: 'Eva',
//     lastName: 'Brown',
//     department: 'Microbiology',
//     faculty: 'Faculty of Medicine',
//     status: 'confirmed'
//   },
//   {
//     id: 6,
//     firstName: 'Frank',
//     lastName: 'Wilson',
//     department: 'Pathology',
//     faculty: 'Faculty of Medicine',
//     status: 'confirmed'
//   }
// ];

const Assistants = ({ userInfo, getCognitoUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingConnections, setPendingConnections] = useState([]);
  const [confirmedConnections, setConfirmedConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  //TODO: FIX SEARCH FUNCTIONALITY

  useEffect(() => {
    getAllUserConnections();
  }, []);

  const getAllUserConnections = async () => {
    setLoading(true);
    try {
      const retrievedUserConnections = await getUserConnections(userInfo.user_id);

      // Parse the user_connection field from a JSON string to a JSON object
      const parsedUserConnections = retrievedUserConnections.map(connection => ({
        ...connection,
        user_connection: JSON.parse(connection.user_connection),
      }));

      const filteredUserConnections = parsedUserConnections.filter(connection => 
        connection.user_connection.first_name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
        connection.user_connection.last_name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
        connection.user_connection.email.toLowerCase().startsWith(searchTerm.toLowerCase())
      );
      
      console.log('User connections', retrievedUserConnections);
      setPendingConnections(filteredUserConnections.filter(connection => connection.user_connection.status === 'pending'));
      setConfirmedConnections(filteredUserConnections.filter(connection => connection.user_connection.status === 'confirmed'));
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <PageContainer>
      <FacultyMenu userName={userInfo.preferred_name || userInfo.first_name} getCognitoUser={getCognitoUser} />
      <main className='flex-1 !overflow-auto !h-full custom-scrollbar'>
        <h1 className="text-left ml-4 mt-4 text-4xl font-bold text-zinc-600">Assistants</h1>
        {loading ? (
            <div className='flex items-center justify-center w-full'>
              <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
            </div>
          ) : (
            <div>
              <div className='m-4 max-w-lg flex'>
                <label className="input input-bordered flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    className="grow"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="h-4 w-4 opacity-70"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                      clipRule="evenodd" />
                  </svg>
                </label>
              </div>

              {pendingConnections.length > 0 && 
                <h2 className="text-left m-4 text-2xl font-bold text-zinc-600">Invitations</h2>
              }
              <div className='ml-4 mr-2 flex flex-wrap gap-4'>
                {pendingConnections.map((connection) => (
                  <AssociatedUser key={connection.user_connection_id} connection={connection} getAllUserConnections={getAllUserConnections}/>
                ))}
              </div>
              
              {confirmedConnections.length > 0 &&
                <h2 className="text-left m-4 text-2xl font-bold text-zinc-600">Active</h2>
              }
              <div className='ml-4 mr-2 flex flex-wrap gap-4'>
                {confirmedConnections.map((connection) => (
                  <AssociatedUser key={connection.user_connection_id} connection={connection} getAllUserConnections={getAllUserConnections}/>
                ))}
              </div>
            </div>
          )}
      </main>
    </PageContainer>
  );
}

export default Assistants;
