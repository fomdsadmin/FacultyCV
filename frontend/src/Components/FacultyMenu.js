import React from "react";
import { TbHome } from "react-icons/tb";
import { HiOutlineAcademicCap } from "react-icons/hi2";
import { TiDownloadOutline } from "react-icons/ti";
import { Link } from 'react-router-dom';
import { signOut } from 'aws-amplify/auth';

const FacultyMenu = ({ userName }) => {

  const handleSignOut = () => {
    try {
      signOut();
      console.log('Logged out');
      window.location.reload();
    }
    catch (error) {
      console.log('Error logging out:', error);
    }
  }

  return (
    <ul className="menu bg-base-200 rounded-box w-56 flex-shrink-0 h-full">
      <li>
        <Link to='/home'>
          <TbHome className="h-5 w-5" />
          {userName}
        </Link>
      </li>
      <li>
        <Link to='/academic-work'>
          <HiOutlineAcademicCap className="h-5 w-5" />
          Academic Work
        </Link>
      </li>
      <li>
        <Link to='/reports'>
          <TiDownloadOutline className="h-5 w-5" />
          Reports
        </Link>
      </li>
      <li className="mt-auto">
        <button className="btn btn-warning py-1 px-4 w-2/4 mx-auto min-h-0 h-8 leading-tight" onClick={handleSignOut}>Sign out</button>
      </li>
    </ul>
  )
}

export default FacultyMenu;
