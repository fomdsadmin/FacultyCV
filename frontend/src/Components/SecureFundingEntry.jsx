import React from "react";
import { FaPlusCircle, FaTimesCircle } from "react-icons/fa";

const SecureFundingEntry = ({ secureFundingData, onSelect, selected }) => {
  const handleToggle = () => {
    onSelect(secureFundingData, !selected);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white hover:border-gray-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1.5">
          <div>
            <div className="text-sm font-semibold text-gray-900">{secureFundingData.title}</div>
            {secureFundingData.dates && <div className="text-xs text-gray-500 mt-0.5">{secureFundingData.dates}</div>}
          </div>

          <div className="text-xs text-gray-700 space-y-1">
            <div>
              <span className="font-semibold text-gray-800">Amount:</span> ${secureFundingData.amount}
            </div>
            {secureFundingData.agency && secureFundingData.agency.toLowerCase() === "rise"
              ? secureFundingData.sponsor && (
                  <div>
                    <span className="font-semibold text-gray-800">Sponsor:</span> {secureFundingData.sponsor}
                  </div>
                )
              : secureFundingData.agency && (
                  <div>
                    <span className="font-semibold text-gray-800">Agency:</span> {secureFundingData.agency}
                  </div>
                )}

            {secureFundingData.program && secureFundingData.program.trim() !== "" && (
              <div>
                <span className="font-semibold text-gray-800">Program:</span> {secureFundingData.program}
              </div>
            )}

            {secureFundingData.department && secureFundingData.department.trim() !== "" && (
              <div>
                <span className="font-semibold text-gray-800">Department:</span> {secureFundingData.department}
              </div>
            )}
          </div>
        </div>

        <button
          className="flex-shrink-0 p-1 hover:bg-gray-50 rounded-full transition-colors"
          onClick={handleToggle}
          aria-label={selected ? "Deselect grant" : "Select grant"}
        >
          {selected ? (
            <FaTimesCircle className="h-5 w-5 text-gray-600" />
          ) : (
            <FaPlusCircle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          )}
        </button>
      </div>
    </div>
  );
};

export default SecureFundingEntry;
