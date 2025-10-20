import React from 'react';

const EmploymentEntry = ({ employmentData, onSelect, selected }) => {
  const handleCheckboxChange = () => {
    onSelect(employmentData, !selected);
  };

  return (
    <div
      className={`border rounded-lg p-4 transition-all duration-200 ${
        selected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
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

        {/* Employment Details */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 items-center">
            {/* Left Column */}
            <div className="space-y-2">
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Organization
                </div>
                <div className="text-sm font-semibold text-gray-900 break-words">
                  {employmentData["university/organization"] || "N/A"}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Position/Title
                </div>
                <div className="text-sm text-gray-700 break-words">
                  {employmentData.rank_or_title || "N/A"}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-2">
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Dates
                </div>
                <div className="text-sm text-gray-700">
                  {employmentData.dates || "N/A"}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Type
                </div>
                <div className="text-sm ml-[-6px]">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      employmentData.type.includes("Present")
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {employmentData.type || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmploymentEntry;