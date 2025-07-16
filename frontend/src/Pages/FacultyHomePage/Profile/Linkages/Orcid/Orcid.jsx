"use client"

import { useState } from "react"
import AddOrcidModal from "./AddOrcidModal"
import ManualOrcidModal from "./ManualOrcidModal"
import OptionsModal from "../OptionsModal";
import { useApp } from "../../../../../Contexts/AppContext";

const Orcid = () => {
  const { userInfo, setUserInfo } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  const orcidId = userInfo.orcid_id;

  const handleClearOrcidId = () => {
    setUserInfo((prev) => ({
      ...prev,
      orcid_id: "",
    }));
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

        <div className="flex flex-wrap gap-3 mb-3">
          {orcidId && (
            <button
              type="button"
              onClick={handleOrcidButtonClick}
              className={`btn btn-sm btn-secondary text-white`}
            >
              {orcidId}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleAddOrcidClick}
            className={`btn btn-sm btn-success text-white`}
          >
            Add ORCID ID
          </button>

          {orcidId && (
            <button
              onClick={handleClearOrcidId}
              className="btn btn-sm btn-warning text-white"
            >
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
      <AddOrcidModal isOpen={showAddModal} onClose={handleCloseAddModal} />
      <ManualOrcidModal
        isOpen={showManualModal}
        onClose={handleCloseManualModal}
      />
    </>
  );
};

export default Orcid
