import React, { useState, useEffect } from "react";
import { getAuditViewData } from "../graphql/graphqlHelpers";
import { FaArrowLeft } from "react-icons/fa";
import ConnectionCard from "./ConnectionCard";
import AssociatedUser from "./AssociatedUser";
import ConnectionInviteModal from "./ConnectionInviteModal";
import ChangeRoleModal from "./ChangeRoleModal";
import UpdateUserModal from "./UpdateUserModal";
import { getUserConnections } from "../graphql/graphqlHelpers";
import { IoMdAddCircleOutline } from "react-icons/io";
import DepartmentAdminUserInsights from "../Views/DepartmentAdminUserInsights"; // Use the same insights component
import Orcid from "../Pages/FacultyHomePage/Profile/Linkages/Orcid/Orcid";
import Scopus from "../Pages/FacultyHomePage/Profile/Linkages/Scopus/Scopus";
import ScopusPublicationsModal from "./ScopusPublicationsModal";

const ManageUser = ({ user, onBack, fetchAllUsers, department }) => {
  const [currentUser, setCurrentUser] = useState(user);
  const [loading, setLoading] = useState(true);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);
  const [isUpdateUserModalOpen, setIsUpdateUserModalOpen] = useState(false);
  const [isScopusPublicationsModalOpen, setIsScopusPublicationsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingConnections, setPendingConnections] = useState([]);
  const [confirmedConnections, setConfirmedConnections] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [lastVisit, setLastVisit] = useState(null);
  const [loadingLastVisit, setLoadingLastVisit] = useState(false);

  // Fetch last visit timestamp for managed user
  useEffect(() => {
    async function fetchLastVisitAuth() {
      if (!currentUser?.user_id) return;
      setLoadingLastVisit(true);
      let pageNumber = 1;
      let found = null;
      try {
        while (!found) {
          const response = await getAuditViewData({
            logged_user_id: currentUser.user_id,
            page_number: pageNumber,
            page_size: 50,
          });
          const records = response?.records || [];
          if (!records.length) break;
          const match = records.find((r) => r.page === "/auth");
          if (match) {
            found = match.ts;
            break;
          }
          pageNumber++;
        }
        setLastVisit(found);
      } catch (err) {
        setLastVisit(null);
      } finally {
        setLoadingLastVisit(false);
      }
    }
    fetchLastVisitAuth();
  }, [currentUser]);
  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    try {
      let parsedTimestamp = timestamp;
      if (typeof timestamp === "string" && timestamp.includes(" ") && !timestamp.includes("T")) {
        parsedTimestamp = timestamp.replace(" ", "T") + "Z";
      }
      const date = new Date(parsedTimestamp);
      return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZoneName: "short",
      });
    } catch {
      return timestamp;
    }
  };

  useEffect(() => {
    setCurrentUser(user);
    // Force a re-render when user data changes
    if (user && user.role) {
      // This ensures the role badge updates immediately
      setCurrentUser(prevUser => ({
        ...prevUser,
        ...user
      }));
    }
  }, [user]);

  useEffect(() => {
    getAllUserConnections();
    // eslint-disable-next-line
  }, [searchTerm]);

  async function getAllUserConnections() {
    setLoading(true);
    try {
      let retrievedUserConnections;
      if (currentUser.role === "Faculty") {
        retrievedUserConnections = await getUserConnections(currentUser.user_id);
      } else {
        retrievedUserConnections = await getUserConnections(currentUser.user_id, false);
      }

      const filteredUserConnections = retrievedUserConnections.filter(
        (connection) =>
          connection.assistant_first_name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
          connection.assistant_last_name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
          connection.assistant_email.toLowerCase().startsWith(searchTerm.toLowerCase())
      );

      setPendingConnections(filteredUserConnections.filter((connection) => connection.status === "pending"));
      setConfirmedConnections(filteredUserConnections.filter((connection) => connection.status === "confirmed"));
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleBack = () => {
    onBack();
  };

  const handleChangeRole = () => {
    setIsChangeRoleModalOpen(true);
  };

  const handleUpdateUser = () => {
    setIsUpdateUserModalOpen(true);
  };

  const handleFetchScopusPublications = () => {
    setIsScopusPublicationsModalOpen(true);
  };

  return (
    <div className="mx-auto px-8 py-2 flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center mb-2">
        <button onClick={handleBack} className="btn btn-ghost text-zinc-800 h-8 mr-2">
          <FaArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-lg font-semibold text-zinc-700">User Details</span>
      </div>

      {/* Main Grid: User Info & Connections Side by Side */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
        {/* User Info - Minimal Card */}

        <div className="bg-white rounded-xl shadow border border-gray-100 px-8 py-6 flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-zinc-800">
                {currentUser.first_name} {currentUser.last_name}
              </span>
              <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200">
                {currentUser.role === "Assistant" ? "Delegate" : currentUser.role}
              </span>
            </div>
            <span className="ml-auto text-xs text-zinc-400">
              Joined:{" "}
              {currentUser.joined_timestamp ? new Date(currentUser.joined_timestamp).toLocaleDateString() : "N/A"}
            </span>
          </div>
          <div className="col-span-1 font-small text-sm mb-4">
            <span className=" text-zinc-500">Last Visit:</span>{" "}
            {loadingLastVisit ? "Loading..." : lastVisit ? formatTimestamp(lastVisit) : "No record found"}
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-zinc-700">
            <div>
              <span className="font-medium text-zinc-500">Email:</span> {currentUser.email}
            </div>
            <div>
              <span className="font-medium text-zinc-500">Institution:</span> {currentUser.institution || ""}
            </div>
            <div>
              <span className="font-medium text-zinc-500">CWL Username:</span> {currentUser.cwl_username}
            </div>
            <div>
              <span className="font-medium text-zinc-500">Campus:</span> {currentUser.campus || ""}
            </div>
            <div>
              <span className="font-medium text-zinc-500">VCH/PHSA/PHC Login:</span> {currentUser.vpp_username}
            </div>
            <div>
              <span className="font-medium text-zinc-500">Faculty:</span>{" "}
              {currentUser.primary_faculty ? currentUser.primary_faculty : <span></span>}
            </div>
            <div></div>
            <div>
              <span className="font-medium text-zinc-500">Department:</span>{" "}
              {currentUser.primary_department ? (
                currentUser.primary_department
              ) : (
                <span className="text-gray-600 italic"> - </span>
              )}
            </div>
          </div>
          {/* Scopus/ORCID Linkages for Admin */}
          <div className="mt-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Scopus user={currentUser} setUser={setCurrentUser} isAdmin={true} fetchAllUsers={fetchAllUsers} />
              <Orcid user={currentUser} setUser={setCurrentUser} isAdmin={true} fetchAllUsers={fetchAllUsers} />
            </div>
          </div>

          <div className="flex gap-2 mt-4 justify-end">
            <button onClick={handleUpdateUser} className="btn btn-primary px-4 text-white font-semibold">
              Update
            </button>
            <button onClick={handleChangeRole} className="btn btn-info px-4 text-white font-semibold">
              Change Role
            </button>
            <button 
              onClick={handleFetchScopusPublications} 
              className="btn btn-success px-4 text-white font-semibold"
              disabled={!currentUser.scopus_id}
              title={!currentUser.scopus_id ? "No Scopus ID found for this user" : "Fetch Scopus Publications"}
            >
              Fetch Publications
            </button>
          </div>
        </div>

        {/* Connections */}
        <div className="bg-white rounded-lg shadow py-6 px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h3 className="text-xl font-semibold text-zinc-700">Delegates</h3>
            <div className="flex items-center gap-2">
              <label className="input input-bordered flex items-center gap-2">
                <input
                  type="text"
                  className="grow"
                  placeholder="Search connections"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  aria-label="Search connections"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-4 w-4 opacity-70"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                    clipRule="evenodd"
                  />
                </svg>
              </label>
              <button
                onClick={() => setIsConnectionModalOpen(true)}
                className="btn btn-ghost"
                title="Add Connection"
                aria-label="Add Connection"
              >
                <IoMdAddCircleOutline className="h-7 w-7 text-blue-600" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <span className="text-lg text-zinc-600">Loading...</span>
            </div>
          ) : (
            <div>
              {(currentUser.role === "Faculty" || currentUser.role === "Assistant") && (
                <>
                  {pendingConnections.length === 0 && confirmedConnections.length === 0 ? (
                    <div className="text-center py-4 text-lg text-zinc-500">No connections found.</div>
                  ) : (
                    <>
                      {pendingConnections.length > 0 && (
                        <section className="mb-6">
                          <h4 className="text-lg font-semibold text-zinc-700 mb-2">
                            {currentUser.role === "Faculty" ? "Invitations" : "Pending Connections"}
                          </h4>
                          <div className="flex flex-wrap gap-4">
                            {pendingConnections.map((connection) =>
                              currentUser.role === "Faculty" ? (
                                <AssociatedUser
                                  key={connection.user_connection_id}
                                  connection={connection}
                                  getAllUserConnections={getAllUserConnections}
                                />
                              ) : (
                                <ConnectionCard
                                  key={connection.user_connection_id}
                                  connection={connection}
                                  getAllUserConnections={getAllUserConnections}
                                />
                              )
                            )}
                          </div>
                        </section>
                      )}
                      {confirmedConnections.length > 0 && (
                        <section>
                          <div className="flex flex-wrap gap-4">
                            {confirmedConnections.map((connection) =>
                              currentUser.role === "Faculty" ? (
                                <AssociatedUser
                                  key={connection.user_connection_id}
                                  connection={connection}
                                  getAllUserConnections={getAllUserConnections}
                                />
                              ) : (
                                <ConnectionCard
                                  key={connection.user_connection_id}
                                  connection={connection}
                                  getAllUserConnections={getAllUserConnections}
                                />
                              )
                            )}
                          </div>
                        </section>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Modals */}
              {isConnectionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <ConnectionInviteModal
                    userInfo={currentUser}
                    getAllUserConnections={getAllUserConnections}
                    setIsModalOpen={setIsConnectionModalOpen}
                    admin={true}
                  />
                </div>
              )}
              {isChangeRoleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <ChangeRoleModal
                    currentUser={currentUser}
                    setActiveUser={setCurrentUser}
                    setIsModalOpen={setIsChangeRoleModalOpen}
                    fetchAllUsers={fetchAllUsers}
                    handleBack={handleBack}
                  />
                </div>
              )}
              {isUpdateUserModalOpen && (
                <UpdateUserModal
                  isOpen={isUpdateUserModalOpen}
                  setIsOpen={setIsUpdateUserModalOpen}
                  onClose={() => setIsUpdateUserModalOpen(false)}
                  onBack={() => setIsUpdateUserModalOpen(false)}
                  existingUser={currentUser}
                  onUpdateSuccess={fetchAllUsers}
                />
              )}
              <ScopusPublicationsModal
                user={currentUser}
                isOpen={isScopusPublicationsModalOpen}
                onClose={() => setIsScopusPublicationsModalOpen(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* User Analytics Section - Dropdown (conditional) */}
      {(currentUser.role === "Faculty" ||
        currentUser.role.startsWith("Admin-") ||
        currentUser.role.startsWith("FacultyAdmin-")) && (
        <div className="bg-white rounded-lg shadow w-full mt-6 mx-4">
          <button
            className="w-full flex items-center justify-between px-8 py-4 h-18 mb-2
            text-left text-xl font-bold text-zinc-700"
            onClick={() => setShowAnalytics((prev) => !prev)}
          >
            <span>User Analytics</span>
            <svg
              className={`h-5 w-5 text-zinc-500 transition-transform duration-200 ${
                showAnalytics ? "rotate-180" : "rotate-0"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showAnalytics && (
            <DepartmentAdminUserInsights user={currentUser} department={currentUser.primary_department} />
          )}
        </div>
      )}
    </div>
  );
};

export default ManageUser;
