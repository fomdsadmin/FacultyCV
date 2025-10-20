import { useState } from "react";
import { useApp } from "../../../../../Contexts/AppContext";
import { updateUser } from "../../../../../graphql/graphqlHelpers";
import AddScopusModal from "./AddScopusModal";
import ManualScopusModal from "./ManualScopusModal";
import OptionsModal from "../OptionsModal";

const Scopus = ({ user, setUser, isAdmin, fetchAllUsers }) => {
  const { userInfo, setUserInfo } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  // Use correct user object based on isAdmin
  const currentUser = isAdmin ? user : userInfo;

  const handleNullValues = (value) => {
    if (value === null || value === undefined || value === "null" || value === "undefined") {
      return "";
    }
    return value;
  };

  const scopusId = handleNullValues(currentUser.scopus_id);

  const handleAddScopusClick = (event) => {
    event?.preventDefault();
    setShowOptionsModal(true);
  };

  const handleFindScopusClick = () => {
    setShowOptionsModal(false);
    setShowAddModal(true);
  };

  const handleManualScopusClick = () => {
    setShowOptionsModal(false);
    setShowManualModal(true);
  };

  const handleCloseOptionsModal = () => {
    setShowOptionsModal(false);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  const handleCloseManualModal = () => {
    setShowManualModal(false);
  };

  // Update Scopus ID for correct user object
  const handleClearScopusId = async () => {
    if (isAdmin) {
      const sanitizeInput = (input) => {
        if (!input) return "";
        return input
          .replace(/\\/g, "\\\\") // escape backslashes
          .replace(/"/g, '\\"') // escape double quotes
          .replace(/\n/g, "\\n"); // escape newlines
      };

      try {
        await updateUser(
          currentUser.user_id,
          currentUser.first_name,
          currentUser.last_name,
          currentUser.preferred_name,
          currentUser.email,
          currentUser.role,
          sanitizeInput(currentUser.bio),
          currentUser.institution,
          currentUser.primary_department,
          currentUser.primary_faculty,
          currentUser.campus,
          currentUser.keywords,
          currentUser.institution_user_id,
          "", // Clear Scopus ID
          currentUser.orcid_id
        );
        console.log("Scopus ID cleared successfully");
        window.location.reload();
      } catch (error) {
        console.error("Error clearing Scopus ID:", error);
      }
    } else {
      setUserInfo((prev) => ({
        ...prev,
        scopus_id: "",
      }));
    }
  };

  return (
    <>
      <div className="border border-gray-200 rounded-lg p-4  hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Scopus ID(s)</h3>
              {!isAdmin && (
                <span className="text-xs">
                  Your Scopus ID is used for fetching <b>Journal Publications</b> from Scopus.
                </span>
              )}
            </div>
          </div>
        </div>

        {scopusId ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {scopusId.split(",").map((id, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() =>
                    window.open(`https://www.scopus.com/authid/detail.uri?authorId=${id.trim()}`, "_blank")
                  }
                  aria-label={`Open Scopus author ${id.trim()}`}
                  className="inline-flex items-center px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 font-mono text-sm md:text-base hover:bg-blue-100 transition-colors"
                >
                  {id.trim()}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddScopusClick}
                className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update
              </button>
              <button
                type="button"
                onClick={handleClearScopusId}
                className="px-3 py-2 bg-red-100 text-red-700 text-xs rounded-lg hover:bg-red-200 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">No Scopus ID connected</p>
            <button
              type="button"
              onClick={handleAddScopusClick}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Connect Scopus
            </button>
          </div>
        )}
      </div>
      <OptionsModal
        isOpen={showOptionsModal}
        onClose={handleCloseOptionsModal}
        onFind={handleFindScopusClick}
        onManualAdd={handleManualScopusClick}
        title="Add Scopus ID"
        findButtonText="Find Scopus ID"
      />
      <AddScopusModal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        user={currentUser}
        setUser={setUser}
        isAdmin={isAdmin}
        fetchAllUsers={fetchAllUsers}
      />
      <ManualScopusModal
        isOpen={showManualModal}
        onClose={handleCloseManualModal}
        user={currentUser}
        setUser={setUser}
        isAdmin={isAdmin}
        fetchAllUsers={fetchAllUsers}
      />
    </>
  );
};

export default Scopus;
