"use client";

import { useState } from "react";
import AddOrcidModal from "./AddOrcidModal";
import ManualOrcidModal from "./ManualOrcidModal";
import OptionsModal from "../OptionsModal";
import { useApp } from "../../../../../Contexts/AppContext";
import { updateUser } from "../../../../../graphql/graphqlHelpers";

// Accept user and isAdmin props
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

  const handleClearOrcidId = async () => {
    if (isAdmin) {
      // You may need to call an API or update parent state for admin
      // For now, just show a placeholder for admin action
      // Example: if you have a callback prop, call it here
      // onUpdateUser({ ...currentUser, orcid_id: "" });
      function sanitizeInput(input) {
        if (!input) return "";
        return input
          .replace(/\\/g, "\\\\") // escape backslashes
          .replace(/"/g, '\\"') // escape double quotes
          .replace(/\n/g, "\\n"); // escape newlines
      }
      try {
        const updatedUser = await updateUser(
          currentUser.user_id,
          currentUser.first_name,
          currentUser.last_name,
          currentUser.preferred_name,
          currentUser.email,
          currentUser.role,
          sanitizeInput(userInfo.bio),
          currentUser.institution,
          currentUser.primary_department,
          currentUser.primary_faculty,
          currentUser.campus,
          currentUser.keywords,
          currentUser.institution_user_id,
          currentUser.scopus_id,
          ""
        );
        console.log("ORCID ID cleared successfully:");
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

  const handleAddOrcidClick = (event) => {
    event?.preventDefault();
    setShowOptionsModal(true);
  };

  const handleFindOrcidClick = () => {
    setShowAddModal(true);
  };

  const handleManualOrcidClick = () => {
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
      <div className="p-4 border border-gray-200 rounded-md bg-gray-50 shadow-sm">
        <h3 className="text-md font-semibold text-zinc-700 mb-2">ORCID ID</h3>

        <div className="flex flex-wrap gap-2 mb-2">
          {orcidId && (
            <button type="button" onClick={handleOrcidButtonClick} className={`btn btn-sm btn-secondary text-white`}>
              {orcidId}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleAddOrcidClick} className={`btn btn-sm btn-success text-white`}>
            Add ORCID ID
          </button>

          {orcidId && (
            <button onClick={handleClearOrcidId} className="btn btn-sm btn-warning text-white">
              Clear
            </button>
          )}
        </div>
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
