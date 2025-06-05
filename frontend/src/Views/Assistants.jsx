import React, { useState, useEffect } from 'react';
import PageContainer from './PageContainer.jsx';
import FacultyMenu from '../Components/FacultyMenu';
import AssociatedUser from '../Components/AssociatedUser.jsx';
import { getUserConnections } from '../graphql/graphqlHelpers.js';
import { FaSync } from 'react-icons/fa';

const Assistants = ({ userInfo, getCognitoUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingConnections, setPendingConnections] = useState([]);
  const [confirmedConnections, setConfirmedConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAllUserConnections();
  }, [searchTerm, userInfo]);

  async function getAllUserConnections() {
    try {
      const retrievedUserConnections = await getUserConnections(userInfo.user_id);

      const filteredUserConnections = retrievedUserConnections.filter(connection => 
        connection.assistant_first_name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
        connection.assistant_last_name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
        connection.assistant_email.toLowerCase().startsWith(searchTerm.toLowerCase())
      );
      
      
      setPendingConnections(filteredUserConnections.filter(connection => connection.status === 'pending'));
      setConfirmedConnections(filteredUserConnections.filter(connection => connection.status === 'confirmed'));
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false)
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const refresh = async () => {
    setLoading(true)
    await getAllUserConnections()
    setLoading(false)
  };

  return (
    <PageContainer>
      <FacultyMenu
        userName={userInfo.preferred_name || userInfo.first_name}
        getCognitoUser={getCognitoUser}
      />
      <main className="px-[3vw] xs:px-[3vw] sm:px-[4vw] md:px-[4vw] lg:px-[6vw] xl:px-[8vw] 2xl:px-[10vw] overflow-auto custom-scrollbar w-full mb-4">
        <h1 className="text-left ml-4 mt-4 text-4xl font-bold text-zinc-600">
          Assistants
        </h1>
        {loading ? (
          <div className="flex items-center justify-center w-full">
            <div className="block text-m mb-1 mt-6 text-zinc-600">
              Loading...
            </div>
          </div>
        ) : (
          <div>
            <div className="m-4 flex">
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
                    clipRule="evenodd"
                  />
                </svg>
              </label>
              <button onClick={refresh} className="ml-2 btn btn-ghost">
                <FaSync className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {pendingConnections.length === 0 &&
              confirmedConnections.length === 0 && (
                <div className="text-center m-4 text-lg text-zinc-600">
                  No connections found
                </div>
              )}

            {pendingConnections.length > 0 && (
              <h2 className="text-left m-4 text-2xl font-bold text-zinc-600">
                Invitations
              </h2>
            )}
            <div className="ml-4 mr-2 flex flex-wrap gap-4">
              {pendingConnections.map((connection) => (
                <AssociatedUser
                  key={connection.user_connection_id}
                  connection={connection}
                  getAllUserConnections={getAllUserConnections}
                />
              ))}
            </div>

            {confirmedConnections.length > 0 && (
              <h2 className="text-left m-4 text-2xl font-bold text-zinc-600">
                Active Connections
              </h2>
            )}
            <div className="ml-4 mr-2 flex flex-wrap gap-4">
              {confirmedConnections.map((connection) => (
                <AssociatedUser
                  key={connection.user_connection_id}
                  connection={connection}
                  getAllUserConnections={getAllUserConnections}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </PageContainer>
  );
}

export default Assistants;
