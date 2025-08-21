import React, { useState, useEffect } from "react";
import { TbHome } from "react-icons/tb";
import { HiOutlineAcademicCap } from "react-icons/hi2";
import { HiOutlineDocumentText } from "react-icons/hi2";
import { TiDownloadOutline } from "react-icons/ti";
import { IoPersonAddOutline } from "react-icons/io5";
import { FaRegClipboard } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import { signOut } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import { FaRegTrashAlt } from "react-icons/fa";
import { LuLayoutDashboard } from "react-icons/lu";
import { MdSupportAgent } from "react-icons/md";

const FacultyMenu = ({
  userName,
  getCognitoUser,
  toggleViewMode,
  userInfo,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [showText, setShowText] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

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

  const handleToggle = () => {
    toggleViewMode();
  };

  useEffect(() => {
    let timer;
    if (!isCollapsed) {
      timer = setTimeout(() => setShowText(true), 150);
    } else {
      setShowText(false);
    }

    return () => clearTimeout(timer);
  }, [isCollapsed, userInfo]);

  return (
    <div className={`${isCollapsed ? "pr-24" : "pr-60"}`}>
      <div
        className={`fixed top-18 min-h-[100vh] left-0 z-50 bg-white transition-all duration-150 ease-in-out py-2 border-r-2 border-neutral max-h-[calc(100vh-5rem)] overflow-y-auto
        ${isCollapsed ? "w-18" : "w-60"}
      `}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
        style={{ height: "calc(100vh - 5rem)" }} // 5rem = 80px = h-20 header
      >
        <ul className="menu rounded-box flex-shrink-0">
          <li
            className={`mb-2 ${
              location.pathname === "/faculty/dashboard" ? "bg-gray-200 rounded-lg" : ""
            }`}
          >
            <Link to="/faculty/dashboard">
              <LuLayoutDashboard className="h-5 w-5" />
              {showText && !isCollapsed && (
                <p
                  className={`ml-2 ${
                    location.pathname === "/faculty/dashboard" ? "font-bold" : ""
                  }`}
                >
                  Dashboard
                </p>
              )}
            </Link>
          </li>
          <li
            className={`mb-2 ${
              location.pathname === "/faculty/home" ? "bg-gray-200 rounded-lg" : ""
            }`}
          >
            <Link to="/faculty/home">
              <TbHome className="h-5 w-5" />
              {showText && !isCollapsed && (
                <p
                  className={`ml-2 ${
                    location.pathname === "/faculty/home" ? "font-bold" : ""
                  }`}
                >
                  Home
                </p>
              )}
            </Link>
          </li>
          <li
            className={`mb-2 ${
              location.pathname === "/faculty/academic-work"
                ? "bg-gray-200 rounded-lg"
                : ""
            }`}
          >
            <Link to="/faculty/academic-work">
              <HiOutlineAcademicCap className="h-5 w-5" />
              {showText && !isCollapsed && (
                <p
                  className={`ml-2 ${
                    location.pathname === "/faculty/academic-work" ? "font-bold" : ""
                  }`}
                >
                  Academic Work
                </p>
              )}
            </Link>
          </li>
          <li
            className={`mb-2 ${
              location.pathname === "/faculty/declarations"
                ? "bg-gray-200 rounded-lg"
                : ""
            }`}
          >
            <Link to="/faculty/declarations">
              <HiOutlineDocumentText className="h-5 w-5" />
              {showText && !isCollapsed && (
                <p
                  className={`ml-2 ${
                    location.pathname === "/declarations" ? "font-bold" : ""
                  }`}
                >
                  Declarations
                </p>
              )}
            </Link>
          </li>

          <li
            className={`mb-2 ${
              location.pathname === "/faculty/reports" ? "bg-gray-200 rounded-lg" : ""
            }`}
          >
            <Link to="/faculty/reports">
              <TiDownloadOutline className="h-5 w-5" />
              {showText && !isCollapsed && (
                <p
                  className={`ml-2 ${
                    location.pathname === "/faculty/reports" ? "font-bold" : ""
                  }`}
                >
                  Reports
                </p>
              )}
            </Link>
          </li>

          <li
            className={`mb-2 ${location.pathname === "/loggings" ? "bg-gray-200 rounded-lg" : ""
                }`}
            >
            <Link to="/loggings">
              <FaRegClipboard className="h-5 w-5" />
              {showText && !isCollapsed && (
                <p
                  className={`ml-2 ${location.pathname === "/loggings" ? "font-bold" : ""
                    }`}
                >
                  Loggings
                </p>
              )}
            </Link>

          </li>

          <li
            className={`mb-2 ${
              location.pathname === "/faculty/assistants"
                ? "bg-gray-200 rounded-lg"
                : ""
            }`}
          >
            <Link to="/faculty/assistants">
              <IoPersonAddOutline className="h-5 w-5" />
              {showText && !isCollapsed && (
                <p
                  className={`ml-2 ${
                    location.pathname === "/faculty/assistants" ? "font-bold" : ""
                  }`}
                >
                  Delegates
                </p>
              )}
            </Link>
          </li>
          <li
            className={`mb-6 ${
              location.pathname === "/archive" ? "bg-gray-200 rounded-lg" : ""
            }`}
          >
            <Link to="/archive">
              <FaRegTrashAlt className="h-5 w-5" />
              {showText && !isCollapsed && (
                <p
                  className={`ml-2 ${
                    location.pathname === "/archive" ? "font-bold" : ""
                  }`}
                >
                  Archive
                </p>
              )}
            </Link>
          </li>
          <li
            className={`mb-2 ${
              location.pathname === "/support" ? "bg-gray-200 rounded-lg" : ""
            }`}
          >
            <Link to="/support">
              <MdSupportAgent className="h-5 w-5" />
              {showText && !isCollapsed && (
                <p
                  className={`ml-2 ${
                    location.pathname === "/support" ? "font-bold" : ""
                  }`}
                >
                  Support
                </p>
              )}
            </Link>
          </li>
        </ul>
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
    </div>
  );
};

export default FacultyMenu;
