import React, { useState } from "react";
import { Section, Dropdown } from "./Affiliations";
import { useFaculty } from "../FacultyContext.jsx";

const AcademicUnitSection = ({ academicUnits, setAcademicUnits, setAffiliationsData }) => {
  const { departments, ranks } = useFaculty();
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  
  const handleAffiliationInputChange = (index, field, value) => {
    const updatedUnits = [...academicUnits];
    updatedUnits[index] = {
      ...updatedUnits[index],
      [field]: value,
    };
    setAcademicUnits(updatedUnits);
  };

  // Function to handle changes to additional info fields
  const handleAdditionalInfoChange = (index, field, value) => {
    const updatedUnits = [...academicUnits];
    updatedUnits[index] = {
      ...updatedUnits[index],
      additional_info: {
        ...updatedUnits[index].additional_info,
        [field]: value
      }
    };
    setAcademicUnits(updatedUnits);
  };

  // Function to add a new academic unit
  const handleAddAcademicUnit = () => {
    // Create a new empty academic unit with additional_info
    const newUnit = {
      unit: "",
      rank: "",
      title: "",
      percent: "",
      additional_info: {
        division: "",
        program: "",
        start: "",
        end: ""
      }
    };

    // Add to the academicUnits array
    setAcademicUnits([...academicUnits, newUnit]);
  };

  // Function to delete an academic unit
  const handleDeleteAcademicUnit = (index) => {
    const updatedUnits = [...academicUnits];
    updatedUnits.splice(index, 1);
    setAcademicUnits(updatedUnits);
  };

  return (
    <>
      <Section title="Academic Units (Workday)">
        <div className="overflow-x-auto">
          {academicUnits.length === 0 ? (
            <div className="text-center text-gray-400">
              No academic units found.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Academic Unit
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Academic Rank
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Title (i.e Head)
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Appointment %
                  </th>
                  {/* Removed the Actions heading */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {academicUnits.map((unit, idx) => (
                  <tr key={idx} className="relative">
                    {/* Academic Unit column */}
                    <td className="pr-2 py-4 whitespace-nowrap text-sm text-gray-700">
                      <Dropdown
                        name="unit"
                        value={unit.unit || ""}
                        onChange={(e) => handleAffiliationInputChange(idx, "unit", e.target.value)}
                        options={departments}
                      />
                    </td>
                    {/* Academic Rank column */}
                    <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700">
                      <Dropdown
                        name="rank"
                        value={unit.rank || ""}
                        onChange={(e) => handleAffiliationInputChange(idx, "rank", e.target.value)}
                        options={ranks}
                      />
                    </td>
                    {/* Title column */}
                    <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700">
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        value={unit.title || ""}
                        onChange={(e) => handleAffiliationInputChange(idx, "title", e.target.value)}
                      />
                    </td>
                    {/* Appointment percent column with delete button positioned at the right */}
                    <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700 pr-10">
                      <div className="flex items-center">
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          value={unit.percent || ""}
                          onChange={(e) => handleAffiliationInputChange(idx, "percent", e.target.value)}
                        />
                        {/* Delete button positioned absolutely to the right */}
                        <button
                          onClick={() => handleDeleteAcademicUnit(idx)}
                          className="text-red-500 hover:text-red-700 absolute right-2"
                          title="Delete"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Add button for new academic unit - always show this */}
          <div className="mt-2 text-right">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
              type="button"
              onClick={handleAddAcademicUnit}
            >
              + Add
            </button>
          </div>
        </div>
      </Section>
      
      {/* Only show Additional Academic Information toggle if there are units */}
      {academicUnits.length > 0 && (
        <div className="">
          <button
            onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
            className="flex items-center justify-between w-full bg-gray-50 hover:bg-gray-100 transition-colors px-4 py-2 rounded border text-left font-semibold text-zinc-600"
          >
            <span>Additional Academic Information</span>
            <svg
              className={`h-5 w-5 transition-transform ${showAdditionalInfo ? 'transform rotate-180' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          
          {/* Collapsible content */}
          {showAdditionalInfo && (
            <div className="mt-4 border rounded-lg">
              <div className="overflow-x-auto p-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Academic Unit
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Division (if applicable)
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Program (if applicable)
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Start Date
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        End Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {academicUnits.map((unit, idx) => (
                      <tr key={`additional-${idx}`}>
                        {/* Display academic unit name */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                          {unit.unit || "Not specified"}
                        </td>
                        
                        {/* Division input */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            value={(unit.additional_info && unit.additional_info.division) || ""}
                            onChange={(e) => handleAdditionalInfoChange(idx, "division", e.target.value)}
                            placeholder="Enter division"
                          />
                        </td>
                        
                        {/* Program input */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            value={(unit.additional_info && unit.additional_info.program) || ""}
                            onChange={(e) => handleAdditionalInfoChange(idx, "program", e.target.value)}
                            placeholder="Enter program"
                          />
                        </td>
                        
                        {/* Start date input */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                          <input
                            type="date"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            value={(unit.additional_info && unit.additional_info.start) || ""}
                            onChange={(e) => handleAdditionalInfoChange(idx, "start", e.target.value)}
                          />
                        </td>
                        
                        {/* End date input */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                          <input
                            type="date"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            value={(unit.additional_info && unit.additional_info.end) || ""}
                            onChange={(e) => handleAdditionalInfoChange(idx, "end", e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AcademicUnitSection;
