import { useState } from "react"
import { useApp } from "../../../../../Contexts/AppContext"
import AddScopusModal from "./AddScopusModal"
import ManualScopusModal from "./ManualScopusModal"
import OptionsModal from "../OptionsModal";

const Scopus = () => {
  const { userInfo, setUserInfo } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  const scopusId = userInfo.scopus_id;

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

  const handleClearScopusId = () => {
    setUserInfo((prev) => ({
      ...prev,
      scopus_id: "",
    }));
  };

  return (
    <>
      <div className="p-4 border border-gray-200 rounded-md bg-gray-50 shadow-sm">
        <h3 className="text-md font-semibold text-zinc-700 mb-2">
          Scopus ID(s)
        </h3>

        <div className="flex flex-wrap gap-2 mb-3">
          {scopusId &&
            scopusId.split(",").map((id, i) => (
              <button
                key={i}
                type="button"
                onClick={() =>
                  window.open(
                    `https://www.scopus.com/authid/detail.uri?authorId=${id}`,
                    "_blank"
                  )
                }
                className="btn btn-sm btn-secondary text-white"
              >
                {id}
              </button>
            ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleAddScopusClick}
            className="btn btn-sm btn-success text-white"
          >
            Add Scopus ID
          </button>

          {userInfo.scopus_id && (
            <button
              onClick={handleClearScopusId}
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
        onFind={handleFindScopusClick}
        onManualAdd={handleManualScopusClick}
        title="Add Scopus ID"
        findButtonText="Find Scopus ID"
      />
      <AddScopusModal isOpen={showAddModal} onClose={handleCloseAddModal} />
      <ManualScopusModal
        isOpen={showManualModal}
        onClose={handleCloseManualModal}
      />
    </>
  );
};

export default Scopus
