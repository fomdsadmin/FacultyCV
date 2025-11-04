import React from 'react';
import { FaInfoCircle } from 'react-icons/fa';
import { useApp } from '../Contexts/AppContext';

const ManagingUserAlert = () => {
  const { isManagingUser, managedUser } = useApp();

  if (!isManagingUser || !managedUser) {
    return null;
  }

  return (
    <div className="bg-blue-50 py-3 w-full flex justify-center align-center items-center">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <FaInfoCircle className="h-5 w-5 text-blue-400" />
        </div>
        <div className="ml-3 align-center">
          <p className="text-sm text-blue-700 text-center">
            You are currently managing the profile for{' '}
            <span className="font-semibold">
              Dr. {managedUser.first_name} {managedUser.last_name}
            </span>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default ManagingUserAlert;
