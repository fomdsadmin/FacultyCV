import React, { useState, useEffect } from "react";
import "../CustomStyles/scrollbar.css";
import "../CustomStyles/modal.css";
import { addUserCVData, getUserCVData, getOrcidSections } from "../graphql/graphqlHelpers";
import { getMonthName } from "../utils/time";
import { useNavigate } from "react-router-dom";
import { useAuditLogger, AUDIT_ACTIONS } from "../Contexts/AuditLoggerContext";
import EducationEntry from "./EducationEntry";

const EducationModal = ({ user, section, onClose, setRetrievingData, fetchData }) => {
  const navigate = useNavigate();
  const { logAction } = useAuditLogger();

  const [allEducationData, setAllEducationData] = useState([]);
  const [selectedEducationData, setSelectedEducationData] = useState([]);
  const [currentStep, setCurrentStep] = useState("source-selection"); // "source-selection", "fetching", "education-display", "success"
  const [addingData, setAddingData] = useState(false);
  const [dateRangeOption, setDateRangeOption] = useState("all"); // "all" or "custom"
  const [customStartYear, setCustomStartYear] = useState("");
  const [count, setCount] = useState(1);

  // Function to navigate to home page
  const goToHomePage = () => {
    navigate("/home");
    onClose();
  };

  // Function to sort education data by date (most recent first)
  const sortEducationByDate = (data) => {
    return [...data].sort((a, b) => {
      // Extract date from 'dates' field or 'end_year'
      const dateA = a.dates || a.end_year || "";
      const dateB = b.dates || b.end_year || "";

      // Handle empty dates (put them at the end)
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      // Handle "current" or "present" - should be sorted as most recent
      const lowerDateA = dateA.toString().toLowerCase();
      const lowerDateB = dateB.toString().toLowerCase();

      if (lowerDateA.includes("current") || lowerDateA.includes("present")) {
        return -1;
      }
      if (lowerDateB.includes("current") || lowerDateB.includes("present")) {
        return 1;
      }

      // For date ranges, extract the end year (graduation year)
      const extractYear = (dateStr) => {
        const yearMatch = dateStr.toString().match(/\b(19|20)\d{2}\b/g);
        return yearMatch ? parseInt(yearMatch[yearMatch.length - 1]) : 0; // Get the last year found (end year)
      };

      const yearA = extractYear(dateA);
      const yearB = extractYear(dateB);

      // Sort by year descending (most recent first)
      return yearB - yearA;
    });
  };

  // Function to filter data by date range
  const filterByDateRange = (data, dateRangeOption, customStartYear) => {
    if (dateRangeOption === "custom" && customStartYear) {
      const startYear = parseInt(customStartYear);
      return data.filter((item) => {
        const dateStr = item.dates || item.end_year || "";
        const yearMatch = dateStr.toString().match(/\b(19|20)\d{2}\b/g);
        if (yearMatch) {
          const endYear = parseInt(yearMatch[yearMatch.length - 1]); // Get graduation year
          return endYear >= startYear;
        }
        return true; // Include items without clear dates
      });
    }
    return data;
  };

  async function fetchEducationData() {
    setCurrentStep("fetching");

    try {
      const response = await getOrcidSections(user.orcid_id, "education");
      if (response?.other_data) {
        const otherData =
          typeof response.other_data === "string" ? JSON.parse(response.other_data) : response.other_data;

        const educationList = otherData?.education_list || [];
        console.log("ORCID Education Response:", educationList);

        // Transform fields into the required format
        const transformedData = educationList.map((education) => {
          const startDateMonth =
            education["start_month"] && education["start_month"] !== "N/A"
              ? getMonthName(education["start_month"])
              : "";
          const startDateYear =
            education["start_year"] && education["start_year"] !== "N/A" ? education["start_year"] : "";
          const startDate = startDateMonth && startDateYear ? `${startDateMonth} ${startDateYear}` : startDateYear ? startDateYear : startDateMonth ? startDateMonth : "";

          const endDateMonth =
            education["end_month"] === "N/A" && education["end_year"] && education["end_year"] !== "N/A"
              ? ""
              : education["end_month"] === "present"
              ? "Current"
              : education["end_month"] !== "N/A"
              ? getMonthName(education["end_month"])
              : "";
          const endDateYear = education["end_year"] === "present" ? "Current" : education["end_year"] || "";
          const endDate = endDateMonth && endDateYear ? `${endDateMonth} ${endDateYear}` : endDateYear ? endDateYear : endDateMonth ? endDateMonth : "";

          const dates = startDate && endDate ? `${startDate} - ${endDate}` : startDate ? startDate : endDate ? endDate : "";

          // const dates =
          //   endDateMonth === "Current"
          //     ? `${startDateMonth} ${startDateYear} - Current`
          //     : endDateMonth === "None"
          //     ? `${startDateMonth} ${startDateYear}`
          //     : `${startDateMonth} ${startDateYear} - ${endDateMonth} ${endDateYear}`;

          const dataObject = {
            'university/organization': education["organization_name"] || "",
            subject_area: education["role_title"] || "",
            dates: dates,
            isImported: true,
          };

          return dataObject;
        });

        // Filter by date range
        const filteredData = filterByDateRange(transformedData, dateRangeOption, customStartYear);
        setAllEducationData(filteredData);
        setSelectedEducationData(filteredData); // Select all by default
        setCurrentStep("education-display");

        // Log the retrieval action
        await logAction(AUDIT_ACTIONS.RETRIEVE_EXTERNAL_DATA, "education");
      } else {
        console.error("No education data found in response.");
        setAllEducationData([]);
        setCurrentStep("education-display");
      }
    } catch (error) {
      console.error("Error fetching education data:", error);
      setAllEducationData([]);
      setCurrentStep("education-display");
    }
  }

  const handleSelect = (educationData, isSelected) => {
    setSelectedEducationData((prevState) => {
      if (isSelected) {
        return [...prevState, educationData];
      } else {
        return prevState.filter((item) => item !== educationData);
      }
    });
  };

  const handleFetchEducationData = () => {
    fetchEducationData();
  };

  const handleCancelImport = () => {
    setCurrentStep("source-selection");
    setDateRangeOption("all");
    setCustomStartYear("");
    setAllEducationData([]);
    setSelectedEducationData([]);
  };

  const handleToggleSelectAll = () => {
    if (selectedEducationData.length === allEducationData.length) {
      setSelectedEducationData([]);
    } else {
      setSelectedEducationData([...allEducationData]);
    }
  };

  // Function to add education data to the database
  async function addEducationData() {
    setAddingData(true);
    setCount(1);

    try {
      const existingEducation = await getUserCVData(user.user_id, section.data_section_id);
      const existingData = existingEducation.map((entry) => JSON.stringify(entry.data_details));

      for (const education of selectedEducationData) {
        // Skip if the data already exists
        if (existingData.includes(JSON.stringify(education))) {
          setCount((prevCount) => prevCount + 1);
          continue;
        }

        // Add the new data to the database
        try {
          await addUserCVData(user.user_id, section.data_section_id, JSON.stringify(education), false);
          setCount((prevCount) => prevCount + 1);

          // Log the section update action
          await logAction(AUDIT_ACTIONS.UPDATE_CV_DATA);
        } catch (error) {
          console.error("Error adding education entry:", error);
        }
      }
    } catch (error) {
      console.error("Error during addEducationData:", error);
    }

    setAddingData(false);
    setCurrentStep("success");

    // Don't immediately close - allow the success message to display
    setTimeout(() => {
      fetchData(); // Refresh parent data
      setRetrievingData(false);
      onClose();
    }, 1000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <dialog
        className="modal h-full max-h-[80vh] relative bg-white rounded-xl shadow-xl max-w-4xl mx-4 w-full p-0 overflow-y-auto"
        open
        style={{ margin: 0, padding: 0 }}
      >
        {/* X close button at the top right */}
        <button
          type="button"
          className="btn btn-sm btn-circle btn-ghost absolute top-4 right-4 z-20 hover:bg-red-500 hover:text-white transition"
          onClick={onClose}
          aria-label="Close"
          disabled={currentStep === "fetching"}
        >
          <span className="text-lg leading-none">✕</span>
        </button>

        {/* Step 1: Source Selection with Date Range */}
        {currentStep === "source-selection" && (
          <div className="w-full h-full p-6 overflow-y-auto">
            {/* Date Range Selection */}
            <div className="mb-2">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-blue-500">📅</span>
                Select Import Date Range
              </h4>

              {/* Date Range Options */}
              <div className="space-y-3 mb-3">
                {/* All Years Option */}
                <div className="flex items-center gap-3 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    id="all-years"
                    name="dateRange"
                    value="all"
                    checked={dateRangeOption === "all"}
                    onChange={(e) => setDateRangeOption(e.target.value)}
                    className="radio radio-primary"
                  />
                  <label htmlFor="all-years" className="flex-1 cursor-pointer">
                    <div className="text-sm text-gray-900">All available years (Default)</div>
                    <div className="text-xs text-gray-600">Import all education data</div>
                  </label>
                </div>

                {/* Custom Range Option */}
                <div className="flex items-center gap-3 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    id="custom-range"
                    name="dateRange"
                    value="custom"
                    checked={dateRangeOption === "custom"}
                    onChange={(e) => setDateRangeOption(e.target.value)}
                    className="radio radio-primary"
                  />
                  <label htmlFor="custom-range" className="flex-1 cursor-pointer">
                    <div className="text-sm text-gray-900">Custom date range</div>
                    <div className="text-xs text-gray-600">Import education starting from a specific year onwards</div>
                  </label>
                </div>

                {/* Custom Year Input */}
                {dateRangeOption === "custom" && (
                  <div className="flex items-center gap-x-2">
                    <label htmlFor="start-year" className="text-sm font-medium text-gray-700">
                      Start from year:
                    </label>
                    <select
                      id="start-year"
                      value={customStartYear}
                      onChange={(e) => setCustomStartYear(e.target.value)}
                      className="select select-bordered select-sm w-30 text-center"
                    >
                      <option value="">Start year</option>
                      {Array.from({ length: new Date().getFullYear() - 1950 + 1 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                    <span className="text-sm text-gray-500">onwards</span>
                  </div>
                )}
              </div>
            </div>

            {/* ORCID Section */}
            <div className="border-t border-gray-200 pt-2">
              {user.orcid_id ? (
                <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex-grow mb-4">
                    <h5 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      ORCID Education Data
                    </h5>
                    <div className="text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">Connected ORCID ID:</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">{user.orcid_id}</code>
                      </div>
                      <div>Education data will be fetched from your ORCID profile</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary w-full"
                    onClick={handleFetchEducationData}
                    disabled={dateRangeOption === "custom" && !customStartYear}
                  >
                    Import ORCID Education Data
                  </button>
                </div>
              ) : (
                <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                  <div className="flex-grow mb-4">
                    <h5 className="font-semibold text-yellow-700 mb-2 flex items-center gap-2">
                      <span className="text-yellow-600">⚠️</span>
                      ORCID ID Required
                    </h5>
                    <div className="text-sm text-yellow-700 mb-3">
                      Please enter your ORCID ID in the Profile section to fetch education data.
                    </div>
                  </div>
                  <button type="button" className="btn btn-warning w-full" onClick={goToHomePage}>
                    Go to Profile Section
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Processing Education Data */}
        {currentStep === "fetching" && (
          <div className="flex items-center justify-center w-full h-full">
            <div className="text-center">
              <div className="loading loading-spinner loading-lg text-blue-600 mb-4"></div>
              <div className="text-lg text-gray-600">Processing ORCID education data...</div>
            </div>
          </div>
        )}

        {/* Step 3: Education Display */}
        {currentStep === "education-display" && (
          <div className="w-full h-full p-6 overflow-y-auto">
            {/* Header */}
            <div className="mb-2">
              <button type="button" className="btn btn-outline btn-sm mb-2" onClick={handleCancelImport}>
                ← Back
              </button>

              {/* Date Range Display */}
              <div className="text-left flex justify-between items-center gap-2">
                <span className="text-lg text-zinc-800 font-semibold">
                  {dateRangeOption === "all"
                    ? `IMPORTED DATA FOR [All available years]`
                    : customStartYear
                    ? `IMPORTED DATA FOR [${customStartYear} onwards]`
                    : "[All available years]"}
                </span>
                <div className="">
                  <button
                    className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition"
                    onClick={handleToggleSelectAll}
                  >
                    {selectedEducationData.length === allEducationData.length ? "Deselect All" : "Select All"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-success px-6 py-2 ml-2 text-white rounded-lg shadow hover:shadow-md transition"
                    onClick={addEducationData}
                    disabled={addingData || selectedEducationData.length === 0}
                  >
                    {addingData
                      ? "Adding education data..."
                      : `Add ${selectedEducationData.length} Education Record${
                          selectedEducationData.length !== 1 ? "s" : ""
                        }`}
                  </button>
                </div>
              </div>
            </div>

            {/* Helper Information Section */}
            <div className="mb-2 space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 text-lg">ℹ️</span>
                  <div className="text-sm text-green-800 leading-relaxed">
                    <div className="font-medium mb-1">What happens when you import:</div>
                    <ul className="space-y-1 text-xs">
                      <li>• These education records were imported from your ORCID profile</li>
                      <li>
                        • Selected entries will be <strong>added</strong> to your CV's Education section
                      </li>
                      <li>
                        • Your original CV data for this section will <strong>remain intact</strong> - nothing will be
                        overwritten
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
                <div className="flex items-start gap-2">
                  <span className="text-orange-600 text-lg">💡</span>
                  <div className="text-sm text-orange-800 leading-relaxed">
                    <div className="font-medium mb-1">Important things to know:</div>
                    <ul className="space-y-1 text-xs">
                      <li>
                        • Once imported, these entries will have an <b>Automatic From ORCID</b> label and cannot be edited directly
                      </li>
                      <li>
                        • Since you may have manually added some education records before, please check for any
                        duplicates after importing
                      </li>
                      <li>• If you find duplicates, you can archive the ones you don't want and can review them later in the <b>Archive</b> section</li>
                      <li>• This helps ensure your education history stays accurate and up-to-date</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {allEducationData.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500 text-lg">No education data found for selected criteria</div>
              </div>
            ) : (
              <>
                {/* Education list */}
                <div className="space-y-2">
                  {sortEducationByDate(allEducationData).map((educationData, index) => (
                    <EducationEntry
                      key={index}
                      educationData={educationData}
                      onSelect={handleSelect}
                      selected={selectedEducationData.includes(educationData)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 4: Success */}
        {currentStep === "success" && (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <div className="text-center">
              <div className="text-green-500 text-6xl mb-4">✓</div>
              <div className="text-2xl font-bold mb-2 text-green-600">Education Records Added Successfully!</div>
              <div className="text-gray-600">
                {selectedEducationData.length} education records have been added to your profile
              </div>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
};

export default EducationModal;
