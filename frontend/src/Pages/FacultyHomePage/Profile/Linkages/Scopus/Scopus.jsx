import { useState } from "react";
import { useApp } from "../../../../../Contexts/AppContext";
import { updateUser } from "graphql/graphqlHelpers";
import AddScopusModal from "./AddScopusModal";
import ManualScopusModal from "./ManualScopusModal";
import OptionsModal from "../OptionsModal";

// Accept user and isAdmin props
const Scopus = ({ user, setUser, isAdmin }) => {
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
    setShowAddModal(true);
  };

  const handleManualScopusClick = () => {
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
          "",
          currentUser.orcid_id
        );
        console.log("Scopus ID cleared successfully:");
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
      <div className="p-4 border border-gray-200 rounded-md bg-gray-50 shadow-sm">
        <h3 className="text-md font-semibold text-zinc-700 mb-2">Scopus ID(s)</h3>

        {scopusId ? (
          <div className="flex flex-wrap gap-2 mb-2">
            {scopusId.split(",").map((id, i) => (
              <button
                key={i}
                type="button"
                onClick={() => window.open(`https://www.scopus.com/authid/detail.uri?authorId=${id}`, "_blank")}
                className="btn btn-sm btn-secondary text-white"
              >
                {id}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button onClick={handleAddScopusClick} className="btn btn-sm btn-success text-white">
            Add Scopus ID
          </button>

          {scopusId && (
            <button onClick={handleClearScopusId} className="btn btn-sm btn-warning text-white">
              Clear
            </button>
          )}
        </div>
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
      />
      <ManualScopusModal
        isOpen={showManualModal}
        onClose={handleCloseManualModal}
        user={currentUser}
        isAdmin={isAdmin}
      />
    </>
  );
};

export default Scopus;
