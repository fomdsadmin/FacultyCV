"use client"

import { useState } from "react"
import AddOrcidModal from "./AddOrcidModal"
import ManualOrcidModal from "./ManualOrcidModal"
import { useApp } from "../../../../../Contexts/AppContext"

const Orcid = () => {
  const { userInfo, setUserInfo } = useApp()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showManualModal, setShowManualModal] = useState(false)

  const orcidId = userInfo.orcid_id

  const handleClearOrcidId = () => {
    setUserInfo((prev) => ({
      ...prev,
      orcid_id: "",
    }))
  }

  const handleAddOrcidClick = () => {
    setShowAddModal(true)
  }

  const handleManualOrcidClick = () => {
    setShowManualModal(true)
  }

  const handleCloseAddModal = () => {
    setShowAddModal(false)
  }

  const handleCloseManualModal = () => {
    setShowManualModal(false)
  }

  const handleOrcidButtonClick = () => {
    if (orcidId) {
      window.open(`https://orcid.org/${orcidId}`, "_blank")
    } else {
      handleAddOrcidClick()
    }
  }

  const handleAddOrcidIdButtonClick = () => {
    handleAddOrcidClick();
  }

  return (
    <>
      <div className="p-4 border border-gray-200 rounded-md bg-gray-50 shadow-sm">
        <h3 className="text-md font-semibold text-zinc-700 mb-2">ORCID ID</h3>

        <div className="flex flex-wrap gap-3 mb-3">
          {orcidId && <button
            type="button"
            onClick={handleOrcidButtonClick}
            className={`btn btn-sm btn-secondary text-white`}
          >
            {orcidId}
          </button>}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleAddOrcidIdButtonClick}
            className={`btn btn-sm btn-success text-white`}
          >
            {"Add ORCID ID"}
          </button>
          <button onClick={handleManualOrcidClick} className="btn btn-sm btn-outline text-gray-700">
            Add Manually
          </button>

          {orcidId && (
            <button onClick={handleClearOrcidId} className="btn btn-sm btn-warning text-white">
              Clear
            </button>
          )}
        </div>
      </div>
      <AddOrcidModal isOpen={showAddModal} onClose={handleCloseAddModal} />
      <ManualOrcidModal isOpen={showManualModal} onClose={handleCloseManualModal} />
    </>
  )
}

export default Orcid
