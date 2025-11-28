import React, { useState, useEffect } from "react";
import "../CustomStyles/scrollbar.css";
import "../CustomStyles/modal.css";
import SecureFundingEntry from "./SecureFundingEntry";
import GrantWithDuplicates from "./GrantWithDuplicates";
import { fetchAuthSession } from "aws-amplify/auth";
import {
  getRiseDataMatches,
  getAllSections,
  getUserCVData,
} from "../graphql/graphqlHelpers";
import {
  normalizeAmount,
  normalizeYear,
  calculateJaccardSimilarity,
} from "../utils/mergeUtils";

const SecureFundingModal = ({ user, section, onClose, setRetrievingData, fetchData }) => {
  const [allSecureFundingData, setAllSecureFundingData] = useState([]);
  const [externalData, setExternalData] = useState([]);
  const [riseData, setRiseData] = useState([]);
  const [selectedSecureFundingData, setSelectedSecureFundingData] = useState([]);
  const [currentStep, setCurrentStep] = useState("fetching"); // "source-selection", "grants-display", "success"
  const [selectedSource, setSelectedSource] = useState(""); // "rise" or "external"
  const [addingData, setAddingData] = useState(false);
  const [dateRangeOption, setDateRangeOption] = useState("all"); // "all" or "custom"
  const [customStartYear, setCustomStartYear] = useState("");
  const [existingGrantsData, setExistingGrantsData] = useState([]);
  const [potentialDuplicates, setPotentialDuplicates] = useState([]);

  const [duplicatesExpanded, setDuplicatesExpanded] = useState(false);
  const [newGrantsExpanded, setNewGrantsExpanded] = useState(true);

  const calculateGrantSimilarity = (grant1, grant2) => {
    // Early exit: check years first (cheapest operation)
    const year1 = normalizeYear(grant1.year || grant1.dates);
    const year2 = normalizeYear(grant2.year || grant2.dates);
    if (!year1 || !year2) return { overall: 0, title: 0, agency: 100, year: 0, amount: 0 };
    
    const yearDiff = Math.abs(year1 - year2);
    if (yearDiff > 1) return { overall: 0, title: 0, agency: 100, year: 0, amount: 0 };
    const yearSim = yearDiff === 0 ? 100 : 50;

    // Check amounts (also relatively cheap)
    const amount1 = normalizeAmount(grant1.amount);
    const amount2 = normalizeAmount(grant2.amount);
    if (amount1 === 0 || amount2 === 0) return { overall: 0, title: 0, agency: 100, year: yearSim, amount: 0 };
    if (amount1 !== amount2) return { overall: 0, title: 0, agency: 100, year: yearSim, amount: 0 };
    const amountSim = 100;

    // Only calculate expensive title similarity if year and amount pass
    const titleSim = calculateJaccardSimilarity(grant1.title, grant2.title);
    if (titleSim < 95) return { overall: 0, title: Math.round(titleSim), agency: 100, year: yearSim, amount: amountSim };

    // Calculate weighted score only for high-confidence matches
    const weightedScore = titleSim * 0.6 + yearSim * 0.2 + amountSim * 0.2;

    return {
      overall: Math.round(weightedScore),
      title: Math.round(titleSim),
      agency: 100,
      year: yearSim,
      amount: amountSim,
    };
  };

  const findPotentialDuplicates = (importedGrants, existingGrants) => {
    if (!importedGrants?.length || !existingGrants?.length) {
      return [];
    }

    const duplicates = [];

    importedGrants.forEach((importedGrant, importedIndex) => {
      existingGrants.forEach((existingGrant, existingIndex) => {
        const similarity = calculateGrantSimilarity(importedGrant, existingGrant.data_details);

        // Only add if similarity calculation returned a match (overall > 0)
        if (similarity.overall > 0) {
          duplicates.push({
            importedGrant,
            importedIndex,
            existingGrant: existingGrant.data_details,
            existingIndex,
            similarity,
            id: `${importedIndex}-${existingIndex}`,
          });
        }
      });
    });

    return duplicates.sort((a, b) => b.similarity.overall - a.similarity.overall);
  };

  const categorizeGrants = () => {
    const duplicateGrantIndices = new Set();
    const duplicateGrantsMap = new Map(); // Use Map for O(1) lookups instead of array.find
    const newGrants = [];
    const existingGrantsMatched = new Set();

    potentialDuplicates.forEach((duplicate) => {
      duplicateGrantIndices.add(duplicate.importedIndex);
      existingGrantsMatched.add(duplicate.existingIndex);

      if (!duplicateGrantsMap.has(duplicate.importedIndex)) {
        duplicateGrantsMap.set(duplicate.importedIndex, {
          grant: duplicate.importedGrant,
          importedIndex: duplicate.importedIndex,
          duplicates: potentialDuplicates.filter((d) => d.importedIndex === duplicate.importedIndex),
        });
      }
    });

    allSecureFundingData.forEach((grant, index) => {
      if (!duplicateGrantIndices.has(index)) {
        newGrants.push({ grant, importedIndex: index });
      }
    });

    const recordIdFilteredNewGrants = newGrants.filter((grantItem) => {
      const grant = grantItem.grant;
      if (selectedSource === "rise" && grant.record_id && grant.record_id.trim() !== "") {
        const recordIdExists = existingGrantsData.some((existingGrant) => {
          const existingRecordId = existingGrant.data_details?.record_id;
          return existingRecordId && existingRecordId.trim() !== "" && existingRecordId === grant.record_id;
        });
        
        if (recordIdExists) {
          console.log(`✋ Filtering out grant with duplicate record_id: ${grant.record_id} - ${grant.title}`);
          return false;
        }
      }
      return true;
    });

    const unmatchedExistingGrants = existingGrantsData.filter((_, index) => !existingGrantsMatched.has(index));

    // Convert Map to array and sort
    const duplicateGrants = Array.from(duplicateGrantsMap.values()).sort((a, b) => {
      const maxSimilarityA = Math.max(...a.duplicates.map((d) => d.similarity.overall));
      const maxSimilarityB = Math.max(...b.duplicates.map((d) => d.similarity.overall));
      return maxSimilarityB - maxSimilarityA;
    });

    return {
      duplicateGrants,
      newGrants: sortSecureFundingByDate(recordIdFilteredNewGrants.map((item) => item.grant)).map((grant) => ({
        grant,
        importedIndex: allSecureFundingData.indexOf(grant),
      })),
      unmatchedExistingGrants,
    };
  };

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

  const sortSecureFundingByDate = (data) => {
    return [...data].sort((a, b) => {
      const dateA = a.dates || "";
      const dateB = b.dates || "";

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      const lowerDateA = dateA.toLowerCase();
      const lowerDateB = dateB.toLowerCase();

      if (lowerDateA.includes("current") || lowerDateA.includes("present")) return -1;
      if (lowerDateB.includes("current") || lowerDateB.includes("present")) return 1;

      const extractYear = (dateStr) => {
        if (!dateStr) return 0;
        const startDate = dateStr.split("-")[0].trim();
        const yearMatch = startDate.match(/\b(\d{4})\b/);
        return yearMatch ? parseInt(yearMatch[1]) : 0;
      };

      const yearA = extractYear(dateA);
      const yearB = extractYear(dateB);

      return yearB - yearA;
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
        // Fetch existing grants data first
        let existingGrants = [];
        try {
          const existingData = await getUserCVData(user.user_id, section.data_section_id);
          existingGrants = existingData.map((data) => ({
            ...data,
            data_details: JSON.parse(data.data_details),
          }));
          setExistingGrantsData(existingGrants);
        } catch (error) {
          console.error("Error fetching existing grants:", error);
          setExistingGrantsData([]);
        }

        // Fetch both external and RISE data in parallel
        // for now external data will not be fetched
        const [externalResults, riseResults] = await Promise.all([[], getRiseDataMatches(user.first_name, user.last_name)]);

        // Process external data
        const processedExternalData = [];
        const uniqueExternalData = new Set();

        // for (const dataObject of externalResults) {
        //   const { data_details } = dataObject;
        //   const data_details_json = JSON.parse(data_details);
        //   const uniqueKey = `${data_details_json.first_name}-${data_details_json.last_name}-${data_details_json.title}-${data_details_json.amount}`;
        //   if (!uniqueExternalData.has(uniqueKey)) {
        //     uniqueExternalData.add(uniqueKey);
        //     processedExternalData.push(data_details_json);
        //   }
        // }

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
        processDateFormatting(processedRiseData);
        // processDateFormatting(processedExternalData);

        // Filter RISE data: entries with Canadian funding agencies go to external
        // const canadianFundingFromRise = processedRiseData.filter((item) => {
        //   const hasCanadianAgency = isCanadianFundingAgency(item);
        //   return hasCanadianAgency;
        // });

        // Combine external data with Canadian funding from RISE
        const combinedExternalData = [...processedExternalData, ...processedRiseData];

        // console.log("External data (including Canadian from RISE):", combinedExternalData.length);
        // console.log("Pure RISE data:", pureRiseData.length);
        // console.log("Canadian funding moved from RISE to external:", canadianFundingFromRise.length);

        // Store all processed data
        setAllSecureFundingData(combinedExternalData);
        setExternalData(combinedExternalData);
        setRiseData(processedRiseData);

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

      // console.log("Filtered external data:", filteredData.length);
      setAllSecureFundingData(filteredData);

      // Detect potential duplicates
      const duplicates = findPotentialDuplicates(filteredData, existingGrantsData);
      setPotentialDuplicates(duplicates);

      // Get non-duplicate grants for initial selection
      const duplicateIndices = new Set(duplicates.map((d) => d.importedIndex));
      const nonDuplicateGrants = filteredData.filter((_, index) => !duplicateIndices.has(index));

      // Only select non-duplicate grants initially
      setSelectedSecureFundingData(nonDuplicateGrants);

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

      // console.log("Filtered RISE data:", filteredData.length);
      setAllSecureFundingData(filteredData);

      // Detect potential duplicates
      const duplicates = findPotentialDuplicates(filteredData, existingGrantsData);
      setPotentialDuplicates(duplicates);

      // Get non-duplicate grants for initial selection
      const duplicateIndices = new Set(duplicates.map((d) => d.importedIndex));
      const nonDuplicateGrants = filteredData.filter((_, index) => !duplicateIndices.has(index));

      // Only select non-duplicate grants initially
      setSelectedSecureFundingData(nonDuplicateGrants);

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
      // Extract year from dates for year field
      if (data.dates) {
        const datesParts = data.dates.split("-");
        if (datesParts.length > 0) {
          data.year = datesParts[0].trim();
        }
      }
      delete data.dates_0;
      delete data.dates_1;
      data.type = "Grant";
      fname = data.first_name || "";
      lname = data.last_name || "";
      if (data.agency.toLowerCase() === "rise") {
        let sponsor = data.sponsor.toLowerCase() || "";
        if (sponsor.includes("cihr") || sponsor.includes("canadian institutes of health research")) {
          data.sponsor = "CIHR";
        } else if (sponsor.includes("nserc") || sponsor.includes("natural sciences and engineering research council")) {
          data.sponsor = "NSERC";
        } else if (sponsor.includes("sshrc") || sponsor.includes("social sciences and humanities research council")) {
          data.sponsor = "SSHRC";
        } else if (
          sponsor.includes("cfi") ||
          sponsor.includes("canada foundation for innovation") ||
          sponsor.includes("canadian foundation for innovation")
        ) {
          data.sponsor = "CFI";
        } 
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
      // Preserve record_id if it exists (for RISE data)
      // record_id will be kept in the data object for future duplicate detection
      
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
    }, 500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <dialog
        className="modal h-full max-h-[80vh] relative bg-white rounded-xl shadow-xl max-w-5xl mx-4 w-full p-0 overflow-y-auto"
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
            {/* Header */}
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Import Grants</h3>
              <p className="text-sm text-gray-600">
                Import grants from the RISE database into your CV
              </p>
            </div>

            {/* Workflow Information Section - Only show if data exists */}
            {(getFilteredCounts().rise > 0 || getFilteredCounts().external > 0) && (
              <div className="mb-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <div className="flex items-start gap-3">
                    <span className="text-gray-600 text-lg">ℹ️</span>
                    <div className="text-sm text-gray-700 leading-relaxed">
                      <div className="font-semibold mb-2 text-gray-800">How it works:</div>
                      <ul className="space-y-1.5">
                        <li className="flex items-start gap-2">
                          <span className="text-gray-400 mt-0.5">•</span>
                          <span><strong>Step 1:</strong> Filter grants by date range</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-gray-400 mt-0.5">•</span>
                          <span><strong>Step 2:</strong> Review and skip any duplicates automatically</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-gray-400 mt-0.5">•</span>
                          <span><strong>Step 3:</strong> Select which new grants to add to your CV</span>
                        </li>
                      </ul>
                      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
                        Your existing grants will not be modified or deleted.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Date Range Selection */}
            <div className="mb-4">
              <h4 className="text-base font-semibold text-gray-900 mb-3">Select Date Range</h4>

              {/* Date Range Options */}
              <div className="space-y-2">
                {/* All Years Option */}
                <label
                  htmlFor="all-years"
                  className="flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:border-yellow-400 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    id="all-years"
                    name="dateRange"
                    value="all"
                    checked={dateRangeOption === "all"}
                    onChange={(e) => setDateRangeOption(e.target.value)}
                    className="radio radio-warning"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">All available years</div>
                    <div className="text-xs text-gray-500">Import all grants in the database</div>
                  </div>
                </label>

                {/* Custom Range Option */}
                <label
                  htmlFor="custom-range"
                  className="flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:border-yellow-400 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    id="custom-range"
                    name="dateRange"
                    value="custom"
                    checked={dateRangeOption === "custom"}
                    onChange={(e) => setDateRangeOption(e.target.value)}
                    className="radio radio-warning"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Custom date range</div>
                    <div className="text-xs text-gray-500">Import grants from a specific year onwards</div>
                  </div>
                </label>

                {/* Custom Year Input */}
                {dateRangeOption === "custom" && (
                  <div className="ml-8 mt-2 flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
                    <label htmlFor="start-year" className="text-sm font-medium text-gray-700">
                      From:
                    </label>
                    <select
                      id="start-year"
                      value={customStartYear}
                      onChange={(e) => setCustomStartYear(e.target.value)}
                      className="select select-bordered select-sm"
                    >
                      <option value="">Select year</option>
                      {Array.from({ length: new Date().getFullYear() - 1950 + 1 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                    <span className="text-sm text-gray-600">onwards</span>
                  </div>
                )}
              </div>
            </div>

            {/* Source Selection with Counts */}
            {(getFilteredCounts().rise > 0 || getFilteredCounts().external > 0) && (
              <div className="mb-6">
                <div className="grid grid-cols-1 gap-3">
                  {/* RISE Data */}
                  {getFilteredCounts().rise > 0 && (
                    <div className="border border-gray-300 rounded-lg p-4 hover:border-yellow-400 hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-800 mb-1">RISE Database</h5>
                          {/* <p className="text-sm text-gray-600 mb-3">
                            Internal university research grants (excluding Canadian funding agencies)
                          </p> */}
                          <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-50 border border-yellow-300 rounded-lg text-xs font-medium text-yellow-800">
                            <span>📊</span>
                            <span>{getFilteredCounts().rise} grant{getFilteredCounts().rise !== 1 ? 's' : ''} found</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-warning text-gray-800 px-6 whitespace-nowrap"
                          onClick={handleFetchRiseData}
                          disabled={dateRangeOption === "custom" && !customStartYear}
                        >
                          Import
                        </button>
                      </div>
                    </div>
                  )}

                  {/* External Data - keeping commented out as in original */}
                  {/* <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-800 mb-1">External Sources</h5>
                        <div className="text-sm text-gray-600 mb-2">
                          <div>• CIHR, NSERC, SSHRC, CFI</div>
                        </div>
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs font-medium text-blue-700">
                          <span>📈</span>
                          <span>{getFilteredCounts().external} grants found</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`btn px-6 whitespace-nowrap ${getFilteredCounts().external === 0 ? "btn-disabled" : "btn-info"}`}
                        onClick={handleFetchExternalData}
                        disabled={getFilteredCounts().external === 0 || (dateRangeOption === "custom" && !customStartYear)}
                      >
                        Import
                      </button>
                    </div>
                  </div> */}
                </div>
              </div>
            )}

            {/* No Data Message */}
            {getFilteredCounts().rise === 0 && getFilteredCounts().external === 0 && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 text-xl">⚠️</span>
                  <div>
                    <div className="font-medium text-yellow-800 mb-1">No grants found</div>
                    <div className="text-sm text-yellow-700">
                      {dateRangeOption === "custom" && customStartYear
                        ? `No grants were found from ${customStartYear} onwards in the RISE database.`
                        : "No grants were found matching your name in the RISE database."}
                    </div>
                    {dateRangeOption === "custom" && customStartYear && (
                      <button
                        className="mt-2 text-sm text-yellow-800 underline hover:text-yellow-900"
                        onClick={() => {
                          setDateRangeOption("all");
                          setCustomStartYear("");
                        }}
                      >
                        Try viewing all years instead
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
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
                  setPotentialDuplicates([]);
                  setDuplicatesExpanded(true);
                  setNewGrantsExpanded(true);
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
              {/* <div className="text-left">
                <span className="text-lg text-zinc-800 font-semibold ">
                  {dateRangeOption === "all"
                    ? `${selectedSource === "rise" ? "RISE" : "External"} GRANTS IMPORT REVIEW`
                    : customStartYear
                    ? `${
                        selectedSource === "rise" ? "RISE" : "External"
                      } GRANTS IMPORT REVIEW [${customStartYear} onwards]`
                    : "GRANTS IMPORT REVIEW"}{" "}
                </span>
              </div> */}
            </div>

            {allSecureFundingData.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500 text-lg">No grants data found for selected criteria</div>
              </div>
            ) : (
              <>
                {(() => {
                  const { duplicateGrants, newGrants } = categorizeGrants();

                  return (
                    <div className="space-y-4">
                      {/* Summary Section */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-800 mb-2">Import Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{allSecureFundingData.length}</div>
                            <div className="text-gray-600">Total Found</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{duplicateGrants.length}</div>
                            <div className="text-gray-600">Will Skip (Duplicates)</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{newGrants.length}</div>
                            <div className="text-gray-600">Available to Add</div>
                          </div>
                        </div>
                        
                        {/* Special case: All grants are duplicates */}
                        {newGrants.length === 0 && duplicateGrants.length > 0 && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-yellow-600 text-xl">ℹ️</span>
                              <div>
                                <div className="font-medium text-yellow-800">All Found Grants Are Already in Your CV</div>
                                <div className="text-sm text-yellow-700">
                                  We found {duplicateGrants.length} grants, but they all appear to match existing entries in your profile. No new grants will be added.
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Potential Duplicates Section */}
                      {duplicateGrants.length > 0 ? (
                        <div className="border border-gray-200 rounded-lg">
                          <div className="p-4 flex items-center justify-between bg-gray-50 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setDuplicatesExpanded(!duplicatesExpanded)}
                                className="flex items-center gap-2 hover:bg-gray-100 p-1 rounded transition-colors"
                              >
                                <svg
                                  className={`w-4 h-4 transition-transform ${duplicatesExpanded ? "rotate-90" : ""}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                              <div>
                                <span className="font-semibold text-gray-800">
                                  {newGrants.length > 0 
                                    ? `Step 1: Existing Grants (${duplicateGrants.length})`
                                    : `Existing Grants (${duplicateGrants.length})`
                                  }
                                </span>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  These will be automatically skipped - your existing data remains unchanged
                                </p>
                              </div>
                            </div>
                          </div>

                          {duplicatesExpanded && (
                            <div className="p-4 space-y-3 bg-white">
                              {duplicateGrants.map((grantItem, index) => (
                                <GrantWithDuplicates
                                  key={`duplicate-${index}`}
                                  grantItem={grantItem}
                                  duplicates={grantItem.duplicates}
                                  normalizeYear={normalizeYear}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="border border-gray-200 rounded-lg bg-gray-50 p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 text-lg">✓</span>
                            <div>
                              <div className="font-medium text-gray-800">No Duplicates Found</div>
                              <div className="text-sm text-gray-600">
                                All imported grants appear to be new entries
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* New Grants Section */}
                      {newGrants.length > 0 ? (
                        <div className="border border-gray-200 rounded-lg">
                          <div className="p-4 flex items-center justify-between bg-gray-50 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setNewGrantsExpanded(!newGrantsExpanded)}
                                className="flex items-center gap-2 hover:bg-gray-100 p-1 rounded transition-colors"
                              >
                                <svg
                                  className={`w-4 h-4 transition-transform ${newGrantsExpanded ? "rotate-90" : ""}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                              <div>
                                <span className="font-semibold text-gray-800">
                                  {duplicateGrants.length > 0 
                                    ? `Step 2: Select New Grants (${newGrants.length})`
                                    : `Select Grants to Import (${newGrants.length})`
                                  }
                                </span>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Choose which grants you want to add to your CV
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {(() => {
                                const selectedNewGrants = newGrants.filter((item) =>
                                  selectedSecureFundingData.includes(item.grant)
                                );

                                return (
                                  <>
                                    <button
                                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition"
                                      onClick={() => {
                                        const newGrantsOnly = newGrants.map((item) => item.grant);
                                        if (selectedNewGrants.length === newGrants.length) {
                                          setSelectedSecureFundingData((prev) =>
                                            prev.filter((item) => !newGrantsOnly.includes(item))
                                          );
                                        } else {
                                          setSelectedSecureFundingData((prev) => {
                                            const filtered = prev.filter((item) => !newGrantsOnly.includes(item));
                                            return [...filtered, ...newGrantsOnly];
                                          });
                                        }
                                      }}
                                      disabled={newGrants.length === 0}
                                    >
                                      {selectedNewGrants.length === newGrants.length
                                        ? "Deselect All"
                                        : "Select All"}
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-primary px-6 py-1.5 text-white rounded-lg transition disabled:opacity-50"
                                      onClick={addSecureFundingData}
                                      disabled={addingData || selectedSecureFundingData.length === 0}
                                    >
                                      {addingData
                                        ? "Adding..."
                                        : `Add ${selectedSecureFundingData.length} Grant${
                                            selectedSecureFundingData.length !== 1 ? "s" : ""
                                          }`}
                                    </button>
                                  </>
                                );
                              })()}
                            </div>
                          </div>

                          {newGrantsExpanded && (
                            <div className="p-4 space-y-2 bg-white">
                              {newGrants.map((grantItem, index) => (
                                <SecureFundingEntry
                                  key={`new-${index}`}
                                  secureFundingData={grantItem.grant}
                                  onSelect={handleSelect}
                                  selected={selectedSecureFundingData.includes(grantItem.grant)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="border border-gray-200 rounded-lg bg-gray-50 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-gray-400 text-lg">ℹ️</span>
                              <div>
                                <div className="font-medium text-gray-800">
                                  {duplicateGrants.length > 0 
                                    ? "Step 2: No New Grants to Import"
                                    : "No New Grants to Import"
                                  }
                                </div>
                                <div className="text-sm text-gray-600">
                                  {duplicateGrants.length > 0
                                    ? "All grants match your existing entries"
                                    : "No grants were found"}
                                </div>
                              </div>
                            </div>
                            
                            {duplicateGrants.length > 0 && (
                              <button
                                type="button"
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition"
                                onClick={onClose}
                              >
                                Close
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
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
