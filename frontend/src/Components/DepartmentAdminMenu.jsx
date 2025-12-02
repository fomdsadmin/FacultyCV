import React, { useState, useEffect } from "react";
import {
  FaUsers,
  FaChartLine,
  FaFileAlt,
  FaUsersCog,
  FaArchive,
  FaFolderOpen,
  FaRegClipboard,
  FaCertificate,
  FaGraduationCap,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { MdSupportAgent } from "react-icons/md";
import { Link, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const AdminMenu = ({ userName, getCognitoUser, toggleViewMode }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [showText, setShowText] = useState(true);
  const [isReportingDropdownOpen, setIsReportingDropdownOpen] = useState(false);

  const handleToggle = () => {
    // toggleViewMode(); // Call the toggle function passed as a prop
    if (typeof toggleViewMode === "function") {
      toggleViewMode();
    } else {
      console.error("toggleViewMode is not a function");
    }
  };

  // Check if any reporting route is active
  const isReportingActive = [
    "/department-admin/declarations",
    "/department-admin/affiliations",
    "/department-admin/reporting",
    "/department-admin/generate",
  ].includes(location.pathname);

  const toggleReportingDropdown = () => {
    setIsReportingDropdownOpen(!isReportingDropdownOpen);
  };

  useEffect(() => {
    let timer;
    if (!isCollapsed) {
      timer = setTimeout(() => setShowText(true), 150);
    } else {
      setShowText(false);
      setIsReportingDropdownOpen(false); // Close dropdown when sidebar collapses
    }

    return () => clearTimeout(timer);
  }, [isCollapsed]);

  // Auto-open reporting dropdown if user is on a reporting page
  useEffect(() => {
    if (isReportingActive && !isCollapsed) {
      setIsReportingDropdownOpen(true);
    }
  }, [isReportingActive, isCollapsed]);

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
                Templates
              </p>
            )}
          </Link>
        </li>

        {/* Reporting Dropdown */}
        <li className={`mb-2 ${isReportingActive ? "bg-gray-200 rounded-lg" : ""}`}>
          <div
            className={`flex items-center justify-between cursor-pointer p-2 ${isReportingActive ? "font-bold" : ""}`}
            onClick={showText && !isCollapsed ? toggleReportingDropdown : undefined}
          >
            <div className="flex items-center">
              <FaChartLine className="h-5 w-5 ml-2" />
              {showText && !isCollapsed && <p className="ml-4">Reporting</p>}
            </div>
            {showText &&
              !isCollapsed &&
              (isReportingDropdownOpen ? <FaChevronUp className="h-3 w-3" /> : <FaChevronDown className="h-3 w-3" />)}
          </div>

          {/* Dropdown Items */}
          {showText && !isCollapsed && isReportingDropdownOpen && (
            <ul className="p-2 mt-1 space-y-1">
              <li className={`${location.pathname === "/department-admin/generate" ? "bg-blue-100 rounded" : ""}`}>
                <Link
                  to="/department-admin/generate"
                  className="flex items-center p-2 text-sm hover:bg-gray-100 rounded"
                >
                  <FaFileAlt className="h-4 w-4 mr-2" />
                  <span className={location.pathname === "/department-admin/generate" ? "font-semibold" : ""}>
                    Generate CV/AAR
                  </span>
                </Link>
              </li>
              <li className={`${location.pathname === "/department-admin/declarations" ? "bg-blue-100 rounded" : ""}`}>
                <Link
                  to="/department-admin/declarations"
                  className="flex items-center p-2 text-sm hover:bg-gray-100 rounded"
                >
                  <FaCertificate className="h-4 w-4 mr-2" />
                  <span className={location.pathname === "/department-admin/declarations" ? "font-semibold" : ""}>
                    Declarations Report
                  </span>
                </Link>
              </li>
              <li className={`${location.pathname === "/department-admin/reporting" ? "bg-blue-100 rounded" : ""}`}>
                <Link
                  to="/department-admin/reporting"
                  className="flex items-center p-2 text-sm hover:bg-gray-100 rounded"
                >
                  <FaGraduationCap className="h-4 w-4 mr-2" />
                  <span className={location.pathname === "/department-admin/reporting" ? "font-semibold" : ""}>
                    Academic Sections Report
                  </span>
                </Link>
              </li>
              <li className={`${location.pathname === "/department-admin/affiliations" ? "bg-blue-100 rounded" : ""}`}>
                <Link
                  to="/department-admin/affiliations"
                  className="flex items-center p-2 text-sm hover:bg-gray-100 rounded"
                >
                  <FaUsersCog className="h-4 w-4 mr-2" />
                  <span className={location.pathname === "/department-admin/affiliations" ? "font-semibold" : ""}>
                    Affiliations Report
                  </span>
                </Link>
              </li>
            </ul>
          )}
        </li>
        {/* <li className={`mb-2 ${location.pathname === "/support" ? "bg-gray-200 rounded-lg" : ""}`}>
          <Link to="/support">
            <MdSupportAgent className="h-5 w-5" />
            {showText && !isCollapsed && (
              <p className={`ml-2 ${location.pathname === "/support" ? "font-bold" : ""}`}>Support</p>
            )}
          </Link>
        </li> */}
        <li className={`mb-2 ${location.pathname === "/loggings" ? "bg-gray-200 rounded-lg" : ""}`}>
          <Link to="/loggings">
            <FaRegClipboard className="h-5 w-5" />
            {showText && !isCollapsed && (
              <p className={`ml-2 ${location.pathname === "/loggings" ? "font-bold" : ""}`}>Access Logs</p>
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
