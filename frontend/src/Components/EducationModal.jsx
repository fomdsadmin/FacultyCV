import React, { useState } from 'react';
import '../CustomStyles/scrollbar.css';
import '../CustomStyles/modal.css';
import { addUserCVData, getUserCVData, getOrcidSections } from '../graphql/graphqlHelpers';
import { getMonthName } from '../utils/time';


const EducationModal = ({ user, section, onClose, setRetrievingData, fetchData }) => {
    const [educationData, setEducationData] = useState([]);
    const [fetchingData, setFetchingData] = useState(true);
    const [addingData, setAddingData] = useState(false);
    const [initialRender, setInitialRender] = useState(true);
    const [count, setCount] = useState(1);
    
      async function fetchEducationData() {
      setFetchingData(true);
      setInitialRender(false);
  
      try {
          const response = await getOrcidSections(user.orcid_id, 'education');
  
          if (response?.other_data) {
              const otherData = typeof response.other_data === 'string'
                  ? JSON.parse(response.other_data)
                  : response.other_data;
  
              const educationList = otherData?.education_list || [];
  
              // Transform fields into the required escaped JSON format
              const transformedData = educationList.map((education) => {
                const startDateMonth =
                 education["start_month"] && education["start_month"] !== "N/A"
                  ? getMonthName(education["start_month"])
                  : ""; // Set to empty string if "N/A"
                const startDateYear =
                  education["start_year"] && education["start_year"] !== "N/A"
                  ? education["start_year"]
                  : ""; // Set to empty string if "N/A"
                const endDateMonth = education["end_month"] === "N/A" && education["end_year"] && education["end_year"] !== "N/A"
                    ? "" // If End Month is N/A but End Year exists
                    : education["end_month"] === "present"
                    ? "Current"
                    : education["end_month"] !== "N/A"
                    ? getMonthName(education["end_month"])
                    : ""; // Set to empty string if "N/A"
                  const endDateYear =  education["end_year"] === "present" ? "Current" : education["end_year"] || "";
  
                  const dates =
                      endDateMonth === "Current"
                          ? `${startDateMonth}, ${startDateYear} - Current`
                          : endDateMonth === "None"
                          ? `${startDateMonth}, ${startDateYear}`
                          : `${startDateMonth}, ${startDateYear} - ${endDateMonth}, ${endDateYear}`;
          
                  const dataObject = {
                    "university/organization": education["organization_name"] || "",
                    "degree": education["role_title"] || "",
                    "subject_area": "" ,
                    "dates": dates,
                  };
  
                  // Create escaped JSON string
                  return dataObject;
              });
  
              setEducationData(transformedData);
          } else {
              console.error('No education data found in response.');
          }
      } catch (error) {
          console.error('Error fetching education data:', error);
      }
      setFetchingData(false);
  }

  async function addEducationData() {
    setAddingData(true);
    try {
      const existingEducation = await getUserCVData(user.user_id, section.data_section_id);
      const existingData = existingEducation.map((entry) => entry.data_details);
      for (const education of educationData) {
        if (existingData.includes(education)) {
          setCount((prevCount) => prevCount + 1);
          continue;
        }

        try {
          await addUserCVData(user.user_id, section.data_section_id, JSON.stringify(education), false);
          setCount((prevCount) => prevCount + 1);
        } catch (error) {
          console.error('Error adding education entry:', error);
        }
      }
    } catch (error) {
      console.error('Error during addEducationData:', error);
    }

    setAddingData(false);
    fetchData(); // Refresh parent data
    setRetrievingData(false);
  }

return  (
    <dialog className="modal-dialog" open>
      <button
        type="button"
        className={`btn btn-sm btn-circle btn-ghost absolute right-4 top-4 ${fetchingData && !initialRender ? 'cursor-not-allowed' : ''}`}
        onClick={onClose}
        disabled={fetchingData && !initialRender}
      >
        ✕
      </button>
  
      {initialRender ? (
        user.orcid_id ? (
          <div className="flex flex-col items-center justify-center w-full mt-5 mb-5">
            <div className="text-center">
              Education data will be fetched from ORCID using your ORCID ID.
            </div>
            <button
              type="button"
              className="btn btn-secondary mt-4 text-white"
              onClick={() => fetchEducationData()}
            >
              Fetch Education Data
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full mt-5 mb-5">
            <div className="block text-m mb-1 mt-6 mr-5 ml-5 text-zinc-600">
              Please enter your ORCID ID in the Profile section to fetch education data.
            </div>
          </div>
        )
      ) : fetchingData ? (
        <div className="flex items-center justify-center w-full mt-5 mb-5">
          <div className="block text-lg font-bold mb-2 mt-6 text-zinc-600">
            Fetching education data...
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full mt-5 mb-5">
          {educationData.length > 0 ? (
            <div>
              <p className="mb-4">Education data fetched successfully.</p>
              <p className = "mb-3"style={{ color: 'red' }}> It is advised that you add the start and end dates to your education records.</p>
              <button
                type="button"
                className="btn btn-secondary text-white flex items-center justify-center"
                onClick={() => addEducationData()}
                disabled={addingData}
              >
                {addingData ? `Adding ${count} of ${educationData.length} records...` : 'Add Education Data'}
              </button>
            </div>
          ) : (
            <p>No education data found.</p>
          )}
        </div>
      )}
  
    </dialog>
  );
  
};

export default EducationModal;




