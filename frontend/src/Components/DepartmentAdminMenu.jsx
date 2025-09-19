import React, { useState, useEffect } from "react";
import { FaUsers, FaChartLine, FaFileAlt, FaUsersCog, FaArchive, FaFolderOpen, FaRegClipboard } from "react-icons/fa";
import { MdSupportAgent } from "react-icons/md";
import { Link, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const AdminMenu = ({ userName, getCognitoUser, toggleViewMode }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [showText, setShowText] = useState(true);

  const handleToggle = () => {
    // toggleViewMode(); // Call the toggle function passed as a prop
    if (typeof toggleViewMode === "function") {
      toggleViewMode();
    } else {
      console.error("toggleViewMode is not a function");
    }
  };

  useEffect(() => {
    let timer;
    if (!isCollapsed) {
      timer = setTimeout(() => setShowText(true), 150);
    } else {
      setShowText(false);
    }

    return () => clearTimeout(timer);
  }, [isCollapsed]);

  return (
    <div
      className={`relative transition-all duration-150 ease-in-out py-2 border-r-2 border-neutral max-h-screen ${
        isCollapsed ? "w-18" : "w-60"
      }`}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <ul className="menu rounded-box flex-shrink-0">
        <li className={`mb-2 ${location.pathname === "/department-admin/dashboard" ? "bg-gray-200 rounded-lg" : ""}`}>
          <Link to="/department-admin/dashboard">
            <FaChartLine className="h-5 w-5" />
            {showText && !isCollapsed && (
              <p className={`ml-2 ${location.pathname === "/department-admin/dashboard" ? "font-bold" : ""}`}>
                Dashboard
              </p>
            )}
          </Link>
        </li>
        <li className={`mb-2 ${location.pathname === "/department-admin/members" ? "bg-gray-200 rounded-lg" : ""}`}>
          <Link to="/department-admin/members">
            <FaUsers className="h-5 w-5" />
            {showText && !isCollapsed && (
              <p className={`ml-2 ${location.pathname === "/department-admin/members" ? "font-bold" : ""}`}>
                Manage Members
              </p>
            )}
          </Link>
        </li>
        <li className={`mb-2 ${location.pathname === "/department-admin/templates" ? "bg-gray-200 rounded-lg" : ""}`}>
          <Link to="/department-admin/templates">
            <FaFolderOpen className="h-5 w-5" /> {/* Changed to folder icon */}
            {showText && !isCollapsed && (
              <p className={`ml-2 ${location.pathname === "/department-admin/templates" ? "font-bold" : ""}`}>
                CV Templates
              </p>
            )}
          </Link>
        </li>
        <li className={`mb-2 ${location.pathname === "/department-admin/generate" ? "bg-gray-200 rounded-lg" : ""}`}>
          <Link to="/department-admin/generate">
            <FaFileAlt className="h-5 w-5" />
            {showText && !isCollapsed && (
              <p className={`ml-2 ${location.pathname === "/department-admin/generate" ? "font-bold" : ""}`}>
                Generate CV
              </p>
            )}
          </Link>
        </li>
        <li className={`mb-2 ${location.pathname === "/department-admin/declaration" ? "bg-gray-200 rounded-lg" : ""}`}>
          <Link to="/department-admin/declaration">
            <FaUsersCog className="h-5 w-5" />
            {showText && !isCollapsed && (
              <p className={`ml-2 ${location.pathname === "/department-admin/declaration" ? "font-bold" : ""}`}>
                Declarations Report
              </p>
            )}
          </Link>
        </li>
           <li className={`mb-2 ${location.pathname === "/department-admin/reporting" ? "bg-gray-200 rounded-lg" : ""}`}>
          <Link to="/department-admin/reporting">
            <FaUsersCog className="h-5 w-5" />
            {showText && !isCollapsed && (
              <p className={`ml-2 ${location.pathname === "/department-admin/reporting" ? "font-bold" : ""}`}>
                Academic Sections Report
              </p>
            )}
          </Link>
        </li>
        <li className={`mb-2 ${location.pathname === "/loggings" ? "bg-gray-200 rounded-lg" : ""}`}>
          <Link to="/loggings">
            <FaRegClipboard className="h-5 w-5" />
            {showText && !isCollapsed && (
              <p className={`ml-2 ${location.pathname === "/loggings" ? "font-bold" : ""}`}>Access Logs</p>
            )}
          </Link>
        </li>
        <li className={`mb-2 ${location.pathname === "/support" ? "bg-gray-200 rounded-lg" : ""}`}>
          <Link to="/support">
            <MdSupportAgent className="h-5 w-5" />
            {showText && !isCollapsed && (
              <p className={`ml-2 ${location.pathname === "/support" ? "font-bold" : ""}`}>Support</p>
            )}
          </Link>
        </li>
        {/* <li
          className={`mb-6 ${
            location.pathname === "/department-admin/archived-sections" ? "bg-gray-200 rounded-lg" : ""
          }`}
        >
          <Link to="/department-admin/archived-sections">
            <FaArchive className="h-5 w-5" /> 
            {showText && !isCollapsed && (
              <p className={`ml-2 ${location.pathname === "/department-admin/archived-sections" ? "font-bold" : ""}`}>
                Archived Sections
              </p>
            )}
          </Link>
        </li> */}
      </ul>

      {/* Toggle Button */}
      {/* { isHomePage && (<div className="absolute bottom-16 left-0 w-full flex justify-center">
        {!isCollapsed && showText && (
          <button
            className={`text-white btn py-1 px-4 w-44 min-h-0 h-12 leading-tight focus:outline-none bg-yellow-400`}
            onClick={handleToggle} // Call the handleToggle function here
          >
            Switch to Faculty View
          </button>
        )}
      </div>)} */}

      {/* Sign Out Button */}
      {/* <div className="absolute bottom-3 left-0 w-full flex justify-center">
        {!isCollapsed && showText && (
          <button 
            className="text-white btn btn-warning py-1 px-4 w-44 min-h-0 h-8 leading-tight focus:outline-none hover:bg-warning-dark"
            onClick={handleSignOut} 
            disabled={isSigningOut}
          >
            {isSigningOut ? 'Signing Out...' : 'Sign Out'}
          </button>
        )}
      </div> */}
    </div>
  );
};

export default AdminMenu;
