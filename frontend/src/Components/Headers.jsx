import React from 'react';

const Header = ({ userInfo}) => {
  // Hardcoded values for now
  const userEmail = userInfo?.email || "Error";
  const userRole = userInfo?.role || "Error";
  console.log("User Info:", userInfo);

  return (
    <div className="pt-[9vh]">
      <header className="fixed top-0 left-0 right-0 z-20 bg-white shadow-md h-[9vh] flex items-center ">
        <div className="flex items-center gap-4">
          <img
            src="https://med-fom-mednet.sites.olt.ubc.ca/files/2022/10/Faculty-of-Medicine-Unit-Signature-940x157.jpeg"
            alt="UBC Faculty of Medicine Logo"
            className="h-12 w-auto object-contain"
          />
          <span className="ml-4 text-2xl flex flex-col font-bold text-gray-800 tracking-tight">
            Faculty360{" "}
            <span className="font-normal text-sm text-gray-600">
              Faculty Activity Reporting
            </span>
          </span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          <div className="flex flex-col text-sm text-gray-600 border border-1 border-gray-400 rounded-lg px-2 py-1">
            <span className="font-medium text-xs">Logged in as:</span>
            <span className="font-semibold mt-1 text-sm">{userEmail}</span>
          </div>
          <div className="px-3 py-1 mr-8 rounded bg-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wide">
            {userRole}
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
