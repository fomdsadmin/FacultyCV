import React from "react";

const OptionsModal = ({ 
  isOpen, 
  onClose, 
  onFind, 
  onManualAdd, 
  title, 
  findButtonText = "Find ID" 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 my-auto flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded-lg shadow-lg w-96 max-w-full">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              onClose();
              onFind();
            }}
            className="btn btn-primary text-white"
          >
            {findButtonText}
          </button>
          <button
            onClick={() => {
              onClose();
              onManualAdd();
            }}
            className="btn btn-outline"
          >
            Add Manually
          </button>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="btn btn-sm btn-ghost">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default OptionsModal;