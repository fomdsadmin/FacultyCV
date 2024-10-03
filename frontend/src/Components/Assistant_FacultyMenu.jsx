import React, { useEffect, useState } from "react";
import { TbHome } from "react-icons/tb";
import { HiOutlineAcademicCap } from "react-icons/hi2";
import { TiDownloadOutline } from "react-icons/ti";
import { Link, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { FaRegTrashAlt } from "react-icons/fa";

const Assistant_FacultyMenu = ({ userInfo, assistantUserInfo }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showText, setShowText] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const handleExit = async () => {
    setIsExiting(true);
    try {
      
      navigate('/home');
    } catch (error) {
      
    }
    setIsExiting(false);
  }

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
      className={`relative transition-all duration-150 ease-in-out py-2 border-r-2 border-neutral`}
      style={{ maxHeight: `calc(100vh - 4rem)`, width: isCollapsed ? '4.5rem' : '15rem' }}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <ul className="menu rounded-box flex-shrink-0">
        <li className={`mb-2 ${location.pathname === '/assistant/home' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/assistant/home'>
            <TbHome className="h-5 w-5" />
            {showText && !isCollapsed && <p className={`ml-2 ${location.pathname === '/assistant/home' ? 'font-bold' : ''}`}>{userInfo.preferred_name || userInfo.first_name}</p>}
          </Link>
        </li>
        <li className={`mb-2 ${location.pathname === '/assistant/academic-work' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/assistant/academic-work'>
            <HiOutlineAcademicCap className="h-5 w-5" />
            {showText && !isCollapsed && <p className={`ml-2 ${location.pathname === '/assistant/academic-work' ? 'font-bold' : ''}`}>Academic Work</p>}
          </Link>
        </li>
        <li className={`mb-2 ${location.pathname === '/assistant/reports' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/assistant/reports'>
            <TiDownloadOutline className="h-5 w-5" />
            {showText && !isCollapsed && <p className={`ml-2 ${location.pathname === '/assistant/reports' ? 'font-bold' : ''}`}>Reports</p>}
          </Link>
        </li>
        {/* <li className={`mb-2 ${location.pathname === '/assistant/assistants' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/assistant/assistants'>
            <IoPersonAddOutline className="h-5 w-5" />
            {showText && !isCollapsed && <p className={`ml-2 ${location.pathname === '/assistant/assistants' ? 'font-bold' : ''}`}>Assistants</p>}
          </Link>
        </li> */}
        <li className={`mb-6 ${location.pathname === '/assistant/archive' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/assistant/archive'>
            <FaRegTrashAlt className="h-4 w-4" />
            {showText && !isCollapsed && <p className={`ml-2 ${location.pathname === '/assistant/archive' ? 'font-bold' : ''}`}>Archive</p>}
          </Link>
        </li>
        <div className="absolute bottom-3 left-0 w-full flex justify-center">
          {!isCollapsed && showText && (
            <button 
              className="text-white btn btn-warning py-1 px-4 w-44 min-h-0 h-8 leading-tight focus:outline-none hover:bg-warning-dark"
              onClick={handleExit} 
              disabled={isExiting}>
              {isExiting ? 'Exiting...' : 'Exit Profile'}
            </button>
          )}
        </div>
      </ul>
    </div>
  )
}

export default Assistant_FacultyMenu;
