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
        <div className="mb-10 p-12 px-20 mx-12 rounded-lg grid grid-cols-1 gap-6 items-start bg-gray-100">
          <div>
            <h2 className="text-lg font-semibold mb-2">
                <span className="text-red-500">* </span>
                Reporting Year: </h2>
            <select
              className="select select-bordered w-40 mt-2 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-150"
              defaultValue="DEFAULT"
              // onChange={e => setSelectedYear(e.target.value)} // For future use
            >
              <option value="DEFAULT"></option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>

          {/* Conflict of Interest and Commitment Declaration */}
          <div>
            <h2 className="text-lg font-semibold mb-3">
                <span className="text-red-500">* </span>
                Conflict of Interest and Commitment Declaration</h2>
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
                className="select select-bordered w-3/5 mt-5 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-150"
                defaultValue="DEFAULT"
                // onChange={e => setSelectedYear(e.target.value)} // For future use
                >
                <option value="DEFAULT"></option>
                <option value="YES">Yes, my Conflict of Interest and Conflict of Commitment declarations are up to date.</option>
                <option value="NO">No, my Conflict of Interest and Conflict of Commitment declarations are NOT up to date.</option>
                </select>
            </div>
          </div>

          {/* FOM Merit */}
          <div>
            <h2 className="text-lg font-semibold mb-3">
                 <span className="text-red-500">* </span>
                FOM Merit
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm border max-h-96 overflow-y-auto">
                <p className="text-gray-500">
                    All eligible members shall be considered for a <b>merit award</b> by their Department Head/School Director and a reasonable number of colleagues.
                    <br />
                    <br />
                    <i>Note: If you request not to be awarded merit, you will still be considered for a Faculty of Medicine Outstanding Academic Performance (OAP) award.</i>
                    <br />
                    <br />
                    Please indicate your request below:
                </p>
                <select
                className="select select-bordered w-3/5 mt-5 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-150"
                defaultValue="DEFAULT"
                // onChange={e => setSelectedYear(e.target.value)} // For future use
                >
                <option value="DEFAULT"></option>
                <option value="YES">I do wish to be awarded merit for my academic activities.</option>
                <option value="NO">I do NOT wish to be awarded merit for my academic activities.</option>
                </select>
            </div>
          </div>
        
          {/* Merit Justification*/}
          <div>
            <h2 className="text-lg font-semibold mb-3">Merit Justification</h2>
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm border  overflow-y-auto">
                <div className="bg-gray-100 p-6 rounded-lg shadow-sm border max-h-96 overflow-y-auto border-l-8 border-l-blue-500">
                    <p className="text-gray-500">
                        When requesting merit consideration, please provide a summary of your relevant achievements in the following areas:
                        <br /> 
                        1. Teaching activities and impact, 
                        <br />
                        2. Scholarly activities and accomplishments and 
                        <br />
                        3. Service contributions to the department, faculty, and broader community. 
                        <br />
                        <br />
                        Your summary should highlight key contributions and achievements that support your merit consideration.
                    </p>
                </div>
                {/* Textarea for merit justification */}
                <textarea
                  className="mt-6 w-full rounded-lg border-4 border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 resize-both min-h-[120px] transition-all duration-150"
                  placeholder="Enter your merit justification here... (OPTIONAL)"
                  rows={15}
                />
            </div>
          </div>

          {/* PSA Awards Declaration*/}
          <div>
            <h2 className="text-lg font-semibold mb-3">
                <span className="text-red-500">* </span>
                PSA Awards
            </h2>
            <div className="bg-gray-50 p-16 rounded-lg shadow-sm border overflow-y-auto">
                <p className="text-gray-500">
                    Department Head/School Director reviews and makes recommendations for <b>PSA awards</b> based on the following factors:
                    <br />
                    <br />
                    <ul className="list-disc list-inside">
                        <li>
                            Performance over a period of time which is worthy of recognition;
                        </li>
                        <li>
                            The relationship of a faculty member’s salary to that of other faculty taking into consideration total years of service at UBC; and
                        </li>
                    
                        <li>
                            Market considerations.
                        </li>
                    </ul>
                    <br />
                    <br />
                    Please indicate your request below:
                </p>
                <select
                className="select select-bordered w-3/5 mt-5 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-150"
                defaultValue="DEFAULT"
                // onChange={e => setSelectedYear(e.target.value)} // For future use
                >
                <option value="DEFAULT"></option>
                <option value="YES">I do wish to be considered for PSA.</option>
                <option value="NO">I do NOT wish to be considered for PSA.</option>
                </select>
            </div>
          </div>

          {/* PSA Justification*/}
          <div>
            <h2 className="text-lg font-semibold mb-3">PSA Justification:</h2>
            <div className="bg-gray-50 p-10 rounded-lg shadow-sm border  overflow-y-auto">
                {/* Textarea for PSA justification */}
                <textarea
                  className="mt-6 w-full rounded-lg border-4 border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 resize-both min-h-[100px] transition-all duration-150"
                  placeholder="Enter your PSA justification here... (OPTIONAL)"
                  rows={7}
                />
            </div>
          </div>

          {/* FOM Promotion Review */}
          <div>
            <h2 className="text-lg font-semibold mb-3">
                <span className="text-red-500">* </span>
                FOM Promotion Review
            </h2>
            <div className="bg-gray-50 p-12 rounded-lg shadow-sm border max-h-96 overflow-y-auto">
                <p className="text-gray-500">
                    Please indicate whether you wish to be considered for review for promotion during the upcoming academic year 
                    (July 1, 2023 – June 30, 2024) for an effective of July 1, 2024.
                </p>
                <select
                className="select select-bordered w-3/5 mt-5 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-150"
                defaultValue="DEFAULT"
                // onChange={e => setSelectedYear(e.target.value)} // For future use
                >
                <option value="DEFAULT"></option>
                <option value="YES">I do wish to be considered for promotion.</option>
                <option value="NO">I do NOT wish to be considered for promotion.</option>
                </select>
                <p className="text-gray-500">
                    <br />
                    <b>Please note that all faculty are required to submit an annual activity report, 
                        regardless of whether they wish to be considered for promotion.
                    </b>
                </p>
            </div>
          </div>

            {/* FOM Honorific Impact Report */}
          <div>
            <h2 className="text-lg font-semibold mb-3">FOM Honorific Impact Report</h2>
            <div className="bg-gray-50 p-12 rounded-lg shadow-sm border  overflow-y-auto">
                <p className="text-gray-500">
                    If you are the holder of a Faculty of Medicine Honorific (i.e., Chair, Professorship, Distinguished Scholar), please provide a summary 
                    of the impact your activities have had on the advancement of medical research, education and community service in the recent calendar year.
                    <br />
                    <br />
                    <br />
                    Please complete the field below (approximately 100 words) explaining the impact your activities have made to education and/or research and/or 
                    community service over the past year. Consider this your “elevator pitch” – provide the most impactful highlight(s) of the work being conducted 
                    in the name of the honorific. This information will be used by the Development Office in its report to the stakeholder(s), and may be used more 
                    broadly to bring additional awareness to the Faculty’s accomplishments.
                </p>
                {/* Textarea for Honorific Impact Report */}
                <textarea
                  className="mt-6 w-full rounded-lg border-4 border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 resize-y min-h-[100px] transition-all duration-150"
                  placeholder="Enter your Honorific Impact Report here... (OPTIONAL)"
                  rows={15}
                />
            </div>
          </div>

          <div className="flex justify-end">
            <button className="btn btn-primary mt-6 bg-blue-500 text-white w-1/5 hover:bg-blue-600">Add Record</button>
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
