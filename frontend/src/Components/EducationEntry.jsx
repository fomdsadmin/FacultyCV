import React from "react";

const EducationEntry = ({ educationData, onSelect, selected }) => {
  const handleCheckboxChange = () => {
    onSelect(educationData, !selected);
  };

  return (
    <div
      className={`border rounded-lg p-4 transition-all duration-200 ${
        selected
          ? "border-blue-500 bg-blue-50 shadow-md"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={handleCheckboxChange}
          className="checkbox checkbox-primary mt-1 flex-shrink-0"
        />

        {/* Education Details */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Left Column */}
            <div className="space-y-2">
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Institution</div>
                <div className="text-sm font-semibold text-gray-900 break-words">
                  {educationData["university/organization"] || "N/A"}
                </div>
              </div>
              {educationData.subject_area && (
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Subject Area</div>
                  <div className="text-sm text-gray-700 break-words">{educationData.subject_area}</div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-2">
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Dates</div>
                <div className="text-sm text-gray-700">{educationData.dates || "N/A"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
  );
};

export default EducationEntry;
