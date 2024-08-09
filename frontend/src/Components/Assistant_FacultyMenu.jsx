import React, { useState } from "react";
import { TbHome } from "react-icons/tb";
import { HiOutlineAcademicCap } from "react-icons/hi2";
import { TiDownloadOutline } from "react-icons/ti";
import { IoPersonAddOutline } from "react-icons/io5";
import { Link, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { FaRegTrashAlt, FaBars } from "react-icons/fa";

const Assistant_FacultyMenu = ({ userInfo, assistantUserInfo }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleExit = async () => {
    setIsExiting(true);
    try {
      console.log('returning to assistant home');
      navigate('/home');
    } catch (error) {
      console.log('Error during exit:', error);
    }
    setIsExiting(false);
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  }

  return (
    <div className={`py-2 border-r-2 border-neutral ${isCollapsed ? 'w-20' : 'w-60'}`}>
      <button onClick={toggleCollapse} className="btn btn-ghost mb-4">
        <FaBars className="h-5 w-5" />
      </button>
      <ul className="menu rounded-box flex-shrink-0">
        <li className={`mb-2 ${location.pathname === '/assistant/home' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/assistant/home'>
            <TbHome className="h-5 w-5" />
            {!isCollapsed && <p className={`ml-2 ${location.pathname === '/assistant/home' ? 'font-bold' : ''}`}>{userInfo.preferred_name || userInfo.first_name}</p>}
          </Link>
        </li>
        <li className={`mb-2 ${location.pathname === '/assistant/academic-work' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/assistant/academic-work'>
            <HiOutlineAcademicCap className="h-5 w-5" />
            {!isCollapsed && <p className={`ml-2 ${location.pathname === '/assistant/academic-work' ? 'font-bold' : ''}`}>Academic Work</p>}
          </Link>
        </li>
        <li className={`mb-2 ${location.pathname === '/assistant/reports' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/assistant/reports'>
            <TiDownloadOutline className="h-5 w-5" />
            {!isCollapsed && <p className={`ml-2 ${location.pathname === '/assistant/reports' ? 'font-bold' : ''}`}>Reports</p>}
          </Link>
        </li>
        <li className={`mb-2 ${location.pathname === '/assistant/assistants' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/assistant/assistants'>
            <IoPersonAddOutline className="h-5 w-5" />
            {!isCollapsed && <p className={`ml-2 ${location.pathname === '/assistant/assistants' ? 'font-bold' : ''}`}>Assistants</p>}
          </Link>
        </li>
        <li className={`mb-2 ${location.pathname === '/assistant/archive' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/assistant/archive'>
            <FaRegTrashAlt className="h-4 w-4" />
            {!isCollapsed && <p className={`ml-2 ${location.pathname === '/assistant/archive' ? 'font-bold' : ''}`}>Archive</p>}
          </Link>
        </li>
        {!isCollapsed && (
          <li className="mt-auto pt-4">
            <button 
              className="text-white btn btn-warning py-1 px-4 w-full mx-auto min-h-0 h-8 leading-tight" 
              onClick={handleExit} 
              disabled={isExiting}>
              {isExiting ? 'Exiting...' : 'Exit Profile'}
            </button>
          </li>
        )}
      </ul>
    </div>
  )
}

export default Assistant_FacultyMenu;
