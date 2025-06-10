import React, { useState, useEffect } from 'react';
import PageContainer from './PageContainer.jsx';
import FacultyMenu from '../Components/FacultyMenu.jsx';
import { Link } from 'react-router-dom';
import Dashboard from './dashboard_charts.jsx'; // ← Import chart component
import {
  GetNotifications,
  getUserDeclarations,
} from "../graphql/graphqlHelpers";
import { normalizeDeclarations } from "./Declarations.jsx";

const DashboardPage = ({ userInfo, getCognitoUser, toggleViewMode }) => {
  const [notifications, setNotifications] = useState([]);
  const [declarations, setDeclarations] = useState([]);
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const result = await GetNotifications(); // your actual GraphQL call
        setNotifications(result);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
    async function fetchDeclarations() {
      if (userInfo?.first_name && userInfo?.last_name) {
        const data = await getUserDeclarations(
          userInfo.first_name,
          userInfo.last_name
        );
        setDeclarations(normalizeDeclarations(data));
      }
    }
    fetchDeclarations();
  }, [userInfo]);

  return (
    <PageContainer>
      {/* Sidebar */}
      <FacultyMenu
        getCognitoUser={getCognitoUser}
        userName={userInfo.preferred_name || userInfo.first_name}
        toggleViewMode={toggleViewMode}
        userInfo={userInfo}
      />

      {/* Main content */}
      <main className="px-[3vw] xs:px-[3vw] sm:px-[4vw] md:px-[4vw] lg:px-[6vw] xl:px-[8vw] 2xl:px-[10vw] w-full overflow-auto py-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="text-xl font-semibold text-gray-800">
              Welcome Dr. {userInfo.last_name}
            </div>
            <div className="text-sm text-gray-500">
              Last visit: 6 Nov 2025, 3:16PM (static)
            </div>
          </div>
          <div>
            <Link to="/support">
              <button className="btn btn-sm btn-success">Get Help</button>
            </Link>
          </div>
        </div>
        {/* Notifications Section */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-md mb-10 grid lg:grid-cols-[6fr_4fr] md:grid-cols-1 sm:grid-cols-1 gap-x-4">
          {/* User Notification Section */}
          <div className="mb-10">
            <h1 className="text-lg font-semibold mb-3">Overview</h1>
            <div className="relative flex flex-col items-center rounded-xl shadow-md px-4 py-2 bg-stone-100">
              {/* Declarations Section - existing code */}
              {declarations &&
              declarations.some((d) => d.year === new Date().getFullYear()) ? (
                (() => {
                  const currentDecl = declarations.find(
                    (d) => d.year === new Date().getFullYear()
                  );
                  return (
                    <div className="relative mt-4 w-full h-full flex flex-col bg-green-50 border-l-8 border-green-500 rounded-xl shadow-lg px-4 py-4 mb-6">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-6 h-6 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <div className="flex-1 xl:pr-32">
                          {" "}
                          {/* Add right padding on large screens */}
                          <div className="text-md font-bold text-green-800 mb-1">
                            Declaration submitted for{" "}
                            <span>{currentDecl.year}</span>
                          </div>
                          <div className="text-xs text-gray-700">
                            Created on:{" "}
                            <b>
                              {currentDecl.created_on
                                ? currentDecl.created_on.split(" ")[0]
                                : "N/A"}
                            </b>
                          </div>
                        </div>
                      </div>

                      {/* Button positioned differently for mobile vs desktop */}
                      <div className="mt-4 flex justify-start gap-2 xl:absolute xl:top-3 xl:right-3 xl:mt-0 px-1">
                        <span className="inline-block px-2 py-1 rounded-full bg-green-200 text-green-800 font-semibold text-xs shadow">
                          Submitted
                        </span>
                        <Link to="/declarations">
                          <button className="btn btn-xs btn-outline btn-success">
                            View Declarations
                          </button>
                        </Link>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="relative mt-4 w-full h-full flex flex-col bg-zinc-50 border-l-8 border-yellow-500 rounded-xl shadow-lg px-4 py-4 mb-6">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-6 h-6 text-yellow-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v4m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0z"
                      />
                    </svg>
                    <div className="flex-1 lg:pr-24">
                      {" "}
                      {/* Add right padding on large screens */}
                      <div className="text-md font-bold text-yellow-800 mb-1">
                        No declaration found for{" "}
                        <span> {new Date().getFullYear()}</span>
                      </div>
                      <div className="text-xs text-gray-700">
                        <b>Action Required:</b> Please submit your annual
                        declaration to stay compliant.
                      </div>
                    </div>
                  </div>

                  {/* Button positioned differently for mobile vs desktop */}
                  <div className="mt-4 flex justify-start xl:absolute xl:top-3 xl:right-3 xl:mt-0">
                    <Link to="/declarations">
                      <button className="btn btn-xs btn-warning">
                        Declare Now
                      </button>
                    </Link>
                  </div>
                </div>
              )}
              {/* Grants Section */}
              {/* <div className="relative w-full h-full flex flex-col bg-zinc-50 border-l-8  rounded-xl shadow-md px-4 py-4 mb-6">
                <div className="flex items-start gap-4">
                  <svg
                    className="w-6 h-6 text-green-600 mt-1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1 xl:pr-24">
                    <div className="text-md font-bold text-green-800 mb-2">
                      Grants
                    </div> */}

              {/* Rise Grants */}
              {/* <div className="mb-2 p-3 bg-white rounded-lg border">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                        <div className="flex items-center gap-2 mb-2 sm:mb-0">
                          <span className="text-sm font-semibold ">
                            Rise Grants
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="bg-green-100 text-green-800 font-semibold px-2 py-1 rounded text-xs">5 Active
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Last synced:</span> Dec 3,
                        2024 at 9:45 AM
                      </div>
                    </div> */}

              {/* External Grants */}
              {/* <div className="mb-2 p-3 bg-white rounded-lg border">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                        <div className="flex items-center gap-2 mb-2 sm:mb-0">
                          <span className="text-sm font-semibold ">
                            External Grants
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="bg-blue-100 text-blue-800 font-semibold px-2 py-1 rounded text-xs">
                            12 Total
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Last synced:</span> Nov
                        30, 2024 at 1:20 PM
                      </div>
                    </div>
                  </div> */}

              {/* Button positioned differently for mobile vs desktop */}
              {/* <div className="mt-4 flex justify-start lg:absolute lg:top-3 lg:right-3 lg:mt-0">
                    <Link to="/academic-work">
                      <button className="btn btn-xs bg-green-600 hover:bg-green-700 text-white border-green-600">
                        View All
                      </button>
                    </Link>
                  </div> 
                </div>
              </div>
              */}

              {/* ORCID and Scopus Connection Status */}
              {/* <div className="relative w-full h-full flex flex-col bg-zinc-50 border-l-8 border-gr-500 rounded-xl shadow-md px-4 py-4 mb-6">
                <div className="flex items-start gap-4">
                  <svg
                    className="w-6 h-6 text-indigo-500 mt-1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  <div className="flex-1 xl:pr-24">
                    <div className="text-md font-bold text-indigo-800 mb-2">
                      Publications
                    </div> */}

              {/* ORCID Connection */}
              {/* <div className="mb-2 p-3 bg-white rounded-lg border">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                        <div className="flex items-center gap-2 mb-2 sm:mb-0">
                          <span className="text-sm font-semibold ">ORCID</span>
                        </div>
                        <div className="text-sm">
                          {userInfo.orcid_id ? (
                            <a
                              href={`https://orcid.org/${userInfo.orcid_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline font-mono bg-blue-50 px-2 py-1 rounded"
                            >
                              {userInfo.orcid_id}
                            </a>
                          ) : (
                            <span className="text-red-600 font-medium bg-red-50 px-2 py-1 rounded text-xs">
                              Not Connected
                            </span>
                          )}
                        </div>
                      </div>
                      {userInfo.orcid_id && (
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">
                            Last synced publications:
                          </span>{" "}
                          Dec 1, 2024 at 2:30 PM
                        </div>
                      )}
                    </div> */}

              {/* Scopus Connection */}
              {/* <div className="mb-2 p-3 bg-white rounded-lg border">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                        <div className="flex items-center gap-2 mb-2 sm:mb-0">
                          <span className="text-sm font-semibold ">Scopus</span>
                        </div>
                        <div className="text-sm">
                          {userInfo.scopus_id ? (
                            <a
                              href={`https://www.scopus.com/authid/detail.uri?authorId=${userInfo.scopus_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline font-mono bg-blue-50 px-2 py-1 rounded"
                            >
                              {userInfo.scopus_id}
                            </a>
                          ) : (
                            <span className="text-red-600 font-medium bg-red-50 px-2 py-1 rounded text-xs">
                              Not Connected
                            </span>
                          )}
                        </div>
                      </div>
                      {userInfo.scopus_id && (
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">
                            Last synced publications:
                          </span>{" "}
                          Nov 28, 2024 at 4:15 PM
                        </div>
                      )}
                    </div>
                  </div> */}
              {/* Button positioned differently for mobile vs desktop */}
              {/* <div className="mt-4 flex justify-start lg:absolute lg:top-3 lg:right-3 lg:mt-0">
                    <Link to="/home">
                      <button className="btn btn-xs btn-indigo-500 bg-indigo-500 hover:bg-indigo-600 text-white border-indigo-500">
                        Manage
                      </button>
                    </Link>
                  </div>
                </div>
              </div> */}
            </div>
          </div>

          {/* System Notifications */}
          <div className="rounded-lg">
            <h2 className="text-lg font-semibold mb-3">System Notifications</h2>
            <div className="bg-gray-50 p-4 rounded-lg shadow-md max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-gray-500">No new notifications.</p>
              ) : (
                notifications.map((note) => (
                  <details key={note.record_id} className="mb-2 py-1">
                    <summary className="font-medium cursor-pointer">
                      {note.title}
                    </summary>
                    <p className="text-sm mt-1 text-gray-700">
                      {note.description}
                    </p>
                  </details>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 📈 Publication Chart Section */}
        <div className="mb-15">
          <h2 className="text-lg font-semibold mb-4">Analytics</h2>
          <Dashboard userInfo={userInfo} />
        </div>

        {/* What is Fac360 + Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10 py-6">
          {/* Fac360 video */}
          <div className="mb-10 gap-6 items-start">
            <div>
              <h2 className="text-lg font-semibold mb-6">
                What is Fac360(CV)?
              </h2>
              <div className="aspect-video w-full">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/n0zI3jLApYI"
                  title="What is Fac360?"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-md"
                ></iframe>
              </div>
            </div>
          </div>
          {/* Training Resources */}
          <div className="mb-10">
            <h2 className="text-lg font-semibold mb-6">Training Resources</h2>
            <div className=" flex flex-col gap-4">
              <div className="border rounded-lg p-4 shadow-sm bg-white">
                <h3 className="font-semibold text-gray-700 mb-1">
                  🧭 First Setup
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Learn how to set up your account for the first time.
                </p>
                <button className="btn btn-sm btn-primary">Learn more</button>
              </div>
              <div className="border rounded-lg p-4 shadow-sm bg-white">
                <h3 className="font-semibold text-gray-700 mb-1">
                  👥 Delegate(s)
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Learn how to setup Delegates to access your profile on your
                  behalf.
                </p>
                <button className="btn btn-sm btn-primary">Learn more</button>
              </div>
              <div className="border rounded-lg p-4 shadow-sm bg-white">
                <h3 className="font-semibold text-gray-700 mb-1">📄 Reports</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Create reports, including UBC CV.
                </p>
                <button className="btn btn-sm btn-primary">Learn more</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </PageContainer>
  );
};

export default DashboardPage;
