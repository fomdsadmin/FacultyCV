import React, { useState, useEffect } from "react";
import { FaUsers, FaChartLine, FaFileAlt, FaUsersCog, FaCog, FaHome, FaRegClipboard } from "react-icons/fa";
import { HiSwitchHorizontal } from "react-icons/hi";
import { Link, useLocation } from "react-router-dom";
import { signOut } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";

const FacultyAdminMenu = ({ userName, getCognitoUser, userInfo, toggleViewMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [showText, setShowText] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let timer;

    if (!isCollapsed) {
      timer = setTimeout(() => setShowText(true), 150);
    } else {
      setShowText(false);
    }

    return () => clearTimeout(timer);
  }, [isCollapsed]);

  // Determine faculty from role
  const faculty = userInfo?.role === 'Admin' ? 'All' :
    userInfo?.role?.startsWith('FacultyAdmin-') ? userInfo.role.split('FacultyAdmin-')[1] : '';

  return (
    <div
      className={`relative transition-all duration-150 ease-in-out py-2 border-r-2 border-neutral max-h-screen ${isCollapsed ? "w-18" : "w-60"
        }`}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >

      {/* Navigation Menu */}
      <ul className="menu rounded-box flex-shrink-0">
        <li className={`mb-2 ${location.pathname === "/faculty-admin/home" ? "bg-gray-200 rounded-lg" : ""}`}>
          <Link to="/faculty-admin/home">
            <FaHome className="h-5 w-5" />
            {showText && !isCollapsed && (
              <p className={`ml-2 ${location.pathname === "/faculty-admin/home" ? "font-bold" : ""}`}>
                Home
              </p>
            )}
          </Link>
        </li>

        <li className={`mb-2 ${location.pathname === "/faculty-admin/users" ? "bg-gray-200 rounded-lg" : ""}`}>
          <Link to="/faculty-admin/users">
            <FaUsers className="h-5 w-5" />
            {showText && !isCollapsed && (
              <p className={`ml-2 ${location.pathname === "/faculty-admin/users" ? "font-bold" : ""}`}>
                Users
              </p>
            )}
          </Link>
        </li>

        <li className={`mb-2 ${location.pathname === "/faculty-admin/generate-cv" ? "bg-gray-200 rounded-lg" : ""}`}>
          <Link to="/faculty-admin/generate-cv">
            <FaFileAlt className="h-5 w-5" />
            {showText && !isCollapsed && (
              <p className={`ml-2 ${location.pathname === "/faculty-admin/generate-cv" ? "font-bold" : ""}`}>
                Generate CV
              </p>
            )}
          </Link>
        </li>
        <li
          className={`mb-2 ${location.pathname === "/audit" ? "bg-gray-200 rounded-lg" : ""
            }`}
        >
          <Link to="/audit">
            <FaRegClipboard className="h-5 w-5" />
            {showText && !isCollapsed && (
              <p
                className={`ml-2 ${location.pathname === "/audit" ? "font-bold" : ""
                  }`}
              >
                Activity Logs
              </p>
            )}
          </Link>

        </li>
      </ul>

    </div>
  );
};

export default FacultyAdminMenu;
