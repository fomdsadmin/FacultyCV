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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showText, setShowText] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      getCognitoUser();
      navigate("/auth");
    } catch (error) {
    } finally {
      setIsSigningOut(false);
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

  const handleBackToHome = () => {
    navigate("/dashboard");
  };

  return (
    <div
      className={`relative transition-all duration-150 ease-in-out py-2 border-r-2 border-neutral max-h-screen ${
        isCollapsed ? "w-18" : "w-60"
      }`}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <div className="mb-6">
        {/* Back Button */}
        <button
          onClick={handleBackToHome}
          className="text-black btn btn-ghost min-h-0 h-8 py-1 mt-2 ml-2 flex items-center justify-start w-[92%]"
        >
          <FaArrowLeft className="h-4 w-4" />
          {!isCollapsed && showText && <span className="ml-2">Back</span>}
        </button>
      </div>

      {/* Admin View */}
      <div className="mt-4 flex items-center justify-between">
        {!isCollapsed && showText && (
          <div className="px-4 h-8 py-1 mb-4 ml-2 flex items-center justify-start">
            <FaUser className="h-5 w-5" />
            <p className="ml-4 font-bold">Admin View</p>
          </div>
        )}

        {isCollapsed && (
          <div className="px-4 h-8 py-1 mb-4 ml-2 flex items-center justify-start">
            <FaUser className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Tabs */}
      <ul className="menu rounded-box flex-shrink-0">
        <li
          className={`mb-2 ${
            location.pathname === "/home" ? "bg-gray-200 rounded-lg" : ""
          }`}
        >
          <Link to="/home">
            <FaUsers className="h-5 w-5" />
            {showText && !isCollapsed && (
              <p
                className={`ml-2 ${
                  location.pathname === "/home" ? "font-bold" : ""
                }`}
              >
                Users
              </p>
            )}
          </Link>
        </li>
        <li
          className={`mb-2 ${
            location.pathname === "/analytics" ? "bg-gray-200 rounded-lg" : ""
          }`}
        >
          <Link to="/analytics">
            <FaChartLine className="h-5 w-5" />
            {showText && !isCollapsed && (
              <p
                className={`ml-2 ${
                  location.pathname === "/analytics" ? "font-bold" : ""
                }`}
              >
                Analytics
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
                Audit
              </p>
            )}
          </Link>
        </li>
      </ul>

      {/* Sign Out Button */}
      <div className="left-0 w-full flex justify-center">
        {!isCollapsed && showText && (
          <button
            className="text-white btn btn-warning py-1 px-4 w-44 min-h-0 h-8 leading-tight focus:outline-none hover:bg-warning-dark"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? "Signing Out..." : "Sign Out"}
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminMenu;
