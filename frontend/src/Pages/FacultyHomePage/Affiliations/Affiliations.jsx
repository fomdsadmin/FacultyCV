import React, { useEffect, useState } from "react";
import { useApp } from "../../../Contexts/AppContext";
import { useFaculty } from "../FacultyContext";
import { getUserAffiliations, updateUserAffiliations } from "../../../graphql/graphqlHelpers.js";
import SaveButton from "../SaveButton";
import AcademicUnitSection from "./AcademicUnitSection";
import ResearchAffiliationSection from "./ResearchAffiliationSection";
import HospitalAffiliationSection from "./HospitalAffiliationSection";

// Responsive Section card
export const Section = ({ title, children }) => (
  <div className="bg-white border rounded-lg p-4 shadow-sm flex-1 ">
    <h3 className="font-semibold mb-4 text-base text-zinc-600">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
);

// Field component
export const Field = ({ label, ...props }) => (
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
export const Dropdown = ({ label, ...props }) => (
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

const Affiliations = () => {
  const { faculties, institutions, campuses } = useFaculty();
  const { userInfo } = useApp();

  // Dynamic data placeholders
  const [affiliationsData, setAffiliationsData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Initial states
  const [facultyData, setFacultyData] = useState({});
  const [institutionData, setInstitutionData] = useState({});
  const [academicUnits, setAcademicUnits] = useState([]); // Array, not object
  const [researchAffiliations, setResearchAffiliations] = useState([]);
  const [hospitalAffiliations, setHospitalAffiliations] = useState([]);

  const [departmentRows, setDepartmentRows] = useState({});
  const [researchRows, setResearchRows] = useState([]);
  const [hospitalRows, setHospitalRows] = useState([]);

  // Function to save all affiliations data
  const handleSaveAffiliations = async () => {
    setIsSaving(true);
    try {
      // Update the affiliationsData object with all current data
      const updatedAffiliationsData = {
        faculty: facultyData,
        institution: institutionData,
        academic_units: academicUnits,
        research_affiliations: researchAffiliations,
        hospital_affiliations: hospitalAffiliations,
      };

      // Update affiliationsData state
      setAffiliationsData(updatedAffiliationsData);
      console.log("Saving affiliations data:", updatedAffiliationsData);
      // Call the API to save the data
      await updateUserAffiliations(
        userInfo.user_id,
        userInfo.first_name,
        userInfo.last_name,
        JSON.stringify(updatedAffiliationsData)
      );

      // alert("Affiliations saved successfully!");
    } catch (error) {
      console.error("Error saving affiliations:", error);
      alert("Failed to save affiliations. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Fix the fetching effect to avoid infinite loops
  useEffect(() => {
    // Fetch affiliations data from the API
    const fetchAffiliations = async () => {
      try {
        const response = await getUserAffiliations(userInfo.user_id, userInfo.first_name, userInfo.last_name);
        if (response && response.length > 0 && response[0].data_details) {
          let data = response[0].data_details;
          if (typeof data === "string") {
            try {
              data = JSON.parse(data);
              if (typeof data === "string") {
                data = JSON.parse(data);
              }
            } catch (e) {
              console.error("Error parsing affiliations data:", e, data);
              data = {};
            }
          }

          setAffiliationsData(data);

          // Objects - make sure we properly initialize with data
          setFacultyData({
            primary_faculty: data.faculty?.primary_faculty || "",
            secondary_faculty: data.faculty?.secondary_faculty || "",
          });

          setInstitutionData({
            institution: data.institution?.institution || "",
            campus: data.institution?.campus || "",
          });

          // Arrays of objects
          setAcademicUnits(Array.isArray(data.academic_units) ? data.academic_units : []);
          setResearchAffiliations(Array.isArray(data.research_affiliations) ? data.research_affiliations : []);
          setHospitalAffiliations(Array.isArray(data.hospital_affiliations) ? data.hospital_affiliations : []);

          console.log(academicUnits);
        } else {
          console.log("No affiliations data found");
          // Initialize with empty defaults
          setFacultyData({});
          setInstitutionData({});
          setAcademicUnits([]);
          setResearchAffiliations([]);
          setHospitalAffiliations([]);
        }
      } catch (error) {
        console.error("Error fetching affiliations:", error);
      }
    };

    if (userInfo?.user_id) {
      fetchAffiliations();
    }
  }, [userInfo]);

  // Add handlers for institution and faculty data
  const handleInstitutionChange = (e) => {
    const { name, value } = e.target;
    setInstitutionData({
      ...institutionData,
      [name]: value,
    });
  };

  const handleFacultyChange = (e) => {
    const { name, value } = e.target;
    setFacultyData({
      ...facultyData,
      [name]: value,
    });
  };

  return (
    <div className="mx-auto p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:gap-2">
        <Section title="Institution">
          <div className="gap-x-2 gap-y-4 grid grid-cols-1 md:grid-cols-2">
            <Field
              label="Institution"
              name="institution"
              value={institutionData.institution || ""}
              onChange={handleInstitutionChange}
              options={institutions}
            />
            <Field
              label="Campus"
              name="campus"
              value={institutionData.campus || ""}
              onChange={handleInstitutionChange}
              options={campuses}
            />
          </div>
        </Section>
        <Section title="Faculty">
          <div className="gap-x-2 gap-y-4 grid grid-cols-1 md:grid-cols-2">
            <Field
              label="Primary Faculty"
              name="primary_faculty"
              value={facultyData.primary_faculty || ""}
              onChange={handleFacultyChange}
              options={faculties}
            />
            <Field
              label="Joint Faculty"
              name="secondary_faculty"
              value={facultyData.secondary_faculty || ""}
              onChange={handleFacultyChange}
              options={faculties}
            />
          </div>
        </Section>
      </div>

      <div className="my-4 gap-y-4 flex flex-col">
        {/* Academic Units Table */}
        <AcademicUnitSection
          academicUnits={academicUnits}
          setAcademicUnits={setAcademicUnits}
          setAffiliationsData={setAffiliationsData}
        />

        {/* Research Affiliation Table - Using new component */}
        <ResearchAffiliationSection
          researchAffiliations={researchAffiliations}
          setResearchAffiliations={setResearchAffiliations}
        />

        {/* Hospital Affiliation Table - Using new component */}
        <HospitalAffiliationSection
          hospitalAffiliations={hospitalAffiliations}
          setHospitalAffiliations={setHospitalAffiliations}
        />
      </div>
      {}
      <div className="flex justify-end mt-4">
        <button
          onClick={handleSaveAffiliations}
          disabled={isSaving}
          className={`btn ${
            isSaving ? "btn-disabled bg-gray-400" : "btn-success"
          } btn mt-2 text-white px-4 py-2 min-h-0 h-10`}
        >
          {isSaving ? "Saving..." : "Save Affiliations"}
        </button>
      </div>
    </div>
  );
};

export default Affiliations;
