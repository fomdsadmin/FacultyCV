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
      <main className="ml-4 pr-5 w-full overflow-auto py-6 px-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-10">
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
        {/* What is Fac360 + Notifications */}
        <div className="mb-10 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Fac360 video */}
          <div>
            <h2 className="text-lg font-semibold mb-2">What is Fac360(CV)?</h2>
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

          {/* Notifications */}
          <div>
            <h2 className="text-lg font-semibold mb-3">System Notifications</h2>
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm border max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-gray-500">No new notifications.</p>
              ) : (
                notifications.map((note) => (
                  <details key={note.record_id} className="mb-2">
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
        {/* Declarations Status Section */}
        <div className="mb-10">
          {declarations &&
          declarations.some((d) => d.year === new Date().getFullYear()) ? (
            (() => {
              const currentDecl = declarations.find(
                (d) => d.year === new Date().getFullYear()
              );
              return (
                <div className="relative flex items-center bg-green-50 border-l-8 border-green-500 rounded-xl shadow-lg px-8 py-6 mb-6">
                  <div className="flex items-center gap-4">
                    <svg
                      className="w-10 h-10 text-green-500"
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
                    <div>
                      <div className="text-xl font-bold text-green-800 mb-1">
                        Declaration submitted for{" "}
                        <span className="underline">{currentDecl.year}</span>
                      </div>
                      <div className="text-sm text-gray-700">
                        Created on:{" "}
                        <b>
                          {currentDecl.created_on
                            ? currentDecl.created_on.split(" ")[0]
                            : "N/A"}
                        </b>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-4 right-6 flex items-center gap-3">
                    <span className="inline-block px-3 py-1 rounded-full bg-green-200 text-green-800 font-semibold text-xs shadow">
                      Submitted
                    </span>
                    <Link to="/declarations">
                      <button className="btn btn-sm btn-outline btn-success">
                        View Declarations
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="relative flex items-center bg-yellow-50 border-l-8 border-yellow-500 rounded-xl shadow-lg px-8 py-6 mb-6">
              <div className="flex items-center gap-4">
                <svg
                  className="w-10 h-10 text-yellow-500"
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
                <div>
                  <div className="text-xl font-bold text-yellow-800 mb-1">
                    No declaration found for{" "}
                    <span className="underline">
                      {new Date().getFullYear()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">
                    <b>Action Required:</b> Please submit your annual
                    declaration to stay compliant.
                    <br />
                    (Filler text: You must complete your declaration for this
                    year to access all features.)
                  </div>
                </div>
              </div>
              <div className="absolute top-4 right-6 flex items-center gap-3">
                <span className="inline-block px-3 py-1 rounded-full bg-yellow-200 text-yellow-900 font-semibold text-xs shadow">
                  Missing
                </span>
                <Link to="/declarations">
                  <button className="btn btn-sm btn-warning">
                    Declare Now
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 📈 Publication Chart Section */}
        <div className="mb-10">
          <Dashboard userInfo={userInfo} />
        </div>

        {/* Training Resources */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-3">Training Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </main>
    </PageContainer>
  );
};

export default DashboardPage;
