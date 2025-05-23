import { useFaculty } from "../../FacultyContext"

const Linkages = () => {
  const {
    scopusId,
    orcidId,
    handleScopusIdClick,
    handleOrcidIdClick,
    handleClearScopusId,
    handleClearOrcidId,
    setActiveModal,
    setModalOpen,
  } = useFaculty()

  return (
    <div className="space-y-6">
      {/* Scopus Section */}
      <div className="p-4 border border-gray-200 rounded-md bg-gray-50 shadow-sm">
        <h3 className="text-md font-semibold text-zinc-700 mb-2">Scopus ID(s)</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {scopusId &&
            scopusId.split(",").map((id, i) => (
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
        <div className="flex flex-wrap gap-3">
          <button onClick={handleScopusIdClick} className="btn btn-sm btn-success text-white">
            Add Scopus ID
          </button>
          <button
            onClick={() => {
              setActiveModal("ManualScopus")
              setModalOpen(true)
            }}
            className="btn btn-sm btn-outline text-gray-700"
          >
            Add Manually
          </button>
          {scopusId && (
            <button onClick={handleClearScopusId} className="btn btn-sm btn-warning text-white">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ORCID Section */}
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
    </div>
  )
}

export default Linkages
