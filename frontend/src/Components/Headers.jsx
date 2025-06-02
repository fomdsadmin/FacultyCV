import React from 'react';

const Header = () => {
  return (
   <header className="bg-white shadow-md p-4 flex items-center gap-4">
      <img
        src="https://med-fom-mednet.sites.olt.ubc.ca/files/2022/10/Faculty-of-Medicine-Unit-Signature-940x157.jpeg"
        alt="UBC Faculty of Medicine Logo"
        className="h-12 object-contain"
      />
      <h1 className="text-2xl font-semibold text-gray-800">Faculty Activity Reporting - Faculty360</h1>
    </header>
  );
};

export default Header;
