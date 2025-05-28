const ImportWarningDialog = ({ isOpen, onClose, onConfirm, warning }) => {
  if (!isOpen) return <></>

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 relative">
        <button type="button" className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onClose}>
          ✕
        </button>
        <div className="flex flex-col items-center justify-center w-full mt-4 mb-4">
          <p className="text-center text-lg font-bold text-zinc-600 mb-6">
            {warning}
          </p>
          <div className="flex space-x-4">
            <button type="button" className="btn btn-success text-white" onClick={onConfirm}>
              Yes
            </button>
            <button type="button" className="btn btn-secondary text-white" onClick={onClose}>
              No
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImportWarningDialog
