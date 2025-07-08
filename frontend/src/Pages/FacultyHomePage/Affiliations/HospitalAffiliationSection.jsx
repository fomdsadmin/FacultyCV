import React, { useEffect, useState } from "react";
import { Section, Dropdown } from "./Affiliations";
import { useFaculty } from "../FacultyContext.jsx";

const HospitalAffiliationSection = ({ hospitalAffiliations, setHospitalAffiliations }) => {
  const { authorities, authoritiesMap } = useFaculty();
  const [showHospitalDetails, setShowHospitalDetails] = useState(false);
  
  const handleHospitalInputChange = (index, field, value) => {
    const updatedAffiliations = [...hospitalAffiliations];
    updatedAffiliations[index] = {
      ...updatedAffiliations[index],
      [field]: value,
    };
    
    // If changing authority, reset the hospital selection
    if (field === "authority") {
      updatedAffiliations[index].hospital = "";
    }
    
    setHospitalAffiliations(updatedAffiliations);
  };

  // Function to add a new hospital affiliation
  const handleAddHospitalAffiliation = () => {
    const newAffiliation = {
      authority: "",
      hospital: "",
      role: "",
      start: "",
      end: ""
    };
    
    setHospitalAffiliations([...hospitalAffiliations, newAffiliation]);
  };

  // Function to delete a hospital affiliation
  const handleDeleteHospitalAffiliation = (index) => {
    const updatedAffiliations = [...hospitalAffiliations];
    updatedAffiliations.splice(index, 1);
    setHospitalAffiliations(updatedAffiliations);
  };
  
  // Helper function to get hospital options for a given authority
  const getHospitalOptions = (authority) => {
    if (!authority || !authoritiesMap) {
      return [];
    }
    
    const hospitals = authoritiesMap[authority];
    if (Array.isArray(hospitals) && hospitals.length > 0) {
      return hospitals;
    }
    
    return [];
  };

  return (
    <>
      {/* Dropdown button for Hospital Affiliations */}
      <div className="">
        <button
          onClick={() => setShowHospitalDetails(!showHospitalDetails)}
          className="flex items-center justify-between w-full bg-gray-50 hover:bg-gray-100 transition-colors px-4 py-2 rounded border text-left font-semibold text-zinc-600"
        >
          <span>Health Authority/Hospital Affiliation</span>
          <svg
            className={`h-5 w-5 transition-transform ${showHospitalDetails ? 'transform rotate-180' : ''}`}
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
        {showHospitalDetails && (
          <div className="mt-4 border rounded-lg bg-white p-4">
            <div className="overflow-x-auto">
              {hospitalAffiliations.length === 0 ? (
                <div className="text-center text-gray-400">
                  No hospital affiliations found.
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Health Authority
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Hospital
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Role (i.e Medical Director)
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Start Date
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        End Date
                      </th>
                      {/* Removed the Actions heading */}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {hospitalAffiliations.map((affiliation, idx) => {
                      // Get hospital options for this specific authority
                      const hospitalOptions = getHospitalOptions(affiliation.authority);
                      
                      return (
                        <tr key={idx} className="relative">
                          <td className="pr-2 py-4 whitespace-nowrap text-sm text-gray-700">
                            <Dropdown
                              name={`authority-${idx}`}
                              value={affiliation.authority || ""}
                              onChange={(e) => {
                                handleHospitalInputChange(idx, "authority", e.target.value);
                              }}
                              options={authorities}
                            />
                          </td>
                          <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700">
                            <Dropdown
                              name={`hospital-${idx}`}
                              value={affiliation.hospital || ""}
                              onChange={(e) => handleHospitalInputChange(idx, "hospital", e.target.value)}
                              options={hospitalOptions}
                              disabled={!affiliation.authority}
                            />
                          </td>
                          <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700">
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              placeholder="Enter role"
                              value={affiliation.role || ""}
                              onChange={(e) => handleHospitalInputChange(idx, "role", e.target.value)}
                            />
                          </td>
                          <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700">
                            <input
                              type="date"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              value={affiliation.start || ""}
                              onChange={(e) => handleHospitalInputChange(idx, "start", e.target.value)}
                            />
                          </td>
                          <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700 pr-10">
                            <div className="flex items-center">
                              <input
                                type="date"
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                value={affiliation.end || ""}
                                onChange={(e) => handleHospitalInputChange(idx, "end", e.target.value)}
                              />
                              {/* Delete button positioned absolutely to the right */}
                              <button
                                onClick={() => handleDeleteHospitalAffiliation(idx)}
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
                      );
                    })}
                  </tbody>
                </table>
              )}
              <div className="mt-2 text-right">
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  type="button"
                  onClick={handleAddHospitalAffiliation}
                >
                  + Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default HospitalAffiliationSection;