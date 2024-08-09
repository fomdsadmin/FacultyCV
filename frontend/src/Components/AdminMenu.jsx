import React, { useState } from "react";
import { FaUsers, FaChartLine, FaFileAlt, FaThList } from "react-icons/fa";
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import { FaBars } from "react-icons/fa";

const FacultyMenu = ({ userName, getCognitoUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      console.log('Logged out');
      getCognitoUser();
      console.log('Navigating to /auth');
      navigate('/auth');
    } catch (error) {
      console.log('Error logging out:', error);
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
      {!isCollapsed && (
        <div className='ml-3 mb-2 font-bold text-lg'>
          {userName}
        </div>
      )}
      <ul className="menu rounded-box flex-shrink-0">
        
        <li className={`mb-2 ${location.pathname === '/home' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/home'>
            <FaUsers className="h-5 w-5" />
            {!isCollapsed && <p className={`ml-2 ${location.pathname === '/home' ? 'font-bold' : ''}`}>Users</p>}
          </Link>
        </li>
        <li className={`mb-2 ${location.pathname === '/analytics' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/analytics'>
            <FaChartLine className="h-5 w-5" />
            {!isCollapsed && <p className={`ml-2 ${location.pathname === '/analytics' ? 'font-bold' : ''}`}>Analytics</p>}
          </Link>
        </li>
        <li className={`mb-2 ${location.pathname === '/templates' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/templates'>
            <FaFileAlt className="h-5 w-5" />
            {!isCollapsed && <p className={`ml-2 ${location.pathname === '/templates' ? 'font-bold' : ''}`}>Templates</p>}
          </Link>
        </li>
        <li className={`mb-6 ${location.pathname === '/sections' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/sections'>
            <FaThList className="h-5 w-5" />
            {!isCollapsed && <p className={`ml-2 ${location.pathname === '/sections' ? 'font-bold' : ''}`}>Sections</p>}
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
