import React from "react";
import { Section, Dropdown } from "./Affiliations";
import { useFaculty } from "../FacultyContext.jsx";

const ResearchAffiliationSection = ({ researchAffiliations, setResearchAffiliations }) => {
  const { affiliations } = useFaculty();

  const handleResearchInputChange = (index, field, value) => {
    const updatedAffiliations = [...researchAffiliations];
    updatedAffiliations[index] = {
      ...updatedAffiliations[index],
      [field]: value,
    };
    setResearchAffiliations(updatedAffiliations);
  };

  // Function to add a new research affiliation
  const handleAddResearchAffiliation = () => {
    // Create a new empty research affiliation
    const newAffiliation = {
      center: "",
      division: "",
      title: "",
      start: "",
      end: ""
    };
    
    // Add to the researchAffiliations array
    setResearchAffiliations([...researchAffiliations, newAffiliation]);
  };

  // Function to delete a research affiliation
  const handleDeleteResearchAffiliation = (index) => {
    const updatedAffiliations = [...researchAffiliations];
    updatedAffiliations.splice(index, 1);
    setResearchAffiliations(updatedAffiliations);
  };

  return (
    <Section title="Research Affiliation">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Research Center/Institute
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Division/Pillar (if applicable)
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Title (i.e Head)
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
            {researchAffiliations.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-4">
                  No research affiliations added.
                </td>
              </tr>
            ) : (
              researchAffiliations.map((affiliation, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Dropdown
                      name={`center-${idx}`}
                      value={affiliation.center || ""}
                      onChange={(e) => handleResearchInputChange(idx, "center", e.target.value)}
                      options={affiliations}
                    />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-200"
                      placeholder="Enter division/pillar"
                      value={affiliation.division || ""}
                      onChange={(e) => handleResearchInputChange(idx, "division", e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-200"
                      placeholder="Enter title"
                      value={affiliation.title || ""}
                      onChange={(e) => handleResearchInputChange(idx, "title", e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-200"
                      value={affiliation.start || ""}
                      onChange={(e) => handleResearchInputChange(idx, "start", e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-200"
                      value={affiliation.end || ""}
                      onChange={(e) => handleResearchInputChange(idx, "end", e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    <button
                      onClick={() => handleDeleteResearchAffiliation(idx)}
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
              ))
            )}
          </tbody>
        </table>
        <div className="mt-2 text-right">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
            onClick={handleAddResearchAffiliation}
            type="button"
          >
            + Add
          </button>
        </div>
      </div>
    </Section>
  );
};

export default ResearchAffiliationSection;