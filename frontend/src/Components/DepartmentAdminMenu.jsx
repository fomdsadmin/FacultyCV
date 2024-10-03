import React, { useState, useEffect } from "react";
import { FaUsers, FaChartLine, FaFileAlt } from "react-icons/fa";
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';

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
      navigate('/auth');
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

  return (
    <div
      className={`relative transition-all duration-150 ease-in-out py-2 border-r-2 border-neutral max-h-screen ${isCollapsed ? 'w-18' : 'w-60'}`}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <ul className="menu rounded-box flex-shrink-0">
        <li className={`mb-2 ${location.pathname === '/home' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/home'>
          <FaUsers className="h-5 w-5" />
          {showText && !isCollapsed && <p className={`ml-2 ${location.pathname === '/home' ? 'font-bold' : ''}`}>{userName}</p>}
          </Link>
        </li>
        <li className={`mb-2 ${location.pathname === '/department-admin/analytics' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/department-admin/analytics'>
            <FaChartLine className="h-5 w-5" />
            {showText && !isCollapsed && <p className={`ml-2 ${location.pathname === '/department-admin/analytics' ? 'font-bold' : ''}`}>Analytics</p>}
          </Link>
        </li>
        <li className={`mb-6 ${location.pathname === '/department-admin/templates' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/department-admin/templates'>
          <FaFileAlt className="h-5 w-5" />
          {showText && !isCollapsed && <p className={`ml-2 ${location.pathname === '/department-admin/templates' ? 'font-bold' : ''}`}>Templates</p>}
          </Link>
        </li>
      </ul>

      {/* Sign Out Button */}
      <div className="absolute bottom-3 left-0 w-full flex justify-center">
        {!isCollapsed && showText && (
          <button 
            className="text-white btn btn-warning py-1 px-4 w-44 min-h-0 h-8 leading-tight focus:outline-none hover:bg-warning-dark"
            onClick={handleSignOut} 
            disabled={isSigningOut}
          >
            {isSigningOut ? 'Signing Out...' : 'Sign Out'}
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminMenu;
