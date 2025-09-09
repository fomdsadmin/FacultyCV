import { useState } from "react";
import { useApp } from "../../../../../Contexts/AppContext";
import { updateUser } from "../../../../../graphql/graphqlHelpers";
import AddOrcidModal from "./AddOrcidModal";
import ManualOrcidModal from "./ManualOrcidModal";
import OptionsModal from "../OptionsModal";

const Orcid = ({ user, setUser, isAdmin }) => {
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

  const orcidId = handleNullValues(currentUser.orcid_id);

  const handleAddOrcidClick = (event) => {
    event?.preventDefault();
    setShowOptionsModal(true);
  };

  const handleFindOrcidClick = () => {
    setShowOptionsModal(false);
    setShowAddModal(true);
  };

  const handleManualOrcidClick = () => {
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

  const handleClearOrcidId = async () => {
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
          currentUser.scopus_id,
          "" // Clear ORCID ID
        );
        console.log("ORCID ID cleared successfully");
        window.location.reload();
      } catch (error) {
        console.error("Error clearing ORCID ID:", error);
      }
    } else {
      setUserInfo((prev) => ({
        ...prev,
        orcid_id: "",
      }));
    }
  };

  const handleOrcidButtonClick = (event) => {
    event.preventDefault();
    if (orcidId) {
      window.open(`https://orcid.org/${orcidId}`, "_blank");
    } else {
      handleAddOrcidClick();
    }
  };

  return (
    <>
      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">ORCID ID</h3>
          </div>
        </div>

        {orcidId ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleOrcidButtonClick}
                aria-label={`Open ORCID profile ${orcidId}`}
                className="inline-flex items-center px-3 py-2 rounded-lg border border-green-200 bg-green-50 text-green-800 font-mono text-sm md:text-base hover:bg-green-100 transition-colors"
              >
                {orcidId}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddOrcidClick}
                className="flex-1 px-3 py-2 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
              >
                Update
              </button>
              <button
                type="button"
                onClick={handleClearOrcidId}
                className="px-3 py-2 bg-red-100 text-red-700 text-xs rounded-lg hover:bg-red-200 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">No ORCID ID connected</p>
            <button 
              type="button" 
              onClick={handleAddOrcidClick} 
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              Connect ORCID
            </button>
          </div>
        )}
      </div>
      <OptionsModal
        isOpen={showOptionsModal}
        onClose={handleCloseOptionsModal}
        onFind={handleFindOrcidClick}
        onManualAdd={handleManualOrcidClick}
        title="Add ORCID ID"
        findButtonText="Find ORCID ID"
      />
      <AddOrcidModal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        user={currentUser}
        setUser={setUser}
        isAdmin={isAdmin}
      />
      <ManualOrcidModal
        isOpen={showManualModal}
        onClose={handleCloseManualModal}
        user={currentUser}
        isAdmin={isAdmin}
      />
    </>
  );
};

export default Orcid;
