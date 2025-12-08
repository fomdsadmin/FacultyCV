import React, { useState } from "react";
import { useNotification } from "Contexts/NotificationContext";
import { FiDownload } from "react-icons/fi";

const EditSaveJsonModal = ({ 
  json, 
  setJson, 
  buttonLabel = "Edit JSON",
  modalTitle = "Edit JSON",
  modalDescription = "Edit or paste JSON below. Click Save to apply changes.",
  buttonIcon = FiDownload,
  buttonColor = "bg-blue-600 hover:bg-blue-700"
}) => {
  const { setNotification } = useNotification();
  const [open, setOpen] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [copied, setCopied] = useState(false);
  const [jsonError, setJsonError] = useState("");

  const handleOpen = () => {
    setJsonText(JSON.stringify(json, null, 2));
    setOpen(true);
    setCopied(false);
    setJsonError("");
  };

  const handleClose = () => setOpen(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setNotification({ message: "JSON copied to clipboard!", type: "success" });
    setTimeout(() => setCopied(false), 1200);
  };

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJson(parsed);
      setOpen(false);
      setNotification({ message: "JSON saved successfully!", type: "success" });
    } catch (e) {
      setJsonError(`Invalid JSON: ${e.message}`);
      setNotification({ message: `Invalid JSON: ${e.message}`, type: "error" });
    }
  };

  const IconComponent = buttonIcon;

  return (
    <>
      <button
        className={`px-4 py-2 ${buttonColor} text-white rounded font-medium flex items-center justify-center gap-2 text-xs transition-colors`}
        onClick={handleOpen}
      >
        <IconComponent size={14} />
        {buttonLabel}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-25 z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 min-w-[600px] max-w-[90vw] shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
            <h2 className="mb-2 text-xl font-bold">{modalTitle}</h2>
            <p className="text-sm text-gray-600 mb-4">{modalDescription}</p>

            <textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setJsonError("");
              }}
              className="w-full flex-1 font-mono text-sm mb-4 border border-gray-300 rounded-lg p-3 resize-none min-h-[300px]"
              placeholder="Paste or edit JSON here..."
            />

            {jsonError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded text-red-700 text-sm">
                {jsonError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded font-medium transition-colors text-sm"
                onClick={handleCopy}
              >
                {copied ? "✓ Copied!" : "Copy JSON"}
              </button>
              <button
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors text-sm"
                onClick={handleSave}
              >
                Save
              </button>
              <button
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded font-medium transition-colors text-sm"
                onClick={handleClose}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditSaveJsonModal;
