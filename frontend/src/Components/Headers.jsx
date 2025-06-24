import React, { useState, useRef, useEffect } from "react";
import { FaUserCircle, FaCog, FaUser, FaQuestionCircle, FaSignOutAlt, FaChevronDown } from "react-icons/fa";
import { signOut } from "aws-amplify/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../Contexts/AppContext";

const Header = ({ userInfo, getCognitoUser }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const dropdownRef = useRef(null);
  const roleDropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const { currentViewRole, setCurrentViewRole, getAvailableRoles } = useApp();

  const userEmail = userInfo?.email || "Error";
  const userRole = userInfo?.role || "Error";
  const firstName = userInfo?.preferred_name || userInfo?.first_name || "User";

  // Determine if user has multiple roles and which roles to show
  const isAdmin = userRole === "Admin";
  const isDepartmentAdmin = userRole.startsWith("Admin-");
  const department = isDepartmentAdmin ? userRole.split("Admin-")[1] : "";
  const hasMultipleRoles = isAdmin || isDepartmentAdmin;

  const availableRoles = getAvailableRoles();

  // Update currentViewRole based on URL path if needed
  useEffect(() => {
    let newViewRole = currentViewRole;

    if (location.pathname.includes("/admin") && !location.pathname.includes("/department-admin")) {
      newViewRole = "Admin";
    } else if (location.pathname.includes("/department-admin")) {
      newViewRole = isDepartmentAdmin ? userRole : "Admin-All";
    } else if (location.pathname.includes("/faculty")) {
      newViewRole = "Faculty";
    } else if (location.pathname.startsWith("/assistant")) {
      newViewRole = "Assistant";
    }

    // Only update if it's different
    if (newViewRole !== currentViewRole) {
      setCurrentViewRole(newViewRole);
    }
  }, [location.pathname, isDepartmentAdmin, userRole]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      // Add this line to update the authentication state
      // getCognitoUser();
      window.location.href = "/auth";
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleRoleChange = (role) => {
    // Update the currentViewRole state
    setCurrentViewRole(role.value);

    // Navigate to the route
    navigate(role.route);
    setIsRoleDropdownOpen(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target)) {
        setIsRoleDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get display text for current role
  const getCurrentRoleDisplay = () => {
    if (currentViewRole.startsWith("Admin-")) {
      return `DEPT ADMIN - ${currentViewRole.split("Admin-")[1]}`;
    }
    return currentViewRole.toUpperCase();
  };

  return (
    <div className="pt-[9vh]">
      <header className="fixed top-0 left-0 right-0 z-20 bg-white shadow-md h-[9vh] flex items-center px-4">
        <div className="flex items-center gap-4">
          <img
            src="https://med-fom-mednet.sites.olt.ubc.ca/files/2022/10/Faculty-of-Medicine-Unit-Signature-940x157.jpeg"
            alt="UBC Faculty of Medicine Logo"
            className="h-12 w-auto object-contain"
          />
          <span className="ml-4 text-2xl flex flex-col font-bold text-gray-800 tracking-tight">
            Faculty360 <span className="font-normal text-sm text-gray-600">Faculty Activity Reporting</span>
          </span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          {/* Role selector or label */}
          <div className="relative" ref={roleDropdownRef}>
            {hasMultipleRoles ? (
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
              >
                <span className="text-xs font-semibold uppercase tracking-wide">{getCurrentRoleDisplay()}</span>
                <FaChevronDown className="text-xs" />
              </button>
            ) : (
              <div className="px-3 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wide">
                {getCurrentRoleDisplay()}
              </div>
            )}

            {isRoleDropdownOpen && hasMultipleRoles && (
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                {availableRoles.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => handleRoleChange(role)}
                    className={`flex w-full items-center px-4 py-2 text-sm ${
                      role.value === currentViewRole
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <FaUserCircle className="text-gray-700 text-xl" />
              <span className="font-medium text-gray-700">{firstName}</span>
              <svg
                className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate">{firstName}</p>
                  <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                </div>

                {(currentViewRole === "Faculty" || userInfo?.role === "Faculty") && (
                  <>
                    <button
                      onClick={() => {
                        navigate("/faculty/home");
                        setIsDropdownOpen(false);
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      <FaUser className="mr-3 text-gray-500" />
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        navigate("/support");
                        setIsDropdownOpen(false);
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      <FaQuestionCircle className="mr-3 text-gray-500" />
                      Help & Support
                    </button>
                    <div className="border-t border-gray-100"></div>
                  </>
                )}

                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
                >
                  <FaSignOutAlt className="mr-3" />
                  {isSigningOut ? "Signing Out..." : "Sign Out"}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
