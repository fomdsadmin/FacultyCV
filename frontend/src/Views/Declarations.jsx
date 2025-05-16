import React, { useState, useEffect } from 'react';
import PageContainer from './PageContainer.jsx';
import FacultyMenu from '../Components/FacultyMenu.jsx';
import { Link } from 'react-router-dom';

const Declarations = ({ userInfo, getCognitoUser, toggleViewMode }) => {
    const sc3_link = "https://google.com"; // todo , link broken on APT website
    const unicouncil_link = "https://universitycounsel.ubc.ca/subject-areas/coi/";
    const orcs_link = "https://ors.ubc.ca/";
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
            <div className="text-4xl font-bold text-zinc-600">
              Declarations
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
        {/* Annual Activity Report*/}
        <div className="mb-10 grid grid-cols-1 gap-6 items-start">
          <div>
            <h2 className="text-lg font-semibold mb-2">Reporting Year: </h2>
            <select
              className="select select-bordered w-40 mt-2 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-150"
              defaultValue="2025"
              // onChange={e => setSelectedYear(e.target.value)} // For future use
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>

          {/* Conflict of Interest and Commitment Declaration */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Conflict of Interest and Commitment Declaration</h2>
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm border max-h-96 overflow-y-auto">
                <p className="text-gray-500">
                    In accordance with <a
                    href={sc3_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-blue-500 hover:text-blue-900 hover:underline transition-colors duration-150 cursor-pointer"
                    style={{ textDecorationThickness: '2px' }}
                    >UBC Policy SC3</a>, 
                    you must maintain up-to-date Conflict of Interest and Conflict of Commitment declarations. 
                    For more information regarding Conflict of Interest and Commitment, please refer to the 
                    <a
                    href={unicouncil_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-blue-500 hover:text-blue-900 hover:underline transition-colors duration-150 cursor-pointer"
                    style={{ textDecorationThickness: '2px' }}
                    > Office of the University Counsel </a>
                    and the 
                    <a
                    href={orcs_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-blue-500 hover:text-blue-900 hover:underline transition-colors duration-150 cursor-pointer"
                    style={{ textDecorationThickness: '2px' }}
                    > UBC Office of Research Services.</a>
                </p>
                <br />
                <p className="text-gray-500">
                    Please indicate whether your Conflict of Interest and Conflict of Commitment declarations are up to date.
                </p>
                <select
                className="select select-bordered w-80vw mt-5 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-150"
                defaultValue="DEFAULT"
                // onChange={e => setSelectedYear(e.target.value)} // For future use
                >
                <option value="DEFAULT"></option>
                <option value="YES">Yes, my Conflicy of Interest and Conflict of Commitment declarations are up to date.</option>
                <option value="NO">No, my Conflicy of Interest and Conflict of Commitment declarations are not up to date.</option>
                </select>
            </div>
          </div>
        </div>
       
       
        {/* Footer */}
        <footer className="text-sm text-gray-400 mt-10">
          <div className="flex gap-2 mt-1"></div>
          <div>Version 2.0.0</div>
        </footer>
      </main>
    </PageContainer>
  );
};

export default Declarations;
