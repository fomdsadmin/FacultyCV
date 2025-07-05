import React, { useEffect, useState } from "react";
import { useApp } from "../../Contexts/AppContext";
import { useFaculty } from "./FacultyContext";

// Responsive Section card
const Section = ({ title, children }) => (
  <div className="bg-white border rounded-lg p-4 shadow-sm flex-1 ">
    <h3 className="font-semibold mb-4 text-base text-zinc-600">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
);

// Field component
const Field = ({ label, ...props }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    <select
      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
      {...props}
    >
      <option value="">-</option>
      {props.options.map((opt, idx) => (
        <option key={idx} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

// Field component
const Dropdown = ({ label, ...props }) => (
  <div>
    <select
      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
      {...props}
    >
      <option value="">-</option>
      {props.options.map((opt, idx) => (
        <option key={idx} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

const handleInputChange = (event) => {
  const { name, value } = event.target;
  // setUserInfo((prevUserInfo) => ({
  //   ...prevUserInfo,
  //   [name]: value,
  // }));
};

const Affiliations = () => {
  const { departments, faculties, affiliations,
    authorities, authoritiesMap, institutions, campuses, ranks } = useFaculty();
  const { userInfo } = useApp();

  // Dynamic data placeholders
  const [affiliationsData, setAffiliationsData] = useState([]); 
  const [academicUnits, setAcademicUnits] = useState([]); // [{unit, rank, percent, startDate}]
  const [departmentRows, setDepartmentRows] = useState({}); // { [unit]: [ {division, program, title, start, end, isSub} ] }
  const [researchRows, setResearchRows] = useState([]);
  const [hospitalRows, setHospitalRows] = useState([]);
  

  useEffect(() => {
    // Prepare academic units from userInfo
    const units = [];
    if (userInfo.primary_department) {
      units.push({
        unit: userInfo.primary_department,
        rank: userInfo.primary_rank || userInfo.rank || "",
        percent: userInfo.primary_percent ?? 0,
        startDate: userInfo.primary_startDate || "",
      });
    }
    if (userInfo.secondary_department) {
      units.push({
        unit: userInfo.secondary_department,
        rank: userInfo.secondary_rank || userInfo.rank || "",
        percent: userInfo.secondary_percent ?? 0,
        startDate: userInfo.secondary_startDate || "",
      });
    }
    setAcademicUnits(units);

    // Autofill departmental rows for each academic unit if not already set
    setDepartmentRows((prev) => {
      const updated = { ...prev };
      units.forEach((u) => {
        if (!updated[u.unit]) {
          updated[u.unit] = [
            {
              division: "",
              program: "",
              title: "",
              start: "",
              end: "",
              isSub: false,
            },
          ];
        }
      });
      // Optionally, remove units that are no longer present
      Object.keys(updated).forEach((unitKey) => {
        if (!units.find((u) => u.unit === unitKey)) {
          delete updated[unitKey];
        }
      });
      return updated;
    });
  }, [userInfo]);

  // Add new research row
  const handleAddResearch = () => {
    setResearchRows([...researchRows, { center: "", division: "", title: "", start: "", end: "" }]);
  };

  // Add new hospital row
  const handleAddHospital = () => {
    setHospitalRows([...hospitalRows, { authority: "", hospital: "", role: "", start: "", end: "" }]);
  };

  // Add new department sub-row for a given unit (add after the last main row for that unit)
  const handleAddDepartmentSubRow = (unit) => {
    setDepartmentRows((prev) => {
      const currentRows = prev[unit] || [];
      // Find index of last main row (not sub)
      let lastMainIdx = -1;
      currentRows.forEach((r, i) => {
        if (!r.isSub) lastMainIdx = i;
      });
      // Insert subrow after last main row
      const newRows = [
        ...currentRows.slice(0, lastMainIdx + 1),
        { division: "", program: "", title: "", start: "", end: "", isSub: true },
        ...currentRows.slice(lastMainIdx + 1),
      ];
      return { ...prev, [unit]: newRows };
    });
  };

  // Add this useEffect to autofill researchRows with primary/secondary affiliations
  useEffect(() => {
    const rows = [];
    if (userInfo.primary_affiliation) {
      rows.push({
        center: userInfo.primary_affiliation,
        division: "",
        title: "",
        start: "",
        end: "",
      });
    }
    if (userInfo.secondary_affiliation) {
      rows.push({
        center: userInfo.secondary_affiliation,
        division: "",
        title: "",
        start: "",
        end: "",
      });
    }
    if (rows.length > 0) setResearchRows(rows);
  }, [userInfo]);

  // Add this useEffect to autofill hospitalRows with primary/secondary authorities and hospitals
  useEffect(() => {
    const rows = [];
    if (userInfo.primary_authority || userInfo.primary_hospital) {
      rows.push({
        authority: userInfo.primary_authority || "",
        hospital: userInfo.primary_hospital || "",
        role: "",
        start: "",
        end: "",
      });
    }
    if (userInfo.secondary_authority || userInfo.secondary_hospital) {
      rows.push({
        authority: userInfo.secondary_authority || "",
        hospital: userInfo.secondary_hospital || "",
        role: "",
        start: "",
        end: "",
      });
    }
    if (rows.length > 0) setHospitalRows(rows);
  }, [userInfo]);

  return (
    <div className="mx-auto p-4 xl:px-12">
      {console.log(authoritiesMap)}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xl:gap-2">
        <Section title="Institution">
          <Field
            label="Institution"
            name="institution"
            value={userInfo.institution || ""}
            onChange={handleInputChange}
            options={institutions}
          />
          <Field
            label="Campus"
            name="campus"
            value={userInfo.campus || ""}
            onChange={handleInputChange}
            options={campuses}
          />
        </Section>
        <Section title="Faculty">
          <Field
            label="Primary Faculty"
            name="primary_faculty"
            value={userInfo.primary_faculty || ""}
            onChange={handleInputChange}
            options={faculties}
          />
          <Field
            label="Secondary Faculty"
            name="secondary_faculty"
            value={userInfo.secondary_faculty || ""}
            onChange={handleInputChange}
            options={faculties}
          />
        </Section>
      </div>

      <div className="my-4 gap-y-4 flex flex-col">
        {/* Academic Units Table */}
        <Section title="Academic Unit(s)">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Academic Unit
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Academic Rank
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Appointment %
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Start Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {academicUnits.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-400 py-4">
                      No academic units added.
                    </td>
                  </tr>
                ) : (
                  academicUnits.map((unit, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        <Dropdown
                          name="unit"
                          value={unit.unit || ""}
                          onChange={handleInputChange}
                          options={departments}
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        <Dropdown name="rank" value={unit.rank || ""} onChange={handleInputChange} options={ranks} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          value={unit.percent}
                          onChange={handleInputChange}
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        <input
                          type="date"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          value={unit.startDate || ""}
                          onChange={handleInputChange}
                          placeholder="mm/dd/yy"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Departmental Information Table */}
        <Section title="Departmental Information">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2"></th>
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
                    Title (i.e. Head)
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
                {Object.entries(departmentRows).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-400 py-4">
                      No departmental information added.
                    </td>
                  </tr>
                ) : (
                  Object.entries(departmentRows).map(([unit, rows]) =>
                    rows.map((row, subIdx) => {
                      const isSub = row.isSub;
                      // Only show the + button for the last main row (not sub)
                      const isLastMain =
                        !isSub &&
                        (() => {
                          let lastMainIdx = -1;
                          rows.forEach((r, i) => {
                            if (!r.isSub) lastMainIdx = i;
                          });
                          return subIdx === lastMainIdx;
                        })();

                      return (
                        <tr key={unit + "-" + subIdx} className={isSub ? "bg-blue-50" : ""}>
                          <td className="px-2 py-2 align-middle">
                            {isLastMain && (
                              <button
                                type="button"
                                className="text-blue-500 hover:text-blue-700 text-lg"
                                title={`Add sub-entry for ${unit}`}
                                onClick={() => handleAddDepartmentSubRow(unit)}
                              >
                                +
                              </button>
                            )}
                          </td>
                          <td className={`px-4 py-2 whitespace-nowrap text-sm text-gray-700`}>
                            {isSub ? (
                              <input
                                type="text"
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-200"
                                placeholder="Enter Academic Unit"
                                defaultValue={row.academicUnit || ""}
                              />
                            ) : (
                              unit
                            )}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-200"
                              defaultValue={row.division}
                            />
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-200"
                              defaultValue={row.program}
                            />
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-200"
                              defaultValue={row.title}
                            />
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <input
                              type="date"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-200"
                              defaultValue={row.start}
                            />
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <input
                              type="date"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-200"
                              defaultValue={row.end}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )
                )}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Research Affiliation Table */}
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {researchRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 py-4">
                      No research affiliations added.
                    </td>
                  </tr>
                ) : (
                  researchRows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Dropdown
                          name={`center-${idx}`}
                          value={row.center || ""}
                          onChange={(e) => {
                            const updated = [...researchRows];
                            updated[idx].center = e.target.value;
                            setResearchRows(updated);
                          }}
                          options={affiliations}
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-200"
                          placeholder="Enter division/pillar"
                          value={row.division}
                          onChange={(e) => {
                            const updated = [...researchRows];
                            updated[idx].division = e.target.value;
                            setResearchRows(updated);
                          }}
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-200"
                          placeholder="Enter title"
                          value={row.title}
                          onChange={(e) => {
                            const updated = [...researchRows];
                            updated[idx].title = e.target.value;
                            setResearchRows(updated);
                          }}
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <input
                          type="date"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-200"
                          value={row.start}
                          onChange={(e) => {
                            const updated = [...researchRows];
                            updated[idx].start = e.target.value;
                            setResearchRows(updated);
                          }}
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <input
                          type="date"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-200"
                          value={row.end}
                          onChange={(e) => {
                            const updated = [...researchRows];
                            updated[idx].end = e.target.value;
                            setResearchRows(updated);
                          }}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="mt-2 text-right">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                onClick={handleAddResearch}
                type="button"
              >
                + Add
              </button>
            </div>
          </div>
        </Section>

        {/* Hospital Affiliation Table */}
        <Section title="Hospital Affiliation">
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {hospitalRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 py-4">
                      No hospital affiliations added.
                    </td>
                  </tr>
                ) : (
                  hospitalRows.map((row, idx) => {
                    // Get hospital options based on selected authority
                    let hospitalOptions = [];
                    if (row.authority && authoritiesMap[row.authority] && authoritiesMap[row.authority].length > 0) {
                      hospitalOptions = authoritiesMap[row.authority];
                    } else {
                      // Flatten all hospitals from all authorities if no authority selected
                      hospitalOptions = Object.values(authoritiesMap).flat();
                    }

                    return (
                      <tr key={idx}>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <Dropdown
                            name={`authority-${idx}`}
                            value={row.authority || ""}
                            onChange={(e) => {
                              const updated = [...hospitalRows];
                              updated[idx].authority = e.target.value;
                              // Optionally reset hospital if authority changes
                              updated[idx].hospital = "";
                              setHospitalRows(updated);
                            }}
                            options={authorities}
                          />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <Dropdown
                            name={`hospital-${idx}`}
                            value={row.hospital || ""}
                            onChange={(e) => {
                              const updated = [...hospitalRows];
                              updated[idx].hospital = e.target.value;
                              setHospitalRows(updated);
                            }}
                            options={hospitalOptions}
                          />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-200"
                            placeholder="Enter role"
                            value={row.role}
                            onChange={(e) => {
                              const updated = [...hospitalRows];
                              updated[idx].role = e.target.value;
                              setHospitalRows(updated);
                            }}
                          />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <input
                            type="date"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-200"
                            value={row.start}
                            onChange={(e) => {
                              const updated = [...hospitalRows];
                              updated[idx].start = e.target.value;
                              setHospitalRows(updated);
                            }}
                          />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <input
                            type="date"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-200"
                            value={row.end}
                            onChange={(e) => {
                              const updated = [...hospitalRows];
                              updated[idx].end = e.target.value;
                              setHospitalRows(updated);
                            }}
                          />
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
                onClick={handleAddHospital}
                type="button"
              >
                + Add
              </button>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default Affiliations;
