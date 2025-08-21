import React, { useState, useEffect } from "react";
import {
  FaUsers,
  FaChartLine,
  FaFileAlt,
  FaThList,
  FaTrashAlt,
  FaRegClipboard,
  FaUser,
  FaArrowLeft,
} from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signOut } from "aws-amplify/auth";

const AdminMenu = ({ userName, getCognitoUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [showText, setShowText] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // const handleSignOut = async () => {
  //   setIsSigningOut(true);
  //   try {
  //     await signOut();
  //     getCognitoUser();
  //     navigate("/auth");
  //   } catch (error) {
  //   } finally {
  //     setIsSigningOut(false);
  //   }
  // };

  useEffect(() => {
    let timer;

    if (!isCollapsed) {
      timer = setTimeout(() => setShowText(true), 150);
    } else {
      setShowText(false);
    }

    return () => clearTimeout(timer);
  }, [isCollapsed]);

  const handleBackToHome = () => {
    navigate("/faculty/dashboard");
  };

  return (
    <div
      className={`relative transition-all duration-150 ease-in-out py-2 border-r-2 border-neutral max-h-screen ${
        isCollapsed ? "w-18" : "w-60"
      }`}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >

      {/* Tabs */}
      <ul className="menu rounded-box flex-shrink-0">
                <li
          className={`mb-2 ${
            location.pathname === "/admin/home" ? "bg-gray-200 rounded-lg" : ""
          }`}
        >
          <Link to="/admin/home">
            <FaChartLine className="h-5 w-5" />
            {showText && !isCollapsed && (
              <p
                className={`ml-2 ${
                  location.pathname === "/admin/home" ? "font-bold" : ""
                }`}
              >
                Home
              </p>
            )}
          </Link>
        </li>
        <li
          className={`mb-2 ${
            location.pathname === "/admin/users" ? "bg-gray-200 rounded-lg" : ""
          }`}
        >
          <Link to="/admin/users">
            <FaUsers className="h-5 w-5" />
            {showText && !isCollapsed && (
              <p
                className={`ml-2 ${
                  location.pathname === "/admin/users" ? "font-bold" : ""
                }`}
              >
                Users
              </p>
            )}
          </Link>
        </li>
        <li
          className={`mb-2 ${
            location.pathname === "/admin/generate" ? "bg-gray-200 rounded-lg" : ""
          }`}
        >
          <Link to="/admin/generate">
            <FaFileAlt className="h-5 w-5" />
            {showText && !isCollapsed && (
              <p
                className={`ml-2 ${
                  location.pathname === "/admin/generate" ? "font-bold" : ""
                }`}
              >
                Generate CV
              </p>
            )}
          </Link>
        </li>
        <li
          className={`mb-2 ${
            location.pathname === "/templates" ? "bg-gray-200 rounded-lg" : ""
          }`}
        >
          <Link to="/templates">
            <FaFileAlt className="h-5 w-5" />
            {showText && !isCollapsed && (
              <p
                className={`ml-2 ${
                  location.pathname === "/templates" ? "font-bold" : ""
                }`}
              >
                Templates
              </p>
            )}
          </Link>
        </li>
        <li
          className={`mb-2 ${
            location.pathname === "/sections" ? "bg-gray-200 rounded-lg" : ""
          }`}
        >
          <Link to="/sections">
            <FaThList className="h-5 w-5" />
            {showText && !isCollapsed && (
              <p
                className={`ml-2 ${
                  location.pathname === "/sections" ? "font-bold" : ""
                }`}
              >
                Sections
              </p>
            )}
          </Link>
        </li>
        <li
          className={`mb-6 ${
            location.pathname === "/archived-sections"
              ? "bg-gray-200 rounded-lg"
              : ""
          }`}
        >
          <Link to="/archived-sections">
            <FaTrashAlt className="h-4 w-4" />
            {showText && !isCollapsed && (
              <p
                className={`ml-2 ${
                  location.pathname === "/archived-sections" ? "font-bold" : ""
                }`}
              >
                Archived Sections
              </p>
            )}
          </Link>
        </li>
        <li
          className={`mb-6 ${
            location.pathname === "/audit" ? "bg-gray-200 rounded-lg" : ""
          }`}
        >
          <Link to="/audit">
            <FaRegClipboard className="h-4 w-4" />
            {showText && !isCollapsed && (
              <p
                className={`ml-2 ${
                  location.pathname === "/audit" ? "font-bold" : ""
                }`}
              >
                Activity Logs
              </p>
            )}
          </Link>
        </li>
      </ul>

      {/* Sign Out Button */}
      {/* <div className="left-0 w-full flex justify-center">
        {!isCollapsed && showText && (
          <button
            className="text-white btn btn-warning py-1 px-4 w-44 min-h-0 h-8 leading-tight focus:outline-none hover:bg-warning-dark"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? "Signing Out..." : "Sign Out"}
          </button>
        )}
      </div> */}
    </div>
  );
};

export default AdminMenu;
