import React, { useState, useEffect } from "react";
import "../CustomStyles/scrollbar.css";
import "../CustomStyles/modal.css";
import SecureFundingEntry from "./SecureFundingEntry";
import { fetchAuthSession } from "aws-amplify/auth";
import { getSecureFundingMatches, getRiseDataMatches, addUserCVData, getAllSections } from "../graphql/graphqlHelpers";

const SecureFundingModal = ({ user, section, onClose, setRetrievingData, fetchData }) => {
  const [allSecureFundingData, setAllSecureFundingData] = useState([]);
  const [selectedSecureFundingData, setSelectedSecureFundingData] = useState([]);
  const [currentStep, setCurrentStep] = useState("source-selection"); // "source-selection", "override-warning", "fetching", "matched-grants", "success"
  const [selectedSource, setSelectedSource] = useState(""); // "rise" or "external"
  const [addingData, setAddingData] = useState(false);
  const [dateRangeOption, setDateRangeOption] = useState("all"); // "all" or "custom"
  const [customStartYear, setCustomStartYear] = useState("");

  async function fetchSecureFundingData() {
    setCurrentStep("fetching");
    try {
      const retrievedData = await getSecureFundingMatches(user.first_name, user.last_name);
      console.log("Retrieved secure funding data, Total: ", retrievedData.length);
      const allDataDetails = [];
      const uniqueDataDetails = new Set();

      for (const dataObject of retrievedData) {
        const { data_details } = dataObject;
        const data_details_json = JSON.parse(data_details);
        const uniqueKey = `${data_details_json.first_name}-${data_details_json.last_name}-${data_details_json.title}-${data_details_json.amount}`;
        if (!uniqueDataDetails.has(uniqueKey)) {
          uniqueDataDetails.add(uniqueKey);
          allDataDetails.push(data_details_json);
        }
      }

      // Filter out '-' from data_details.dates if date is like '2015-'
      allDataDetails.forEach((data) => {
        if (data.dates && data.dates.trim().endsWith("-")) {
          data.dates = data.dates.replace(/-/g, "");
        }

        if (data.dates && data.dates.trim().startsWith("-")) {
          data.dates = data.dates.replace(/-/g, "");
        }

        if (data.dates && data.dates.trim().split("-").length === 2) {
          data.dates_0 = data.dates.trim().split("-")[0];
          data.dates_1 = data.dates.trim().split("-")[1];
          data.dates = `${data.dates_0} - ${data.dates_1}`;
        }
      });

      // Filter by date range if custom range is selected
      let filteredData = allDataDetails;
      if (dateRangeOption === "custom" && customStartYear) {
        const startYear = parseInt(customStartYear);
        filteredData = allDataDetails.filter((data) => {
          if (data.dates) {
            // Extract the start year from dates (could be "2015" or "2015 - 2018")
            const yearMatch = data.dates.match(/^\d{4}/);
            if (yearMatch) {
              const dataYear = parseInt(yearMatch[0]);
              return dataYear >= startYear;
            }
          }
          return true; // Include data without valid dates
        });
      }

      setAllSecureFundingData(filteredData);
      setSelectedSecureFundingData(filteredData);
      setCurrentStep("matched-grants");
    } catch (error) {
      console.error("Error fetching secure funding data:", error);
      setCurrentStep("source-selection");
    }
  }

  async function fetchRiseData() {
    setCurrentStep("fetching");
    try {
      const retrievedData = await getRiseDataMatches(user.first_name, user.last_name);
      const allDataDetails = [];
      const uniqueDataDetails = new Set();

      for (const dataObject of retrievedData) {
        const { data_details } = dataObject;
        const data_details_json = JSON.parse(data_details);
        const uniqueKey = `${data_details_json.first_name}-${data_details_json.last_name}-${data_details_json.title}-${data_details_json.amount}-${data_details_json.sponsor}`;
        if (!uniqueDataDetails.has(uniqueKey)) {
          uniqueDataDetails.add(uniqueKey);
          allDataDetails.push(data_details_json);
        }
      }

      // Filter out '-' from data_details.dates if date is like '2015-'
      allDataDetails.forEach((data) => {
        if (data.dates && data.dates.trim().endsWith("-")) {
          data.dates = data.dates.replace(/-/g, "");
        }

        if (data.dates && data.dates.trim().split("-").length === 2) {
          data.dates_0 = data.dates.trim().split("-")[0];
          data.dates_1 = data.dates.trim().split("-")[1];
          data.dates = `${data.dates_0} - ${data.dates_1}`;
        }
      });

      // Filter by date range if custom range is selected
      let filteredData = allDataDetails;
      if (dateRangeOption === "custom" && customStartYear) {
        const startYear = parseInt(customStartYear);
        filteredData = allDataDetails.filter((data) => {
          if (data.dates) {
            // Extract the start year from dates (could be "2015" or "2015 - 2018")
            const yearMatch = data.dates.match(/^\d{4}/);
            if (yearMatch) {
              const dataYear = parseInt(yearMatch[0]);
              return dataYear >= startYear;
            }
          }
          return true; // Include data without valid dates
        });
      }

      console.log("Retrieved RISE data, Total: ", allDataDetails.length);
      console.log("Filtered RISE data: ", filteredData.length);
      setAllSecureFundingData(filteredData);
      setSelectedSecureFundingData(filteredData);
      setCurrentStep("matched-grants");
    } catch (error) {
      console.error("Error fetching RISE data:", error);
      setCurrentStep("source-selection");
    }
  }

  const handleSelect = (secureFundingData, isAdded) => {
    setSelectedSecureFundingData((prevState) => {
      if (isAdded) {
        return [...prevState, secureFundingData];
      } else {
        return prevState.filter((data) => data !== secureFundingData);
      }
    });
  };

  const handleFetchRiseData = () => {
    setSelectedSource("rise");
    setCurrentStep("override-warning");
  };

  const handleFetchExternalData = () => {
    setSelectedSource("external");
    setCurrentStep("override-warning");
  };

  const handleConfirmImport = () => {
    if (selectedSource === "rise") {
      fetchRiseData();
    } else if (selectedSource === "external") {
      fetchSecureFundingData();
    }
  };

  const handleCancelImport = () => {
    setCurrentStep("source-selection");
    setSelectedSource("");
    setDateRangeOption("all");
    setCustomStartYear("");
  };

  async function addSecureFundingData() {
    setAddingData(true);

    // make a single batch
    const newBatchedData = [];
    let fname, lname;
    const tempData = [...selectedSecureFundingData];
    for (const data of tempData) {
      data.year = data.dates.split("-")[0];
      delete data.dates;
      data.type = "Grant";
      fname = data.first_name || "";
      lname = data.last_name || "";
      if (fname) {
        data.principal_investigator = fname;
      }
      if (lname) {
        data.principal_investigator += ` ${lname}`;
      }
      delete data.first_name;
      delete data.last_name;
      newBatchedData.push(data);
    }

    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      if (!idToken) throw new Error("Auth Error: No ID token found.");

      let dataSections = [];
      dataSections = await getAllSections();
      const secureFundingSectionId = dataSections.find((section) =>
        section.title.includes("Research or Equivalent Grants")
      )?.data_section_id;

      const payload = {
        arguments: {
          data_details_list: newBatchedData,
          user_id: user.user_id,
          data_section_id: secureFundingSectionId,
          editable: "false",
        },
      };
      let baseUrl = process.env.REACT_APP_BATCH_API_BASE_URL || "";
      // omit the last '/' from baseUrl
      if (baseUrl.endsWith("/")) {
        baseUrl = baseUrl.slice(0, -1);
      }

      const response = await fetch(`${baseUrl}/batch/addBatchedData`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      else {
        console.log("Added ", payload.arguments.data_details_list.length, "Grants Successfully | 200 OK");
        setCurrentStep("success");
      }
    } catch (error) {
      console.error("Error adding new entry:", error);
      setCurrentStep("matched-grants");
    }

    setAddingData(false);

    // Don't immediately close - allow the success message to display
    setTimeout(() => {
      setRetrievingData(false);
      fetchData();
      onClose();
    }, 2500);
  }

  

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <dialog
        className="modal h-[70vh] relative bg-white rounded-xl shadow-xl max-w-4xl mx-4 w-full p-0 overflow-y-auto"
        open
        style={{ margin: 0, padding: 0 }}
      >
        {/* X close button at the top right */}
        <button
          type="button"
          className="btn btn-sm btn-circle btn-ghost absolute top-4 right-4 z-20 hover:bg-red-500 hover:text-white transition"
          onClick={onClose}
          aria-label="Close"
        >
          <span className="text-lg leading-none">✕</span>
        </button>

        {/* Step 1: Source Selection */}
        {currentStep === "source-selection" && (
          <div className="flex flex-col items-center justify-center w-full h-full p-8">
            <div className="text-center mb-8">       
              <div className="mb-8">
                <div className="mb-4 text-lg font-semibold text-gray-700">Fetch data from RISE:</div>
                <button type="button" className="btn btn-secondary px-8 py-3 text-lg" onClick={handleFetchRiseData}>
                  Fetch RISE Data
                </button>
              </div>
              
              <div className="mb-8">
                <div className="mb-4 text-lg font-semibold text-gray-700">Fetch data from external grant sources:</div>
                <div className="text-sm text-gray-600 mb-4 space-y-1">
                  <div>• Canadian Institutes of Health Research (CIHR)</div>
                  <div>• Natural Sciences and Engineering Research Council of Canada (NSERC)</div>
                  <div>• Social Sciences and Humanities Research Council (SSHRC)</div>
                  <div>• Canada Foundation for Innovation (CFI)</div>
                </div>
                <button type="button" className="btn btn-info px-8 py-3 text-lg" onClick={handleFetchExternalData}>
                  Fetch External Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Override Warning Modal */}
        {currentStep === "override-warning" && (
          <div className="w-full h-full p-6 overflow-y-auto">
            {/* Warning Section */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-red-500 text-xl">⚠️</span>
                <span className="text-lg font-semibold text-red-600">Important Override Instructions</span>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                <div className="text-sm text-red-800 leading-relaxed">
                  Importing data directly from {selectedSource === "rise" ? "RISE" : "external sources"} will{" "}
                  <strong>permanently override</strong> any existing entries in your profile's Research or
                  Equivalent Grants and Contracts section. This includes records that were manually added or
                  previously imported from other systems.
                </div>
              </div>
            </div>

            {/* Import Range Section */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-500">📅</span>
                Select Import Range
              </h4>
              
              {/* Date Range Options */}
              <div className="space-y-4 mb-4">
                {/* All Years Option */}
                <div className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
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
                    <div className="font-normal text-gray-900">All available years (Default)</div>
                    <div className="text-sm text-gray-600">Import all grant data from {selectedSource === "rise" ? "RISE" : "external sources"}</div>
                  </label>
                </div>

                {/* Custom Range Option */}
                <div className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
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
                    <div className="font-medium text-gray-900">Custom</div>
                    <div className="text-sm text-gray-600">Import grants starting from a specific year onwards</div>
                  </label>
                </div>

                {/* Custom Year Input */}
                {dateRangeOption === "custom" && (
                  <div className=" flex items-center gap-3">
                    <label htmlFor="start-year" className="text-sm font-medium text-gray-700">
                      Start from year:
                    </label>
                    <select
                      id="start-year"
                      value={customStartYear}
                      onChange={(e) => setCustomStartYear(e.target.value)}
                      className="select select-bordered select-sm w-42 text-center"
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

              {/* Current Selection Display */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-center mb-4">
                <span className="font-mono text-lg font-semibold text-blue-800">
                  {dateRangeOption === "all" 
                    ? "Importing Grants for [All available years]" 
                    : customStartYear 
                      ? `Importing Grants for [${customStartYear} onwards]`
                      : "[Please enter start year]"
                  }
                </span>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-sm text-yellow-800">
                  <strong>By continuing, you confirm that you understand:</strong>
                  <br />
                  Importing data will replace all existing grant entries in your profile with external grants for the selected date
                  range.
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center pt-4 border-t border-gray-200">
              <button
                type="button"
                className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={handleConfirmImport}
                disabled={dateRangeOption === "custom" && !customStartYear}
              >
                ✓ Confirm Import
              </button>
              <button
                type="button"
                className="px-8 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold shadow-md hover:shadow-lg"
                onClick={handleCancelImport}
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Fetching Data */}
        {currentStep === "fetching" && (
          <div className="flex items-center justify-center w-full h-full">
            <div className="text-center">
              <div className="loading loading-spinner loading-lg text-blue-600 mb-4"></div>
              <div className="text-lg text-gray-600">Fetching grants data...</div>
            </div>
          </div>
        )}

        {/* Step 4: Matched Grants */}
        {currentStep === "matched-grants" && (
          <div className="w-full h-full p-6 overflow-y-auto">
            {allSecureFundingData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500 text-lg">No grants data found</div>
              </div>
            ) : (
              <>
                {/* Header with controls */}
                <div className="flex items-center justify-between bg-gray-100 p-4 rounded-xl shadow mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-semibold text-gray-700">Matched Grants</span>
                    <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                      {selectedSecureFundingData.length} selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1 text-sm font-medium text-red-600 bg-red-100 hover:bg-red-200 rounded-full transition"
                      onClick={() => setSelectedSecureFundingData([])}
                    >
                      Deselect All
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary px-6 py-2 text-white rounded-lg shadow hover:shadow-md transition"
                      onClick={addSecureFundingData}
                      disabled={addingData || selectedSecureFundingData.length === 0}
                    >
                      {addingData ? "Adding grants data..." : "Add Grant Data"}
                    </button>
                  </div>
                </div>

                {/* Grants list */}
                <div className="space-y-4">
                  {allSecureFundingData.map((secureFundingData, index) => (
                    <SecureFundingEntry
                      key={index}
                      secureFundingData={secureFundingData}
                      onSelect={handleSelect}
                      selected={selectedSecureFundingData.includes(secureFundingData)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 5: Success */}
        {currentStep === "success" && (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <div className="text-center">
              <div className="text-green-500 text-6xl mb-4">✓</div>
              <div className="text-2xl font-bold mb-2 text-green-600">Grants Added Successfully!</div>
              <div className="text-gray-600">
                {selectedSecureFundingData.length} grants have been added to your profile
              </div>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
};

export default SecureFundingModal;
