import React, { useState, useEffect } from 'react';
import PageContainer from './PageContainer.jsx';
import FacultyMenu from '../Components/FacultyMenu.jsx';
import AssociatedUser from '../Components/AssociatedUser.jsx';
import { getUserConnections } from '../graphql/graphqlHelpers.js';
import { FaSync, FaSearch, FaUserPlus } from 'react-icons/fa';

const FacultyDelegates = ({ userInfo, getCognitoUser, toggleViewMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingConnections, setPendingConnections] = useState([]);
  const [confirmedConnections, setConfirmedConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAllUserConnections();
  }, [userInfo]);

  async function getAllUserConnections() {
    try {
      const retrievedUserConnections = await getUserConnections(userInfo.user_id);
      setPendingConnections(retrievedUserConnections.filter(connection => connection.status === 'pending'));
      setConfirmedConnections(retrievedUserConnections.filter(connection => connection.status === 'confirmed'));
    } catch (error) {
      console.error('Error:', error);
      setPendingConnections([]);
      setConfirmedConnections([]);
    }
    setLoading(false);
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredPending = pendingConnections.filter(connection =>
    connection.assistant_first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.assistant_last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.assistant_email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredConfirmed = confirmedConnections.filter(connection =>
    connection.assistant_first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.assistant_last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.assistant_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const refresh = async () => {
    setLoading(true);
    await getAllUserConnections();
    setLoading(false);
  };

  return (
    <PageContainer>
      <FacultyMenu
        userName={userInfo.preferred_name || userInfo.first_name}
        getCognitoUser={getCognitoUser}
        toggleViewMode={toggleViewMode} userInfo={userInfo}/>
      <main className="flex-1 px-8 lg:px-12 py-6 overflow-auto h-full custom-scrollbar">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Delegates</h1>
            <p className="text-gray-600">Manage your connections with delegates</p>
          </div>
        </div>
        {/* Search and Refresh Section */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSync className={`h-4 w-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-gray-700">Refresh</span>
          </button>
        </div>
        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading connections...</p>
          </div>
        ) : (
          /* Content */
          <div className="space-y-8">
            {/* No Connections State */}
            {filteredPending.length === 0 && filteredConfirmed.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
                  <FaUserPlus className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No connections found' : 'No connections yet'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm
                    ? 'Try adjusting your search terms or checking the spelling.'
                    : 'Start by inviting a delegate to connect.'}
                </p>
              </div>
            ) : (
              <>
                {/* Pending Connections */}
                {filteredPending.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-xl font-semibold text-gray-800">Pending Invites</h2>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {filteredPending.length}
                      </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredPending.map((connection) => (
                        <AssociatedUser
                          key={connection.user_connection_id}
                          connection={connection}
                          getAllUserConnections={getAllUserConnections}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {/* Active Connections */}
                {filteredConfirmed.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-xl font-semibold text-gray-800">Active Connections</h2>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {filteredConfirmed.length}
                      </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredConfirmed.map((connection) => (
                        <AssociatedUser
                          key={connection.user_connection_id}
                          connection={connection}
                          getAllUserConnections={getAllUserConnections}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </PageContainer>
  );
}

export default FacultyDelegates;
