import React, { useEffect, useState } from "react";
import { useApp } from "../../../Contexts/AppContext";
import { useFaculty } from "../FacultyContext";
import { getUserAffiliations, updateUserAffiliations, updateUser, getUser } from "../../../graphql/graphqlHelpers.js";
import AcademicUnitSection from "./AcademicUnitSection";
import ResearchAffiliationSection from "./ResearchAffiliationSection";
import HospitalAffiliationSection from "./HospitalAffiliationSection";
import { useAuditLogger, AUDIT_ACTIONS } from "../../../Contexts/AuditLoggerContext";

// useEffect(() => {
//   getUserInfo(userInfo.username);
// }, [userInfo]);

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
  const { faculties, institutions, campuses, departments } = useFaculty();
  const { userInfo, setUserInfo } = useApp();

  // Dynamic data placeholders
  const [isSaving, setIsSaving] = useState(false);

  // Initial states
  const [facultyData, setFacultyData] = useState({});
  const [departmentData, setDepartmentData] = useState({});
  const [institutionData, setInstitutionData] = useState({});
  const [primaryUnit, setPrimaryUnit] = useState([]); // Changed to array
  const [jointUnits, setJointUnits] = useState([]); // Array, not object
  const [researchAffiliations, setResearchAffiliations] = useState([]);
  const [hospitalAffiliations, setHospitalAffiliations] = useState([]);

  const { logAction } = useAuditLogger();
  function sanitizeInput(input) {
    if (!input) return "";
    return input
      .replace(/\\/g, "\\\\") // escape backslashes
      .replace(/"/g, '\\"') // escape double quotes
      .replace(/\n/g, "\\n"); // escape newlines
  }
  // Function to save all affiliations data
  const handleSaveAffiliations = async () => {
    setIsSaving(true);
    try {
      // Update the affiliationsData object with all current data
      const updatedAffiliationsData = {
        primary_unit: primaryUnit,
        joint_units: jointUnits,
        research_affiliations: researchAffiliations,
        hospital_affiliations: hospitalAffiliations,
      };

      // Call the API to save the data
      await updateUserAffiliations(
        userInfo.user_id,
        userInfo.first_name,
        userInfo.last_name,
        JSON.stringify(updatedAffiliationsData)
      );

      await updateUser(
        userInfo.user_id,
        userInfo.first_name,
        userInfo.last_name,
        userInfo.preferred_name || "",
        userInfo.email || "",
        userInfo.role,
        sanitizeInput(userInfo.bio) || "",
        institutionData.institution || "",
        departmentData.primary_department || "",
        facultyData.primary_faculty || "",
        institutionData.campus || "",
        userInfo.keywords || "",
        userInfo.institution_id || "",
        userInfo.scopus_id || "",
        userInfo.orcid_id || ""
      );

      console.log("Affiliations updated successfully!");
      // Get updated user info and update context
      const updatedUser = await getUser(userInfo.cwl_username);
      if (updatedUser) {
        setUserInfo(updatedUser);
      }

      // Log the save action
      await logAction(AUDIT_ACTIONS.UPDATE_AFFILIATIONS);
    } catch (error) {
      console.error("Error saving affiliations:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Fix the fetching effect to avoid infinite loops
  useEffect(() => {
    // Fetch affiliations data from the API
    const fetchAffiliations = async () => {
      try {
        // initialize with data
        setFacultyData({
          primary_faculty: userInfo.primary_faculty || "",
        });
        setDepartmentData({
          primary_department: userInfo.primary_department || "",
        });
        setInstitutionData({
          institution: userInfo.institution || "",
          campus: userInfo.campus || "",
        });

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

          // Handle the new structure with primary_unit (array) and joint_units (array)
          setPrimaryUnit(Array.isArray(data.primary_unit) ? data.primary_unit : []);
          setJointUnits(Array.isArray(data.joint_units) ? data.joint_units : []);
          setResearchAffiliations(Array.isArray(data.research_affiliations) ? data.research_affiliations : []);
          setHospitalAffiliations(Array.isArray(data.hospital_affiliations) ? data.hospital_affiliations : []);
        } else {
          console.log("No affiliations data found");
          setPrimaryUnit([]);
          setJointUnits([]);
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
  }, []);

  // Effect to update local form state when userInfo changes (e.g., after save)
  useEffect(() => {
    if (userInfo) {
      setFacultyData((prev) => ({
        ...prev,
        primary_faculty: userInfo.primary_faculty || prev.primary_faculty || "",
      }));

      setDepartmentData((prev) => ({
        ...prev,
        primary_department: userInfo.primary_department || prev.primary_department || "",
      }));

      setInstitutionData((prev) => ({
        ...prev,
        institution: userInfo.institution || prev.institution || "",
        campus: userInfo.campus || prev.campus || "",
      }));
    }
  }, [userInfo.primary_faculty, userInfo.primary_department, userInfo.institution, userInfo.campus]);

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

  const handleDepartmentChange = (e) => {
    const { name, value } = e.target;
    setDepartmentData({
      ...departmentData,
      [name]: value,
    });
  };

  return (
    <div className="mx-auto p-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 xl:gap-2">
        <Section title="Institution">
          <div className="gap-x-2 gap-y-4 grid grid-cols-1">
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
          <div className="gap-x-2 gap-y-4 grid grid-cols-1 ">
            <Field
              label="Primary Faculty"
              name="primary_faculty"
              value={facultyData.primary_faculty || ""}
              onChange={handleFacultyChange}
              options={faculties}
            />
            {/* <Field
              label="Joint Faculty"
              name="secondary_faculty"
              value={facultyData.secondary_faculty || ""}
              onChange={handleFacultyChange}
              options={faculties}
            /> */}
          </div>
        </Section>
        <Section title="Department">
          <div className="gap-x-2 gap-y-4 grid grid-cols-1 ">
            <Field
              label="Primary Department"
              name="primary_department"
              value={departmentData.primary_department || ""}
              onChange={handleDepartmentChange}
              options={departments}
            />
            {/* <Field
              label="Secondary Department"
              name="secondary_department"
              value={departmentData.secondary_department || ""}
              onChange={handleDepartmentChange}
              options={departments}
            /> */}
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-1 gap-4 xl:gap-2 mt-4"></div>

      <div className="my-4 gap-y-4 flex flex-col">
        {/* Academic Units Table */}
        <AcademicUnitSection
          primaryUnit={primaryUnit}
          setPrimaryUnit={setPrimaryUnit}
          jointUnits={jointUnits}
          setJointUnits={setJointUnits}
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
