import React, { useState } from "react";
import { TbHome } from "react-icons/tb";
import { Link } from 'react-router-dom';
import { signOut } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';

const AssistantMenu = ({ userName, getCognitoUser }) => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      console.log('Logged out');
      getCognitoUser();
      console.log('Navigating to /auth');
      navigate('/auth');
    } catch (error) {
      console.log('Error logging out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-2 h-16 px-4 border-b-2 border-neutral w-full">
      <Link to='/home' className="flex items-center">
        <TbHome className="h-7 w-7" />
        <p className="ml-2 font-bold">{userName}</p>
      </Link>
      <button 
        className="text-white btn btn-warning py-1 px-4 min-h-0 h-8"
        onClick={handleSignOut} 
        disabled={isLoggingOut}>
        {isLoggingOut ? 'Logging Out...' : 'Logout'}
      </button>
    </div>
  );
}

export default AssistantMenu;