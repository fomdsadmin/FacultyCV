import React, { useState } from "react";
import { Section, Dropdown } from "./Affiliations";
import { useFaculty } from "../FacultyContext.jsx";

const AcademicUnitSection = ({ primaryUnit, setPrimaryUnit, jointUnits, setJointUnits }) => {
  const { departments, ranks } = useFaculty();
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);

  // Handler for primary unit changes
  const handlePrimaryUnitChange = (field, value) => {
    setPrimaryUnit({
      ...primaryUnit,
      [field]: value,
    });
  };

  // Handler for primary unit additional info changes
  const handlePrimaryUnitAdditionalInfoChange = (field, value) => {
    setPrimaryUnit({
      ...primaryUnit,
      additional_info: {
        ...(primaryUnit.additional_info || {}),
        [field]: value,
      },
    });
  };

  // Handler for joint units changes
  const handleJointUnitChange = (index, field, value) => {
    const updatedUnits = [...jointUnits];
    updatedUnits[index] = {
      ...updatedUnits[index],
      [field]: value,
    };
    setJointUnits(updatedUnits);
  };

  // Handler for joint units additional info changes
  const handleJointUnitAdditionalInfoChange = (index, field, value) => {
    const updatedUnits = [...jointUnits];
    updatedUnits[index] = {
      ...updatedUnits[index],
      additional_info: {
        ...(updatedUnits[index].additional_info || {}),
        [field]: value,
      },
    };
    setJointUnits(updatedUnits);
  };

  // Function to add a new joint unit
  const handleAddJointUnit = () => {
    const newUnit = {
      unit: "",
      rank: "",
      title: "",
      percent: "",
      location: "",
      additional_info: {
        division: "",
        program: "",
        start: "",
        end: "",
      },
    };
    setJointUnits([...jointUnits, newUnit]);
  };

  // Function to delete a joint unit
  const handleDeleteJointUnit = (index) => {
    const updatedUnits = [...jointUnits];
    updatedUnits.splice(index, 1);
    setJointUnits(updatedUnits);
  };

  // Function to initialize primary unit if it's empty
  const initializePrimaryUnit = () => {
    if (!primaryUnit || Object.keys(primaryUnit).length === 0) {
      setPrimaryUnit({
        unit: "",
        rank: "",
        title: "",
        percent: "",
        location: "",
        additional_info: {
          division: "",
          program: "",
          start: "",
          end: "",
        },
      });
    }
  };

  // Check if we have any units to display
  const hasPrimaryUnit = primaryUnit && Object.keys(primaryUnit).length > 0;
  const hasJointUnits = jointUnits && jointUnits.length > 0;
  const hasAnyUnits = hasPrimaryUnit || hasJointUnits;

  return (
    <>
      <Section title="Academic Units (Workday)">
        <div className="overflow-x-auto">
          {!hasAnyUnits ? (
            <div className="text-center text-gray-400 mb-4 p-4">No academic units found.</div>
          ) : (
            <table className="min-w-full divide-x divide-white">
              <thead className="">
                <tr className="bg-gray-100">
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Academic Unit
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Academic Rank
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Business Title (i.e Head)
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Appointment %
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  {/* <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th> */}
                </tr>
              </thead>
              <tbody className="bg-white divide-x divide-white ">
                {/* Primary Unit Row */}
                {hasPrimaryUnit && (
                  <tr className="">
                    <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-blue-700">Primary</td>
                    <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700">
                      {/* <Dropdown
                        name="unit"
                        value={primaryUnit.unit || ""}
                        onChange={() => {}}
                        options={departments}
                        readOnly
                        disabled
                      /> */}
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100 cursor-not-allowed"
                        value={primaryUnit.unit || ""}
                        readOnly
                      />
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700">
                      {/* <Dropdown
                        name="rank"
                        value={primaryUnit.rank || ""}
                        onChange={() => {}}
                        options={ranks}
                        readOnly
                        disabled
                      /> */}
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100 cursor-not-allowed"
                        value={primaryUnit.rank || ""}
                        readOnly
                      />
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700">
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100 cursor-not-allowed"
                        value={primaryUnit.title || ""}
                        readOnly
                      />
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700">
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100 cursor-not-allowed"
                        value={primaryUnit.location || ""}
                        readOnly
                        placeholder="e.g., Hospital Name"
                      />
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700">
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100 cursor-not-allowed"
                        value={primaryUnit.apt_percent || ""}
                        readOnly
                      />
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700">
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100 cursor-not-allowed"
                        value={primaryUnit.type ? primaryUnit.type.toUpperCase() || "" : ""}
                        readOnly
                      />
                    </td>
                    {/* <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700">
                      <button
                        onClick={() => setPrimaryUnit({})}
                        className="text-red-500 hover:text-red-700"
                        title="Remove Primary Unit"
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
                    </td> */}
                  </tr>
                )}

                {/* Joint Units Rows */}
                {hasJointUnits &&
                  jointUnits.map((unit, idx) => (
                    <tr key={idx}>
                      <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-gray-600">Joint</td>
                      <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700">
                        {/* <Dropdown
                          name="unit"
                          value={unit.unit || ""}
                          onChange={() => {}}
                          options={departments}
                          readOnly
                          disabled
                        /> */}
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100 cursor-not-allowed"
                          value={unit.unit || ""}
                          readOnly
                        />
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700">
                        {/* <Dropdown
                          name="rank"
                          value={unit.rank || ""}
                          onChange={() => {}}
                          options={ranks}
                          readOnly
                          disabled
                        /> */}
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100 cursor-not-allowed"
                          value={unit.rank || ""}
                          readOnly
                        />
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700">
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100 cursor-not-allowed"
                          value={unit.title || ""}
                          readOnly
                        />
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700">
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100 cursor-not-allowed"
                          value={unit.location || ""}
                          readOnly
                          placeholder="e.g., Hospital Name"
                        />
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700">
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100 cursor-not-allowed"
                          value={unit.apt_percent || ""}
                          readOnly
                        />
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700">
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100 cursor-not-allowed"
                          value={unit.type ? unit.type.toUpperCase() || "" : ""}
                          readOnly
                        />
                      </td>
                      {/* <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700">
                      <button
                        onClick={() => handleDeleteJointUnit(idx)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete Joint Unit"
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
                    </td> */}
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {/* Action buttons */}
          {/* <div className="mt-2 flex gap-2 justify-end">
            {!hasPrimaryUnit && (
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                type="button"
                onClick={initializePrimaryUnit}
              >
                + Add Primary Unit
              </button>
            )}
            <button
              className={`px-3 py-1 rounded text-sm ${
                !hasPrimaryUnit 
                  ? "bg-gray-400 text-gray-600 cursor-not-allowed" 
                  : "bg-green-500 hover:bg-green-600 text-white"
              }`}
              type="button"
              onClick={handleAddJointUnit}
              disabled={!hasPrimaryUnit}
              title={!hasPrimaryUnit ? "Please add a primary unit first" : "Add joint unit"}
            >
              + Add Joint Unit
            </button>
          </div> */}
        </div>
      </Section>

      {/* Only show Additional Academic Information toggle if there are units */}
      {hasAnyUnits && (
        <div className="">
          <button
            onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
            className="flex items-center justify-between w-full bg-gray-50 hover:bg-gray-100 transition-colors px-4 py-2 rounded border text-left font-semibold text-zinc-600"
          >
            <span>Additional Academic Information</span>
            <svg
              className={`h-5 w-5 transition-transform ${showAdditionalInfo ? "transform rotate-180" : ""}`}
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
                        Type
                      </th>
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
                    {/* Primary Unit Additional Info */}
                    {hasPrimaryUnit && (
                      <tr className="bg-blue-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-700">Primary</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                          {primaryUnit.unit || "Not specified"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            value={(primaryUnit.additional_info && primaryUnit.additional_info.division) || ""}
                            onChange={(e) => handlePrimaryUnitAdditionalInfoChange("division", e.target.value)}
                            placeholder="Enter division"
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            value={(primaryUnit.additional_info && primaryUnit.additional_info.program) || ""}
                            onChange={(e) => handlePrimaryUnitAdditionalInfoChange("program", e.target.value)}
                            placeholder="Enter program"
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                          <input
                            type="date"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            value={(primaryUnit.additional_info && primaryUnit.additional_info.start) || ""}
                            onChange={(e) => handlePrimaryUnitAdditionalInfoChange("start", e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                          <input
                            type="date"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            value={(primaryUnit.additional_info && primaryUnit.additional_info.end) || ""}
                            onChange={(e) => handlePrimaryUnitAdditionalInfoChange("end", e.target.value)}
                          />
                        </td>
                      </tr>
                    )}

                    {/* Joint Units Additional Info */}
                    {hasJointUnits &&
                      jointUnits.map((unit, idx) => (
                        <tr key={`additional-${idx}`}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-600">Joint</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                            {unit.unit || "Not specified"}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              value={(unit.additional_info && unit.additional_info.division) || ""}
                              onChange={(e) => handleJointUnitAdditionalInfoChange(idx, "division", e.target.value)}
                              placeholder="Enter division"
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              value={(unit.additional_info && unit.additional_info.program) || ""}
                              onChange={(e) => handleJointUnitAdditionalInfoChange(idx, "program", e.target.value)}
                              placeholder="Enter program"
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                            <input
                              type="date"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              value={(unit.additional_info && unit.additional_info.start) || ""}
                              onChange={(e) => handleJointUnitAdditionalInfoChange(idx, "start", e.target.value)}
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                            <input
                              type="date"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              value={(unit.additional_info && unit.additional_info.end) || ""}
                              onChange={(e) => handleJointUnitAdditionalInfoChange(idx, "end", e.target.value)}
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
