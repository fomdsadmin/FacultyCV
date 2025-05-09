import React from 'react';
import PageContainer from './PageContainer.jsx';
import FacultyMenu from '../Components/FacultyMenu.jsx';
import { Link } from 'react-router-dom';

const DashboardPage = ({ userInfo, getCognitoUser, toggleViewMode }) => {
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
      
      <div className="flex justify-between items-start mb-10">
        {/* Header Section (left) */}
        <div>
        <div className="text-xl font-semibold text-gray-800">
            Welcome Dr. {userInfo.last_name}
        </div>
        <div className="text-sm text-gray-500">
            Last visit: 6 Nov 2025, 3:16PM (static)
        </div>
        </div>

        {/* Help Section (right corner) */}
        <div>    
        <Link to="/support">
        <button className="btn btn-sm btn-success">Get Help</button>
        </Link>
        </div>
      </div>

      {/* What is Fac360 + Updates side-by-side */}
<div className="mb-10 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
  {/* Left: Fac360 video */}
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
          
    {/* Right: Faculty 360 - Updates */}
    <div> <h2 className="text-lg font-semibold mb-3">Notifications</h2> 
     <div className="bg-gray-50 p-4 rounded-lg shadow-sm border">
        <details open className="mb-2">
        <summary className="font-medium cursor-pointer">Oct 31, 2025 – New theme • FoM 50</summary>
        <p className="text-sm mt-1 text-gray-700">
            As UBC FoM proudly celebrates 50 years of innovation, care, and community...
        </p>
        </details>
        <details className="mb-2">
        <summary className="font-medium cursor-pointer">Sept 17, 2025 – New Feature(s)</summary>
        <p className="text-sm mt-1 text-gray-700">Some description about this feature.</p>
        </details>
        <details className="mb-2">
        <summary className="font-medium cursor-pointer">Aug 12, 2025</summary>
        <p className="text-sm mt-1 text-gray-700">Some description about this update.</p>
        </details>
        <details className="mb-2">
        <summary className="font-medium cursor-pointer">July 15, 2025</summary>
        <p className="text-sm mt-1 text-gray-700">Some description about this update.</p>
        </details>
        <details>
        <summary className="font-medium cursor-pointer">June 05, 2025</summary>
        <p className="text-sm mt-1 text-gray-700">Some description about this update.</p>
        </details>
       </div>
      </div>
    </div>

        {/* Training Resources */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-3">Training Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 shadow-sm bg-white">
              <h3 className="font-semibold text-gray-700 mb-1">🧭 First Setup</h3>
              <p className="text-sm text-gray-600 mb-2">Learn how to set up your account for the first time.</p>
              <button className="btn btn-sm btn-primary">Learn more</button>
            </div>
            <div className="border rounded-lg p-4 shadow-sm bg-white">
              <h3 className="font-semibold text-gray-700 mb-1">👥 Delegate(s)</h3>
              <p className="text-sm text-gray-600 mb-2">Learn how to setup Delegates to access your profile on your behalf.</p>
              <button className="btn btn-sm btn-primary">Learn more</button>
            </div>
            <div className="border rounded-lg p-4 shadow-sm bg-white">
              <h3 className="font-semibold text-gray-700 mb-1">📄 Reports</h3>
              <p className="text-sm text-gray-600 mb-2">Create reports, including UBC CV.</p>
              <button className="btn btn-sm btn-primary">Learn more</button>
            </div>
          </div>
        </div>

       

        {/* Footer */}
        <footer className="text-sm text-gray-400 mt-10">
          <div className="flex gap-2 mt-1">
          </div>
          <div>Version 2.0.0</div>
        </footer>
      </main>
    </PageContainer>
  );
};

export default DashboardPage;
