import React, { useState } from 'react';
import '../CustomStyles/scrollbar.css';
import '../CustomStyles/modal.css';
import { addUserCVData, getUserCVData, getOrcidSections } from '../graphql/graphqlHelpers';
import { getMonthName } from '../utils/time';
import { useNavigate } from "react-router-dom"; // Add this import
import { useAuditLogger, AUDIT_ACTIONS } from "../Contexts/AuditLoggerContext";

const EmploymentModal = ({
  user,
  section,
  onClose,
  setRetrievingData,
  fetchData,
}) => {
  const navigate = useNavigate(); // Add this hook
  const [employmentData, setEmploymentData] = useState([]);
  const [fetchingData, setFetchingData] = useState(true);
  const [addingData, setAddingData] = useState(false);
  const [initialRender, setInitialRender] = useState(true);
  const [count, setCount] = useState(1);

    const { logAction } = useAuditLogger();
  

  // Function to navigate to home page
  const goToHomePage = () => {
    navigate("/home");
    onClose(); // Close the modal when navigating away
  };

  async function fetchEmploymentData() {
    setFetchingData(true);
    setInitialRender(false);

    try {
      const response = await getOrcidSections(user.orcid_id, "employment");
      if (response?.other_data) {
        const otherData =
          typeof response.other_data === "string"
            ? JSON.parse(response.other_data)
            : response.other_data;

        const employmentList = otherData?.employment_list || [];

        // Transform fields into the required escaped JSON format
        const transformedData = employmentList.map((employment) => {
          const startDateMonth =
            employment["Start Month"] && employment["Start Month"] !== "N/A"
              ? getMonthName(employment["Start Month"])
              : ""; // Set to empty string if "N/A"
          const startDateYear =
            employment["Start Year"] && employment["Start Year"] !== "N/A"
              ? employment["Start Year"]
              : ""; // Set to empty string if "N/A"
          const endDateMonth =
            employment["End Month"] === "N/A" &&
            employment["End Year"] &&
            employment["End Year"] !== "N/A"
              ? "" // If End Month is N/A but End Year exists
              : employment["End Month"] === "present"
              ? "Current"
              : employment["End Month"] !== "N/A"
              ? getMonthName(employment["End Month"])
              : ""; // Set to empty string if "N/A"
          const endDateYear =
            employment["End Year"] === "present"
              ? "Current"
              : employment["End Year"] || "";

          const dates =
            endDateMonth === "Current"
              ? `${startDateMonth}, ${startDateYear} - Current`
              : endDateMonth === "None"
              ? `${startDateMonth}, ${startDateYear}`
              : `${startDateMonth}, ${startDateYear} - ${endDateMonth}, ${endDateYear}`;

          const dataObject = {
            "university/organization": employment["Organization"] || "",
            rank_or_title: employment["Role Title"] || "",
            dates: dates,
            type:
              endDateMonth === "Current" || endDateYear === "Current"
                ? "Present"
                : "Prior",
          };

          return dataObject;
        });

        setEmploymentData(transformedData);
        // Log the retrieval action
        await logAction(AUDIT_ACTIONS.RETRIEVE_EXTERNAL_DATA, "employment");
      } else {
        console.error("No employment data found in response.");
      }
    } catch (error) {
      console.error("Error fetching employment data:", error);
    }
    setFetchingData(false);
  }

  // Function to add employment data to the database
  async function addEmploymentData() {
    setAddingData(true);

    try {
      const existingEmployment = await getUserCVData(
        user.user_id,
        section.data_section_id
      );
      const existingData = existingEmployment.map((entry) =>
        JSON.stringify(entry.data_details)
      );
      for (const employment of employmentData) {
        // Skip if the data already exists
        if (existingData.includes(employment)) {
          setCount((prevCount) => prevCount + 1);
          continue;
        }

        // Add the new data to the database
        try {
          await addUserCVData(
            user.user_id,
            section.data_section_id,
            JSON.stringify(employment),
            false
          );
          setCount((prevCount) => prevCount + 1);

          // Log the section update action
          await logAction(AUDIT_ACTIONS.UPDATE_CV_DATA);
        } catch (error) {
          console.error("Error adding employment entry:", error);
        }
      }
    } catch (error) {
      console.error("Error during addEmploymentData:", error);
    }

    setAddingData(false);
    fetchData(); // Refresh parent data
    setRetrievingData(false);
  }

  return (
    <dialog className="modal-dialog ml-4" open>
      <button
        type="button"
        className={`btn btn-sm btn-circle btn-ghost absolute right-4 top-4 ${
          fetchingData && !initialRender ? "cursor-not-allowed" : ""
        }`}
        onClick={onClose}
        disabled={fetchingData && !initialRender}
      >
        ✕
      </button>

      {initialRender ? (
        user.orcid_id ? (
          <div className="flex flex-col items-center justify-center w-full mt-5 mb-5">
            <div className="text-center">
              Employment data will be fetched from ORCID using your ORCID ID.
            </div>
            <button
              type="button"
              className="btn btn-secondary mt-4 text-white"
              onClick={() => fetchEmploymentData()}
            >
              Fetch Employment Data
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full mt-5 mb-5">
            <div className="block items-center justify-center text-center text-m mb-1 mt-6 mr-5 ml-5 text-zinc-600">
              Please enter your ORCID ID in the Profile section to fetch
              employment data.
            </div>
            <button
              type="button"
              className="btn btn-secondary mt-4 text-white"
              onClick={goToHomePage} // Use the new function here
            >
              Go to Profile Section
            </button>
          </div>
        )
      ) : fetchingData ? (
        <div className="flex items-center justify-center w-full mt-5 mb-5">
          <div className="block text-lg font-bold mb-2 mt-6 text-zinc-600">
            Fetching employment data...
          </div>
        </div>
      ) : (
            <div className="flex flex-col items-center justify-center w-full mt-5 mb-5">
          {employmentData.length > 0 ? (
            <div className="flex flex-col items-center justify-center w-full mt-5 mb-5">
              <p className="mb-4">Employment data fetched successfully.</p>
              <button
                type="button"
                className="btn btn-secondary text-white flex items-center justify-center"
                onClick={() => addEmploymentData()}
                disabled={addingData}
              >
                {addingData
                  ? `Adding ${count} of ${employmentData.length} records...`
                  : "Add Employment Data"}
              </button>
            </div>
          ) : (
            <p>No employment data found.</p>
          )}
        </div>
      )}
    </dialog>
  );
};

export default EmploymentModal;



