import { useFaculty } from "../../../FacultyContext"

const Orcid = () => {
  const { orcidId, handleOrcidIdClick, handleClearOrcidId, setActiveModal, setModalOpen } = useFaculty()

  return (
    <div className="p-4 border border-gray-200 rounded-md bg-gray-50 shadow-sm">
      <h3 className="text-md font-semibold text-zinc-700 mb-2">ORCID ID</h3>
      <div className="flex flex-wrap gap-3 mb-3">
        <button
          type="button"
          onClick={() => (orcidId ? window.open(`https://orcid.org/${orcidId}`, "_blank") : handleOrcidIdClick())}
          className={`btn btn-sm ${orcidId ? "btn-secondary" : "btn-success"} text-white`}
        >
          {orcidId || "Add ORCID ID"}
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => {
            setActiveModal("ManualOrcid")
            setModalOpen(true)
          }}
          className="btn btn-sm btn-outline text-gray-700"
        >
          Add Manually
        </button>
        {orcidId && (
          <button onClick={handleClearOrcidId} className="btn btn-sm btn-warning text-white">
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

export default Orcid
