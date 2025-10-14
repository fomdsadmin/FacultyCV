import React, { useState, useEffect } from "react";
import "../CustomStyles/scrollbar.css";
import "../CustomStyles/modal.css";
import SecureFundingEntry from "./SecureFundingEntry";
import { fetchAuthSession } from "aws-amplify/auth";
import { getSecureFundingMatches, getRiseDataMatches, addUserCVData, getAllSections } from "../graphql/graphqlHelpers";
import GenericEntry from "SharedComponents/GenericEntry";
import { sortEntriesByDate } from "../utils/dateUtils";

const SecureFundingModal = ({ user, section, onClose, setRetrievingData, fetchData }) => {
  const [allSecureFundingData, setAllSecureFundingData] = useState([]);
  const [allRiseData, setAllRiseData] = useState([]);
  const [externalData, setExternalData] = useState([]);
  const [riseData, setRiseData] = useState([]);
  const [selectedSecureFundingData, setSelectedSecureFundingData] = useState([]);
  const [currentStep, setCurrentStep] = useState("fetching"); // "source-selection", "grants-display", "success"
  const [selectedSource, setSelectedSource] = useState(""); // "rise" or "external"
  const [addingData, setAddingData] = useState(false);
  const [dateRangeOption, setDateRangeOption] = useState("all"); // "all" or "custom"
  const [customStartYear, setCustomStartYear] = useState("");

  // Canadian funding agencies to filter from RISE data
  const canadianFundingAgencies = [
    "Canadian Institutes of Health Research",
    "CIHR",
    "Natural Sciences and Engineering Research Council of Canada",
    "NSERC",
    "Social Sciences and Humanities Research Council",
    "SSHRC",
    "Canada Foundation for Innovation",
    "CFI",
  ];

  // Function to sort secure funding data by date (most recent first)
  const sortSecureFundingByDate = (data) => {
    return [...data].sort((a, b) => {
      // Extract date from 'dates' field
      const dateA = a.dates || '';
      const dateB = b.dates || '';
      
      // Handle empty dates (put them at the end)
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      // Handle "current" or "present" - should be sorted as most recent
      const lowerDateA = dateA.toLowerCase();
      const lowerDateB = dateB.toLowerCase();
      
      if (lowerDateA.includes("current") || lowerDateA.includes("present")) {
        return -1; // A is more recent
      }
      if (lowerDateB.includes("current") || lowerDateB.includes("present")) {
        return 1; // B is more recent
      }
      
      // For date ranges, extract the start year
      const extractYear = (dateStr) => {
        if (!dateStr) return 0;
        
        // Split on dash and take the first part (start date)
        const startDate = dateStr.split('-')[0].trim();
        
        // Extract 4-digit year
        const yearMatch = startDate.match(/\b(\d{4})\b/);
        return yearMatch ? parseInt(yearMatch[1]) : 0;
      };
      
      const yearA = extractYear(dateA);
      const yearB = extractYear(dateB);
      
      // Sort by year descending (most recent first)
      return yearB - yearA;
    });
  };

  // Function to check if sponsor contains Canadian funding agencies
  const isCanadianFundingAgency = (item) => {
    if (!item) return false;

    // Check multiple fields that might contain sponsor information
    const fieldsToCheck = [
      item.sponsor,
      item.agency,
      item.funding_agency,
      item.granting_agency,
      item.organisation,
      item.organization,
    ];

    return fieldsToCheck.some((field) => {
      if (!field) return false;
      const fieldLower = field.toLowerCase();
      return canadianFundingAgencies.some(
        (agency) =>
          fieldLower.includes(agency.toLowerCase()) ||
          // Also check for acronyms in parentheses
          fieldLower.includes(`(${agency.toLowerCase()})`)
      );
    });
  };

  // Function to process date formatting
  const processDateFormatting = (data) => {
    data.forEach((item) => {
      if (item.dates && item.dates.trim().endsWith("-")) {
        item.dates = item.dates.replace(/-/g, "");
      }

      if (item.dates && item.dates.trim().startsWith("-")) {
        item.dates = item.dates.replace(/-/g, "");
      }

      if (item.dates && item.dates.trim().split("-").length === 2) {
        item.dates_0 = item.dates.trim().split("-")[0];
        item.dates_1 = item.dates.trim().split("-")[1];
        item.dates = `${item.dates_0} - ${item.dates_1}`;
      }
    });
  };

  // Function to filter data by date range
  const filterByDateRange = (data, dateRangeOption, customStartYear) => {
    if (dateRangeOption === "custom" && customStartYear) {
      const startYear = parseInt(customStartYear);
      return data.filter((item) => {
        if (item.dates) {
          const yearMatch = item.dates.match(/^\d{4}/);
          if (yearMatch) {
            const dataYear = parseInt(yearMatch[0]);
            return dataYear >= startYear;
          }
        }
        return true;
      });
    }
    return data;
  };

  // Get filtered counts for display
  const getFilteredCounts = () => {
    const filteredExternal = filterByDateRange(externalData, dateRangeOption, customStartYear);
    const filteredRise = filterByDateRange(riseData, dateRangeOption, customStartYear);
    return {
      external: filteredExternal.length,
      rise: filteredRise.length,
    };
  };

  // Fetch and process all data when modal opens
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch both external and RISE data in parallel
        const [externalResults, riseResults] = await Promise.all([
          getSecureFundingMatches(user.first_name, user.last_name),
          getRiseDataMatches(user.first_name, user.last_name),
        ]);

        // Process external data
        const processedExternalData = [];
        const uniqueExternalData = new Set();

        for (const dataObject of externalResults) {
          const { data_details } = dataObject;
          const data_details_json = JSON.parse(data_details);
          const uniqueKey = `${data_details_json.first_name}-${data_details_json.last_name}-${data_details_json.title}-${data_details_json.amount}`;
          if (!uniqueExternalData.has(uniqueKey)) {
            uniqueExternalData.add(uniqueKey);
            processedExternalData.push(data_details_json);
          }
        }

        // Process RISE data
        const processedRiseData = [];
        const uniqueRiseData = new Set();

        for (const dataObject of riseResults) {
          const { data_details } = dataObject;
          const data_details_json = JSON.parse(data_details);
          const uniqueKey = `${data_details_json.first_name}-${data_details_json.last_name}-${data_details_json.title}-${data_details_json.amount}-${data_details_json.sponsor}`;
          if (!uniqueRiseData.has(uniqueKey)) {
            uniqueRiseData.add(uniqueKey);
            processedRiseData.push(data_details_json);
          }
        }

        // Process date formatting for both datasets
        processDateFormatting(processedExternalData);
        processDateFormatting(processedRiseData);

        // Log sample data to understand structure
        if (processedRiseData.length > 0) {
          console.log("Sample RISE data structure:", processedRiseData[0]);
          console.log("Available fields:", Object.keys(processedRiseData[0]));
        }

        // Filter RISE data: entries with Canadian funding agencies go to external
        const canadianFundingFromRise = processedRiseData.filter((item) => {
          const hasCanadianAgency = isCanadianFundingAgency(item);
          if (hasCanadianAgency) {
            console.log("Found Canadian funding in RISE:", {
              sponsor: item.sponsor,
              agency: item.agency,
              title: item.title,
              funding_agency: item.funding_agency,
              organisation: item.organisation,
            });
          }
          return hasCanadianAgency;
        });

        const pureRiseData = processedRiseData.filter((item) => !isCanadianFundingAgency(item));

        // Combine external data with Canadian funding from RISE
        const combinedExternalData = [...processedExternalData, ...canadianFundingFromRise];

        console.log("External data (including Canadian from RISE):", combinedExternalData.length);
        console.log("Pure RISE data:", pureRiseData.length);
        console.log("Canadian funding moved from RISE to external:", canadianFundingFromRise.length);

        // Store all processed data
        setAllSecureFundingData(combinedExternalData);
        setAllRiseData(pureRiseData);
        setExternalData(combinedExternalData);
        setRiseData(pureRiseData);

        setCurrentStep("source-selection");
      } catch (error) {
        console.error("Error fetching funding data:", error);
        // Still show source selection even if fetch fails
        setExternalData([]);
        setRiseData([]);
        setCurrentStep("source-selection");
      }
    };

    fetchAllData();
  }, [user.first_name, user.last_name]);

  async function fetchSecureFundingData() {
    setCurrentStep("fetching");
    try {
      // Add a small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Filter external data by date range
      const filteredData = filterByDateRange(externalData, dateRangeOption, customStartYear);

      console.log("Filtered external data:", filteredData.length);
      setAllSecureFundingData(filteredData);
      setSelectedSecureFundingData(filteredData);
      setCurrentStep("grants-display");
    } catch (error) {
      console.error("Error processing external funding data:", error);
      setCurrentStep("source-selection");
    }
  }

  async function fetchRiseData() {
    setCurrentStep("fetching");
    try {
      // Add a small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Filter RISE data by date range
      const filteredData = filterByDateRange(riseData, dateRangeOption, customStartYear);

      console.log("Filtered RISE data:", filteredData.length);
      setAllSecureFundingData(filteredData);
      setSelectedSecureFundingData(filteredData);
      setCurrentStep("grants-display");
    } catch (error) {
      console.error("Error processing RISE data:", error);
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
    fetchRiseData();
  };

  const handleFetchExternalData = () => {
    setSelectedSource("external");
    fetchSecureFundingData();
  };

  const handleCancelImport = () => {
    setCurrentStep("source-selection");
    setSelectedSource("");
    setDateRangeOption("all");
    setCustomStartYear("");
    setAllSecureFundingData([]);
    setSelectedSecureFundingData([]);
  };

  const handleToggleSelectAll = () => {
    if (selectedSecureFundingData.length === allSecureFundingData.length) {
      // All items are selected, deselect all
      setSelectedSecureFundingData([]);
    } else {
      // Not all items are selected, select all
      setSelectedSecureFundingData([...allSecureFundingData]);
    }
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
      if (data.agency.toLowerCase() === "rise") {
        let sponsor = data.sponsor.toLowerCase() || "";
        if (sponsor.includes("cihr") || sponsor.includes("canadian institutes of health research")) {
          data.agency = "CIHR";
        } else if (sponsor.includes("nserc") || sponsor.includes("natural sciences and engineering research council")) {
          data.agency = "NSERC";
        } else if (sponsor.includes("sshrc") || sponsor.includes("social sciences and humanities research council")) {
          data.agency = "SSHRC";
        } else if (sponsor.includes("cfi") || sponsor.includes("canada foundation for innovation") || sponsor.includes("canadian foundation for innovation")) {
          data.agency = "CFI";
        } else {
          data.agency = "Other (" + data.sponsor + ")";
        }
        delete data.sponsor;
      }
      data["status_-_only_for_grants"] = "Approved";
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

        {/* Initial Loading State */}
        {currentStep === "fetching" && !selectedSource && (
          <div className="flex items-center justify-center w-full h-full">
            <div className="text-center">
              <div className="loading loading-spinner loading-lg text-blue-600 mb-4"></div>
              <div className="text-lg text-gray-600">Loading grants data...</div>
              <div className="text-sm text-gray-500 mt-2">Fetching from all sources</div>
            </div>
          </div>
        )}

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
                    <div className="text-xs text-gray-600">Import all grant data</div>
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
                    <div className="text-xs text-gray-600">Import grants starting from a specific year onwards</div>
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

            {/* No Data Message */}
            {getFilteredCounts().rise === 0 && getFilteredCounts().external === 0 && (
              <div className="mb-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-yellow-800 font-medium text-sm">No funding data found</div>
                <div className="text-yellow-700 text-xs mt-1">
                  {dateRangeOption === "custom" && customStartYear
                    ? `No grants found from ${customStartYear} onwards in either database.`
                    : "No grants were found matching your name in either RISE or external databases."}
                </div>
              </div>
            )}

            {/* Source Selection with Counts */}
            <div className="border-t border-gray-200 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* RISE Data */}
                <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors flex flex-col h-full">
                  <div className="flex-grow mb-4">
                    <h5 className="font-semibold text-gray-700 mb-2">RISE Database</h5>
                    <div className="text-sm text-gray-600 mb-3">
                      Internal university research data (excluding Canadian funding agencies)
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`btn w-full ${getFilteredCounts().rise === 0 ? "btn-disabled" : "btn-secondary"}`}
                    onClick={handleFetchRiseData}
                    disabled={getFilteredCounts().rise === 0 || (dateRangeOption === "custom" && !customStartYear)}
                  >
                    {getFilteredCounts().rise === 0
                      ? "No RISE Data Available"
                      : `Import RISE Data (${getFilteredCounts().rise})`}
                  </button>
                </div>

                {/* External Data */}
                <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors flex flex-col h-full">
                  <div className="flex-grow mb-4">
                    <h5 className="font-semibold text-gray-700 mb-2">External Sources</h5>
                    <div className="text-sm text-gray-600 mb-2 space-y-1">
                      <div>• Canadian Institutes of Health Research (CIHR)</div>
                      <div>• Natural Sciences and Engineering Research Council (NSERC)</div>
                      <div>• Social Sciences and Humanities Research Council (SSHRC)</div>
                      <div>• Canada Foundation for Innovation (CFI)</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`btn w-full ${getFilteredCounts().external === 0 ? "btn-disabled" : "btn-info"}`}
                    onClick={handleFetchExternalData}
                    disabled={getFilteredCounts().external === 0 || (dateRangeOption === "custom" && !customStartYear)}
                  >
                    {getFilteredCounts().external === 0
                      ? "No External Data Available"
                      : `Import External Data (${getFilteredCounts().external})`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Processing Selected Data */}
        {currentStep === "fetching" && selectedSource && (
          <div className="flex items-center justify-center w-full h-full">
            <div className="text-center">
              <div className="loading loading-spinner loading-lg text-blue-600 mb-4"></div>
              <div className="text-lg text-gray-600">
                Processing {selectedSource === "rise" ? "RISE" : "external"} grants data...
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Grants Display with Override Warning */}
        {currentStep === "grants-display" && (
          <div className="w-full h-full p-6 overflow-y-auto">
            {/* Header */}
            <div className="mb-2">
              <button
                type="button"
                className="btn btn-outline btn-sm mb-2"
                onClick={() => {
                  setCurrentStep("source-selection");
                  setSelectedSource("");
                  setAllSecureFundingData([]);
                  setSelectedSecureFundingData([]);
                }}
              >
                ← Back
              </button>
              
              {/* <div className="flex items-center gap-2 mb-3">
                <span className="text-red-500 text-xl">⚠️</span>
                <span className="text-lg font-semibold text-red-600">Important Override Instructions</span>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
                <div className="text-sm text-red-800 leading-relaxed">
                  Importing data from{" "}
                  {selectedSource === "rise" ? "RISE" : "external sources (CIHR, CFI, NSERC, SSHRC etc.)"} will{" "}
                  <strong>permanently override</strong> any existing entries in your profile's Research or Equivalent
                  Grants and Contracts section. This includes records that were manually added or previously imported
                  from other systems. These entries will be archived and can be viewed and restored from the{" "}
                  <u>
                    <a href="/faculty/archive">Archives</a>
                  </u>{" "}
                  page.
                </div>
              </div> */}

              {/* Date Range Display */}
              <div className="text-left flex justify-between items-center gap-2">
                <span className="text-lg text-zinc-800 font-semibold ">
                  {dateRangeOption === "all"
                    ? `IMPORTED ${selectedSource === "rise" ? "RISE" : "External"} GRANTS FOR [All available years]`
                    : customStartYear
                    ? `IMPORTED ${
                        selectedSource === "rise" ? "RISE" : "External"
                      } GRANTS FOR [${customStartYear} onwards]`
                    : "[All available years]"}{" "}
                  {/* <span className=" bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                    {selectedSecureFundingData.length} selected
                  </span> */}
                </span>
                <div className="">
                  <button
                    className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition"
                    onClick={handleToggleSelectAll}
                  >
                    {selectedSecureFundingData.length === allSecureFundingData.length ? "Deselect All" : "Select All"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-success px-6 py-2 ml-2 text-white rounded-lg shadow hover:shadow-md transition"
                    onClick={addSecureFundingData}
                    disabled={addingData || selectedSecureFundingData.length === 0}
                  >
                    {addingData
                      ? "Adding grants data..."
                      : `Add ${selectedSecureFundingData.length} Grant${
                          selectedSecureFundingData.length !== 1 ? "s" : ""
                        }`}
                  </button>
                </div>
              </div>
            </div>

            {/* Helper Information Section */}
            <div className="mb-2">
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 text-lg">ℹ️</span>
                  <div className="text-sm text-green-800 leading-relaxed">
                    <div className="font-medium mb-1">Note:</div>
                    <ul className="space-y-1 text-xs">
                      <li>• These grants were imported from {selectedSource === "rise" ? "RISE database" : "external sources (CIHR, NSERC, SSHRC, CFI)"}</li>
                      <li>• Selected entries will be <strong>added</strong> to your CV's Research or Equivalent Grants section</li>
                      <li>• Your original CV data for this section will <strong>remain intact</strong> - nothing will be overwritten</li>
                      <li>• You can review and edit imported entries after they're added to your profile</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {allSecureFundingData.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500 text-lg">No grants data found for selected criteria</div>
              </div>
            ) : (
              <>
                {/* Grants list */}
                <div className="space-y-2">
                  {sortSecureFundingByDate(allSecureFundingData).map((secureFundingData, index) => (
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

        {/* Step 4: Success */}
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
