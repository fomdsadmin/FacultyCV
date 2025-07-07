import React, { useEffect, useState } from "react";
import { Section, Dropdown } from "./Affiliations";
import { useFaculty } from "../FacultyContext.jsx";

const HospitalAffiliationSection = ({ hospitalAffiliations, setHospitalAffiliations }) => {
  const { authorities, authoritiesMap } = useFaculty();
  
  // Debug: Log the structure of authoritiesMap for troubleshooting
  useEffect(() => {
    console.log("Authorities Map:", authoritiesMap);
  }, [authoritiesMap]);

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
    
    // Debug the updated state
    console.log(`Updated ${field} for index ${index} to ${value}`);
  };

  // Function to add a new hospital affiliation
  const handleAddHospitalAffiliation = () => {
    // Create a new empty hospital affiliation
    const newAffiliation = {
      authority: "",
      hospital: "",
      role: "",
      start: "",
      end: ""
    };
    
    // Add to the hospitalAffiliations array
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
    // Handle empty or invalid authority
    if (!authority || !authoritiesMap) {
      return [];
    }
    
    // Make sure we have hospitals for this authority
    const hospitals = authoritiesMap[authority];
    if (Array.isArray(hospitals) && hospitals.length > 0) {
      return hospitals;
    }
    
    return [];
  };

  return (
    <Section title="Health Authority/Hospital Affiliation">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Health Authority
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Hospital
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Role (i.e Medical Director)
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Start Date
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                End Date
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {hospitalAffiliations.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-4">
                  No hospital affiliations added.
                </td>
              </tr>
            ) : (
              hospitalAffiliations.map((affiliation, idx) => {
                // Get hospital options for this specific authority
                const hospitalOptions = getHospitalOptions(affiliation.authority);
                
                return (
                  <tr key={idx}>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <Dropdown
                        name={`authority-${idx}`}
                        value={affiliation.authority || ""}
                        onChange={(e) => {
                          handleHospitalInputChange(idx, "authority", e.target.value);
                        }}
                        options={authorities}
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <Dropdown
                        name={`hospital-${idx}`}
                        value={affiliation.hospital || ""}
                        onChange={(e) => handleHospitalInputChange(idx, "hospital", e.target.value)}
                        options={hospitalOptions}
                        disabled={!affiliation.authority}
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-200"
                        placeholder="Enter role"
                        value={affiliation.role || ""}
                        onChange={(e) => handleHospitalInputChange(idx, "role", e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <input
                        type="date"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-200"
                        value={affiliation.start || ""}
                        onChange={(e) => handleHospitalInputChange(idx, "start", e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <input
                        type="date"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-200"
                        value={affiliation.end || ""}
                        onChange={(e) => handleHospitalInputChange(idx, "end", e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                      <button
                        onClick={() => handleDeleteHospitalAffiliation(idx)}
                        className="text-red-500 hover:text-red-700"
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
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
    </Section>
  );
};

export default HospitalAffiliationSection;