import React, { useState } from "react";
import { Section, Dropdown } from "./Affiliations";
import { useFaculty } from "../FacultyContext.jsx";

const AcademicUnitSection = ({ primaryUnit, setPrimaryUnit, jointUnits, setJointUnits }) => {
  const { departments, ranks } = useFaculty();
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);

  // Handler for primary unit additional info changes - now handles array
  const handlePrimaryUnitAdditionalInfoChange = (index, field, value) => {
    const updatedUnits = [...primaryUnit];
    updatedUnits[index] = {
      ...updatedUnits[index],
      additional_info: {
        ...(updatedUnits[index].additional_info || {}),
        [field]: value,
      },
    };
    setPrimaryUnit(updatedUnits);
  };

  // Handler for primary unit main field changes (like location)
  const handlePrimaryUnitMainFieldChange = (index, field, value) => {
    const updatedUnits = [...primaryUnit];
    updatedUnits[index] = {
      ...updatedUnits[index],
      [field]: value,
    };
    setPrimaryUnit(updatedUnits);
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

  // Handler for joint unit main field changes (like location)
  const handleJointUnitMainFieldChange = (index, field, value) => {
    const updatedUnits = [...jointUnits];
    updatedUnits[index] = {
      ...updatedUnits[index],
      [field]: value,
    };
    setJointUnits(updatedUnits);
  };

  // Check if we have any units to display - updated for array
  const hasPrimaryUnit = primaryUnit && primaryUnit.length > 0;
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
                  {/* <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Business Title (i.e Head)
                  </th> */}
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Appointment %
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Division (if applicable)
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Program (if applicable)
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    In Role since
                  </th>
                  {/* <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Track Type
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    End Date
                  </th> */}
                  {/* <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th> */}
                </tr>
              </thead>
              <tbody className="bg-white divide-x divide-white ">
                {/* Primary Unit Rows - Now handles array */}
                {hasPrimaryUnit &&
                  primaryUnit.map((unit, idx) => (
                    <tr key={`primary-${idx}`} className="">
                      <td className="px-2 py-4 text-sm font-medium text-blue-700">Primary</td>
                      <td className="px-2 py-4 text-sm text-gray-700">
                        <div className="py-2 min-h-[2rem] break-words">
                          {unit.unit || ""}
                        </div>
                      </td>
                      <td className="px-2 py-4 text-sm text-gray-700">
                        <div className="py-2 min-h-[2rem] break-words">
                          {unit.rank || ""}
                        </div>
                      </td>
                      {/* <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700">
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100 cursor-not-allowed"
                          value={unit.title || ""}
                          readOnly
                        />
                      </td> */}
                      <td className="px-2 py-4 text-sm text-gray-700">
                        <div className="py-2 min-h-[2rem] break-words">
                          {unit.apt_percent || ""}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        <textarea
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm resize-none min-h-[2rem]"
                          rows="1"
                          value={(unit.additional_info && unit.additional_info.division) || ""}
                          onChange={(e) => handlePrimaryUnitAdditionalInfoChange(idx, "division", e.target.value)}
                          placeholder="Enter division"
                          style={{ fieldSizing: 'content' }}
                        />
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        <textarea
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm resize-none min-h-[2rem]"
                          rows="1"
                          value={(unit.additional_info && unit.additional_info.program) || ""}
                          onChange={(e) => handlePrimaryUnitAdditionalInfoChange(idx, "program", e.target.value)}
                          placeholder="Enter program"
                          style={{ fieldSizing: 'content' }}
                        />
                      </td>
                      <td className="px-2 py-4 text-sm text-gray-700">
                        <textarea
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm resize-none min-h-[2rem]"
                          rows="1"
                          value={unit.location || ""}
                          onChange={(e) => handlePrimaryUnitMainFieldChange(idx, "location", e.target.value)}
                          placeholder="e.g., Hospital Name"
                          style={{ fieldSizing: 'content' }}
                        />
                      </td>
                      <td className="px-2 py-4 text-sm text-gray-700">
                        <input
                          type="date"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          value={unit.since || ""}
                          onChange={(e) => handlePrimaryUnitMainFieldChange(idx, "since", e.target.value)}
                        />
                      </td>
                      {/* <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700">
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100 cursor-not-allowed"
                          value={unit.type ? unit.type.toUpperCase() || "" : ""}
                          readOnly
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        <input
                          type="date"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100 cursor-not-allowed"
                          value={(unit.additional_info && unit.additional_info.start) || ""}
                          readOnly
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        <input
                          type="date"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100 cursor-not-allowed"
                          value={(unit.additional_info && unit.additional_info.end) || ""}
                          readOnly
                        />
                      </td> */}
                    </tr>
                  ))}

                {/* Joint Units Rows */}
                {hasJointUnits &&
                  jointUnits.map((unit, idx) => (
                    <tr key={idx}>
                      <td className="px-2 py-4 text-sm font-medium text-gray-600">Joint</td>
                      <td className="px-2 py-4 text-sm text-gray-700">
                        {/* <Dropdown
                          name="unit"
                          value={unit.unit || ""}
                          onChange={() => {}}
                          options={departments}
                          readOnly
                          disabled
                        /> */}
                        <div className="py-2 min-h-[2rem] break-words">
                          {unit.unit || ""}
                        </div>
                      </td>
                      <td className="px-2 py-4 text-sm text-gray-700">
                        {/* <Dropdown
                          name="rank"
                          value={unit.rank || ""}
                          onChange={() => {}}
                          options={ranks}
                          readOnly
                          disabled
                        /> */}
                        <div className="py-2 min-h-[2rem] break-words">
                          {unit.rank || ""}
                        </div>
                      </td>
                      {/* <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700">
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100 cursor-not-allowed"
                          value={unit.title || ""}
                          readOnly
                        />
                      </td> */}
                      <td className="px-2 py-4 text-sm text-gray-700">
                        <div className="py-2 min-h-[2rem] break-words">
                          {unit.apt_percent || ""}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        <textarea
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm resize-none min-h-[2rem]"
                          rows="1"
                          value={(unit.additional_info && unit.additional_info.division) || ""}
                          onChange={(e) => handleJointUnitAdditionalInfoChange(idx, "division", e.target.value)}
                          placeholder="Enter division"
                          style={{ fieldSizing: 'content' }}
                        />
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        <textarea
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm resize-none min-h-[2rem]"
                          rows="1"
                          value={(unit.additional_info && unit.additional_info.program) || ""}
                          onChange={(e) => handleJointUnitAdditionalInfoChange(idx, "program", e.target.value)}
                          placeholder="Enter program"
                          style={{ fieldSizing: 'content' }}
                        />
                      </td>
                      <td className="px-2 py-4 text-sm text-gray-700">
                        <textarea
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm resize-none min-h-[2rem]"
                          rows="1"
                          value={unit.location || ""}
                          onChange={(e) => handleJointUnitMainFieldChange(idx, "location", e.target.value)}
                          placeholder="e.g., Hospital Name"
                          style={{ fieldSizing: 'content' }}
                        />
                      </td>
                      <td className="px-2 py-4 text-sm text-gray-700">
                        <input
                          type="date"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          value={unit.since || ""}
                          onChange={(e) => handleJointUnitMainFieldChange(idx, "since", e.target.value)}
                        />
                      </td>
                      {/* <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700">
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100 cursor-not-allowed"
                          value={unit.type ? unit.type.toUpperCase() || "" : ""}
                          readOnly
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        <input
                          type="date"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100 cursor-not-allowed"
                          value={(unit.additional_info && unit.additional_info.start) || ""}
                          readOnly
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        <input
                          type="date"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100 cursor-not-allowed"
                          value={(unit.additional_info && unit.additional_info.end) || ""}
                          readOnly
                        />
                      </td> */}
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
        </div>
      </Section>

      {/* Only show Additional Academic Information toggle if there are units */}
      {hasAnyUnits && (
        <>
          {/* <button
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
          </button> */}

          {/* Collapsible content */}
          {/* {showAdditionalInfo && (
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {hasPrimaryUnit &&
                      primaryUnit.map((unit, idx) => (
                        <tr key={`primary-additional-${idx}`} className="bg-blue-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-700">Primary</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                            {unit.unit || "Not specified"}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              value={(unit.additional_info && unit.additional_info.division) || ""}
                              onChange={(e) => handlePrimaryUnitAdditionalInfoChange(idx, "division", e.target.value)}
                              placeholder="Enter division"
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              value={(unit.additional_info && unit.additional_info.program) || ""}
                              onChange={(e) => handlePrimaryUnitAdditionalInfoChange(idx, "program", e.target.value)}
                              placeholder="Enter program"
                            />
                          </td>
                          <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700">
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              value={unit.location || ""}
                              onChange={(e) => handlePrimaryUnitMainFieldChange(idx, "location", e.target.value)}
                              placeholder="e.g., Hospital Name"
                            />
                          </td>
                        </tr>
                      ))}

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
                          <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700">
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              value={unit.location || ""}
                              onChange={(e) => handleJointUnitMainFieldChange(idx, "location", e.target.value)}
                              placeholder="e.g., Hospital Name"
                            />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )} */}
        </>
      )}
    </>
  );
};

export default AcademicUnitSection;
