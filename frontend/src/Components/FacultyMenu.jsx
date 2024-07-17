import React from "react";
import { TbHome } from "react-icons/tb";
import { HiOutlineAcademicCap } from "react-icons/hi2";
import { TiDownloadOutline } from "react-icons/ti";
import { IoPersonAddOutline } from "react-icons/io5";
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import { FaRegTrashAlt } from "react-icons/fa";


const FacultyMenu = ({ userName, getCognitoUser }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      console.log('Logged out');
      getCognitoUser();
      console.log('Navigating to /auth');
      navigate('/auth');
    }
    catch (error) {
      console.log('Error logging out:', error);
    }
  }

  return (
    <div className="py-2 border-r-2 border-neutral">
      <ul className="menu rounded-box w-60 flex-shrink-0 h-full">
        <li className={`mb-2 ${location.pathname === '/home' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/home'>
            <TbHome className="h-5 w-5" />
            <p className={`ml-2 ${location.pathname === '/home' ? 'font-bold' : ''}`}>{userName}</p>
          </Link>
        </li>
        <li className={`mb-2 ${location.pathname === '/academic-work' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/academic-work'>
            <HiOutlineAcademicCap className="h-5 w-5" />
            <p className={`ml-2 ${location.pathname === '/academic-work' ? 'font-bold' : ''}`}>Academic Work</p>
          </Link>
        </li>
        <li className={`mb-2 ${location.pathname === '/reports' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/reports'>
            <TiDownloadOutline className="h-5 w-5" />
            <p className={`ml-2 ${location.pathname === '/reports' ? 'font-bold' : ''}`}>Reports</p>
          </Link>
        </li>
        <li className={`mb-2 ${location.pathname === '/assistants' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/assistants'>
            <IoPersonAddOutline className="h-5 w-5" />
            <p className={`ml-2 ${location.pathname === '/assistants' ? 'font-bold' : ''}`}>Assistants</p>
          </Link>
        </li>
        <li className={`mb-2 ${location.pathname === '/archive' ? 'bg-gray-200 rounded-lg' : ''}`}>
          <Link to='/archive'>
            <FaRegTrashAlt className="h-4 w-4" />
            <p className={`ml-2 ${location.pathname === '/archive' ? 'font-bold' : ''}`}>Archive</p>
          </Link>
        </li>
        <li className="mt-auto">
          <button className="text-white btn btn-warning py-1 px-4 w-2/4 mx-auto min-h-0 h-8 leading-tight" onClick={handleSignOut}>Sign out</button>
        </li>
      </ul>
    </div>
  )
}

export default FacultyMenu;
