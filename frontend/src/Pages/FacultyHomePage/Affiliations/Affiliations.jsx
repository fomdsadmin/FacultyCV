import React, { useEffect, useState } from "react";
import { useApp } from "../../../Contexts/AppContext";
import { useFaculty } from "../FacultyContext";
import { getUserAffiliations, updateUserAffiliations, updateUser, getUser } from "../../../graphql/graphqlHelpers.js";
import SaveButton from "../SaveButton";
import AcademicUnitSection from "./AcademicUnitSection";
import ResearchAffiliationSection from "./ResearchAffiliationSection";
import HospitalAffiliationSection from "./HospitalAffiliationSection";
import { useAuditLogger, AUDIT_ACTIONS } from "../../../Contexts/AuditLoggerContext";

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
  const { userInfo, setUserInfo } = useApp();

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

  const { logAction } = useAuditLogger();

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

      // update userInfo for primary faculty, primary Department, institution, and campus
      // Determine primary department: either from userInfo or from academic unit with 100% appointment
      let primaryDepartment = userInfo.primary_department;
      let primaryUnit = "";
      let fullTimeUnit = false;
      if (
        !primaryDepartment ||
        primaryDepartment === "" ||
        primaryDepartment == null ||
        primaryDepartment.includes("null")
      ) {
        fullTimeUnit = academicUnits[0];
        if (fullTimeUnit) {
          primaryUnit = fullTimeUnit.unit;
        }
      }

      // Determine institution: either from institutionData or userInfo
      let institution = institutionData.institution || userInfo.institution || "";
      
      // Determine campus: either from institutionData or userInfo
      let campus = institutionData.campus || userInfo.campus || "";

      await updateUser(
        userInfo.user_id,
        userInfo.first_name,
        userInfo.last_name,
        userInfo.preferred_name,
        userInfo.email,
        userInfo.role,
        userInfo.bio,
        userInfo.rank,
        institution,
        fullTimeUnit ? primaryUnit : primaryDepartment,
        "",
        facultyData.primary_faculty,
        "",
        "",
        "",
        campus,
        "",
        "",
        userInfo.scopus_id,
        userInfo.orcid_id,
        userInfo.cwl,
        userInfo.vpp
      );

      const res = await getUser(userInfo.email); // Refresh user info after update
      console.log("Updated user info:", res);
      console.log("Current facultyData before update:", facultyData);
      console.log("Current institutionData before update:", institutionData);
      
      // Update the context with the new user info to prevent form reset
      if (res) {
        setUserInfo(res);
        
        // Also update local form state to ensure immediate UI consistency
        const newFacultyData = {
          primary_faculty: res.primary_faculty || facultyData.primary_faculty || "",
          secondary_faculty: res.secondary_faculty || facultyData.secondary_faculty || "",
        };
        
        const newInstitutionData = {
          institution: res.institution || institutionData.institution || "",
          campus: res.campus || institutionData.campus || "",
        };

        console.log("Setting new facultyData:", newFacultyData);
        console.log("Setting new institutionData:", newInstitutionData);

        setFacultyData(newFacultyData);
        setInstitutionData(newInstitutionData);
      }

      // Log the save action
      await logAction(AUDIT_ACTIONS.UPDATE_AFFILIATIONS);

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
            primary_faculty: data.faculty?.primary_faculty || userInfo.primary_faculty || "",
            secondary_faculty: data.faculty?.secondary_faculty || userInfo.secondary_faculty || "",
          });

          setInstitutionData({
            institution: data.institution?.institution || userInfo.institution || "",
            campus: data.institution?.campus || userInfo.campus || "",
          });

          // Arrays of objects
          const academicUnitsData = Array.isArray(data.academic_units) ? data.academic_units : [];

          // If no academic units exist, autofill with primary department
          if (academicUnitsData.length === 0 && userInfo.primary_department) {
            academicUnitsData.push({
              unit: userInfo.primary_department,
              rank: "",
              title: "",
              percent: "100",
              additional_info: {
                division: "",
                program: "",
                start: "",
                end: "",
              },
            });
          }

          setAcademicUnits(academicUnitsData);
          setResearchAffiliations(Array.isArray(data.research_affiliations) ? data.research_affiliations : []);
          setHospitalAffiliations(Array.isArray(data.hospital_affiliations) ? data.hospital_affiliations : []);

          // Check and update user info for any null/empty values even when existing data exists
          const currentFacultyData = {
            primary_faculty: data.faculty?.primary_faculty || userInfo.primary_faculty || "",
            secondary_faculty: data.faculty?.secondary_faculty || userInfo.secondary_faculty || "",
          };
          
          const currentInstitutionData = {
            institution: data.institution?.institution || userInfo.institution || "",
            campus: data.institution?.campus || userInfo.campus || "",
          };

          let needsUpdate = false;
          let updateData = {
            institution: userInfo.institution,
            campus: userInfo.campus,
            primary_faculty: userInfo.primary_faculty,
          };

          // Check primary faculty
          if (!userInfo.primary_faculty || userInfo.primary_faculty === "" || userInfo.primary_faculty == null || userInfo.primary_faculty.includes("null")) {
            if (currentFacultyData.primary_faculty && currentFacultyData.primary_faculty !== "") {
              updateData.primary_faculty = currentFacultyData.primary_faculty;
              needsUpdate = true;
            }
          }

          // Check institution
          if (!userInfo.institution || userInfo.institution === "" || userInfo.institution == null || userInfo.institution.includes("null")) {
            if (currentInstitutionData.institution && currentInstitutionData.institution !== "") {
              updateData.institution = currentInstitutionData.institution;
              needsUpdate = true;
            }
          }

          // Check campus
          if (!userInfo.campus || userInfo.campus === "" || userInfo.campus == null || userInfo.campus.includes("null")) {
            if (currentInstitutionData.campus && currentInstitutionData.campus !== "") {
              updateData.campus = currentInstitutionData.campus;
              needsUpdate = true;
            }
          }

          if (needsUpdate) {
            await updateUser(
              userInfo.user_id,
              userInfo.first_name,
              userInfo.last_name,
              userInfo.preferred_name,
              userInfo.email,
              userInfo.role,
              userInfo.bio,
              userInfo.rank,
              updateData.institution,
              userInfo.primary_department,
              "",
              updateData.primary_faculty,
              "",
              "",
              "",
              updateData.campus,
              "",
              "",
              userInfo.scopus_id,
              userInfo.orcid_id,
              userInfo.cwl,
              userInfo.vpp
            );
            
            // Update the context with the new user info
            const refreshedUser = await getUser(userInfo.email);
            if (refreshedUser) {
              setUserInfo(refreshedUser);
            }
          }
        } else {
          console.log("No affiliations data found");
          // Initialize with defaults - autofill academic units with primary department
          
          const defaultAcademicUnits = [];
          if (userInfo.primary_department) {
            defaultAcademicUnits.push({
              unit: userInfo.primary_department,
              rank: "",
              title: "",
              percent: "100",
              additional_info: {
                division: "",
                program: "",
                start: "",
                end: "",
              },
            });
          }

          setAcademicUnits(defaultAcademicUnits);
          setResearchAffiliations([]);
          setHospitalAffiliations([]);

          let primaryFaculty = userInfo.primary_faculty;
          let existingPrimaryFaculty = "";
          let isNull = false;
          if (!primaryFaculty || primaryFaculty === "" || primaryFaculty == null || primaryFaculty.includes("null")) {
            // Look for existing faculty data if available
            existingPrimaryFaculty = "";
            isNull = true;
          }

          // Handle institution and campus autofill
          let institution = userInfo.institution;
          let existingInstitution = "";
          let institutionIsNull = false;
          if (!institution || institution === "" || institution == null || institution.includes("null")) {
            existingInstitution = "";
            institutionIsNull = true;
          }

          let campus = userInfo.campus;
          let existingCampus = "";
          let campusIsNull = false;
          if (!campus || campus === "" || campus == null || campus.includes("null")) {
            existingCampus = "";
            campusIsNull = true;
          }

          // Only update user if there are null values to fix
          if (isNull || institutionIsNull || campusIsNull) {
            await updateUser(
              userInfo.user_id,
              userInfo.first_name,
              userInfo.last_name,
              userInfo.preferred_name,
              userInfo.email,
              userInfo.role,
              userInfo.bio,
              userInfo.rank,
              institutionIsNull ? existingInstitution : userInfo.institution,
              userInfo.primary_department,
              "",
              isNull ? existingPrimaryFaculty : userInfo.primary_faculty,
              "",
              "",
              "",
              campusIsNull ? existingCampus : userInfo.campus,
              "",
              "",
              userInfo.scopus_id,
              userInfo.orcid_id,
              userInfo.cwl,
              userInfo.vpp
            );
            
            // Update the context with the new user info
            const refreshedUser = await getUser(userInfo.email);
            if (refreshedUser) {
              setUserInfo(refreshedUser);
            }
          }

          setFacultyData({
            primary_faculty: existingPrimaryFaculty || primaryFaculty || "",
            secondary_faculty: userInfo.secondary_faculty || "",
          });

          setInstitutionData({
            institution: existingInstitution || institution || "",
            campus: existingCampus || campus || "",
          });
        }
      } catch (error) {
        console.error("Error fetching affiliations:", error);
      }
    };

    if (userInfo?.user_id) {
      fetchAffiliations();
    }
  }, [userInfo]);

  // Effect to update local form state when userInfo changes (e.g., after save)
  useEffect(() => {
    if (userInfo) {
      setFacultyData((prev) => ({
        ...prev,
        primary_faculty: userInfo.primary_faculty || prev.primary_faculty || "",
        secondary_faculty: userInfo.secondary_faculty || prev.secondary_faculty || "",
      }));

      setInstitutionData((prev) => ({
        ...prev,
        institution: userInfo.institution || prev.institution || "",
        campus: userInfo.campus || prev.campus || "",
      }));
    }
  }, [userInfo.primary_faculty, userInfo.secondary_faculty, userInfo.institution, userInfo.campus]);

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
