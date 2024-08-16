import React, { useState } from "react";
import { TbHome } from "react-icons/tb";
import { HiOutlineAcademicCap } from "react-icons/hi2";
import { TiDownloadOutline } from "react-icons/ti";
import { IoPersonAddOutline } from "react-icons/io5";
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import { FaRegTrashAlt, FaBars } from "react-icons/fa";

const FacultyMenu = ({ userName, getCognitoUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      
      getCognitoUser();
      
      navigate('/auth');
    } catch (error) {
      
    } finally {
      setIsSigningOut(false);
    }
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  }

  return (
    <div className={`py-2 border-r-2 border-neutral max-h-screen ${isCollapsed ? 'w-20' : 'w-60'}`}>
      <button onClick={toggleCollapse} className="btn btn-ghost mb-4">
        <FaBars className="h-5 w-5" />
      </button>
      <ul className="menu rounded-box flex-shrink-0">
        <li className={`mb-2 ${location.pathname === '/home' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/home'>
            <TbHome className="h-5 w-5" />
            {!isCollapsed && <p className={`ml-2 ${location.pathname === '/home' ? 'font-bold' : ''}`}>{userName}</p>}
          </Link>
        </li>
        <li className={`mb-2 ${location.pathname === '/academic-work' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/academic-work'>
            <HiOutlineAcademicCap className="h-5 w-5" />
            {!isCollapsed && <p className={`ml-2 ${location.pathname === '/academic-work' ? 'font-bold' : ''}`}>Academic Work</p>}
          </Link>
        </li>
        <li className={`mb-2 ${location.pathname === '/reports' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/reports'>
            <TiDownloadOutline className="h-5 w-5" />
            {!isCollapsed && <p className={`ml-2 ${location.pathname === '/reports' ? 'font-bold' : ''}`}>Reports</p>}
          </Link>
        </li>
        <li className={`mb-2 ${location.pathname === '/assistants' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/assistants'>
            <IoPersonAddOutline className="h-5 w-5" />
            {!isCollapsed && <p className={`ml-2 ${location.pathname === '/assistants' ? 'font-bold' : ''}`}>Assistants</p>}
          </Link>
        </li>
        <li className={`mb-6 ${location.pathname === '/archive' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/archive'>
            <FaRegTrashAlt className="h-4 w-4" />
            {!isCollapsed && <p className={`ml-2 ${location.pathname === '/archive' ? 'font-bold' : ''}`}>Archive</p>}
          </Link>
        </li>
        {!isCollapsed && (
          <li className="mt-auto">
            <button 
              className="text-white btn btn-warning py-1 px-4 w-full mx-auto min-h-0 h-8 leading-tight" 
              onClick={handleSignOut} 
              disabled={isSigningOut}>
              {isSigningOut ? 'Signing Out...' : 'Sign Out'}
            </button>
          </li>
        )}
      </ul>
    </div>
  )
}

export default FacultyMenu;
