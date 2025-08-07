import React from "react";
import { useEffect, useState } from "react";
import { getUserConnections } from "../graphql/graphqlHelpers.js";
import AssociatedConnection from "../Components/AssociatedConnection.jsx";
import Assistant_FacultyMenu from "../Components/Assistant_FacultyMenu.jsx";
import { useApp, toggleViewMode } from "../Contexts/AppContext.jsx";
import ConnectionInviteModal from "../Components/ConnectionInviteModal.jsx";
import { FaSync } from "react-icons/fa";
import PageContainer from "./PageContainer.jsx";

const AssistantConnections = ({ userInfo, setUserInfo, getCognitoUser, getUser }) => {
  const { toggleViewMode } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingConnections, setPendingConnections] = useState([]);
  const [confirmedConnections, setConfirmedConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  //TODO: FIX SEARCH FUNCTIONALITY

  useEffect(() => {
    setLoading(true);
    getAllUserConnections();
  }, [searchTerm, userInfo]);

  async function getAllUserConnections() {
    try {
      const retrievedUserConnections = await getUserConnections(userInfo.user_id, false);

      const filteredUserConnections = retrievedUserConnections.filter(
        (connection) =>
          connection.faculty_first_name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
          connection.faculty_last_name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
          connection.faculty_email.toLowerCase().startsWith(searchTerm.toLowerCase())
      );

      setPendingConnections(filteredUserConnections.filter((connection) => connection.status === "pending"));
      setConfirmedConnections(filteredUserConnections.filter((connection) => connection.status === "confirmed"));
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const refresh = async () => {
    setLoading(true);
    await getAllUserConnections();
    setLoading(false);
  };

  return (
    <PageContainer>
      <Assistant_FacultyMenu
        userName={userInfo.first_name}
        getCognitoUser={getCognitoUser}
        toggleViewMode={toggleViewMode}
        userInfo={userInfo}
      />
      <main className="flex-1 px-[2vw] md:px-[3vw] lg:px-[5vw] !overflow-auto !h-full !custom-scrollbar">
        <div className="flex items-center justify-between">
          <h1 className="text-left mt-4 text-4xl font-bold text-zinc-600">Connections</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-8 text-white btn btn-success min-h-0 h-10 leading-tight"
          >
            New Invite
          </button>
        </div>
        {isModalOpen && (
          <ConnectionInviteModal
            userInfo={userInfo}
            getAllUserConnections={getAllUserConnections}
            setIsModalOpen={setIsModalOpen}
          />
        )}
        {loading ? (
          <div className="flex items-center justify-center w-full">
            <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
          </div>
        ) : (
          <div>
            <div className="max-w-lg my-4 flex items-center gap-2">
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
              <button onClick={refresh} className="btn btn-ghost">
                <FaSync className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            {pendingConnections.length === 0 && confirmedConnections.length === 0 ? (
              <div className="text-center my-4 text-lg text-zinc-600">No connections found</div>
            ) : (
              <>
                {pendingConnections.length > 0 && (
                  <h2 className="text-left my-4 text-2xl font-bold text-zinc-600">Pending Connections</h2>
                )}
                <div className="flex flex-wrap gap-4">
                  {pendingConnections.map((connection) => (
                    <AssociatedConnection
                      key={connection.user_connection_id}
                      connection={connection}
                      getUser={getUser}
                    />
                  ))}
                </div>

                {confirmedConnections.length > 0 && (
                  <h2 className="text-left my-4 text-2xl font-bold text-zinc-600">Active Connections</h2>
                )}
                <div className="flex flex-wrap gap-4">
                  {confirmedConnections.map((connection) => (
                    <AssociatedConnection
                      key={connection.user_connection_id}
                      connection={connection}
                      getUser={getUser}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </PageContainer>
  );
};

export default AssistantConnections;
