import React, { useEffect, useState } from "react";
import { TbHome } from "react-icons/tb";
import { HiOutlineAcademicCap } from "react-icons/hi2";
import { TiDownloadOutline } from "react-icons/ti";
import { IoPersonAddOutline } from "react-icons/io5";
import { Link, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { FaRegTrashAlt } from "react-icons/fa";
import { MdSupportAgent } from "react-icons/md";

const DelegateMenu = ({ userInfo, assistantUserInfo }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [showText, setShowText] = useState(true);

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
        <li className={`mb-2 ${location.pathname === '/delegate/home' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/delegate/home'>
            <TbHome className="h-5 w-5" />
            {showText && !isCollapsed && <p className={`ml-2 ${location.pathname === '/delegate/home' ? 'font-bold' : ''}`}>Delegate Home</p>}
          </Link>
        </li>
        {/* <li className={`mb-2 ${location.pathname === '/assistant/academic-work' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/assistant/academic-work'>
            <HiOutlineAcademicCap className="h-5 w-5" />
            {showText && !isCollapsed && <p className={`ml-2 ${location.pathname === '/assistant/academic-work' ? 'font-bold' : ''}`}>Academic Work</p>}
          </Link>
        </li> */}
        {/* <li className={`mb-2 ${location.pathname === '/assistant/reports' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/assistant/reports'>
            <TiDownloadOutline className="h-5 w-5" />
            {showText && !isCollapsed && <p className={`ml-2 ${location.pathname === '/assistant/reports' ? 'font-bold' : ''}`}>Reports</p>}
          </Link>
        </li> */}
        <li className={`mb-2 ${location.pathname === '/delegate/connections' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/delegate/connections'>
            <IoPersonAddOutline className="h-5 w-5" />
            {showText && !isCollapsed && <p className={`ml-2 ${location.pathname === '/delegate/connections' ? 'font-bold' : ''}`}>Connections</p>}
          </Link>
        </li>
        <li className={`mb-2 ${location.pathname === '/delegate/support' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/delegate/support'>
            <MdSupportAgent className="h-5 w-5" />
            {showText && !isCollapsed && (
              <p className={`ml-2 ${location.pathname === '/delegate/support' ? 'font-bold' : ''}`}>Support</p>
            )}
          </Link>
        </li>
        {/* <li className={`mb-6 ${location.pathname === '/assistant/archive' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/assistant/archive'>
            <FaRegTrashAlt className="h-4 w-4" />
            {showText && !isCollapsed && <p className={`ml-2 ${location.pathname === '/assistant/archive' ? 'font-bold' : ''}`}>Archive</p>}
          </Link>
        </li> */}
      </ul>
    </div>
  )
}

export default DelegateMenu;
