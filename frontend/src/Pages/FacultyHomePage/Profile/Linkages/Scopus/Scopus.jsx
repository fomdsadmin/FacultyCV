import { useApp } from "../../../../../Contexts/AppContext";
import { useFaculty } from "../../../FacultyContext"

const Scopus = () => {
  const { handleScopusIdClick, handleClearScopusId, setActiveModal, setModalOpen } = useFaculty();
  const { userInfo } = useApp();
  const scopusId = userInfo.scopus_id;

  return (
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
  )
}

export default Scopus
