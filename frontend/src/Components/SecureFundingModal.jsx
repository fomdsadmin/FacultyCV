import React, { useState, useEffect } from "react";
import "../CustomStyles/scrollbar.css";
import "../CustomStyles/modal.css";
import SecureFundingEntry from "./SecureFundingEntry";
import { fetchAuthSession } from "aws-amplify/auth";
import {
  getSecureFundingMatches,
  getRiseDataMatches,
  addUserCVData,
  getAllSections,
  getUserCVData,
} from "../graphql/graphqlHelpers";
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
  const [existingGrantsData, setExistingGrantsData] = useState([]);
  const [potentialDuplicates, setPotentialDuplicates] = useState([]);

  const [duplicatesExpanded, setDuplicatesExpanded] = useState(false);
  const [newGrantsExpanded, setNewGrantsExpanded] = useState(true);

  // Utility functions for duplicate detection
  const normalizeText = (text) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .replace(/\./g, "") // Remove periods
      .replace(/[^\w\s]/g, " ") // Replace special chars with spaces
      .replace(/\s+/g, " ") // Normalize multiple spaces
      .trim();
  };

  const normalizeAmount = (amount) => {
    if (!amount) return 0;
    // Extract numeric value, handle formats like "$1,000,000" or "1000000"
    const numericAmount = String(amount).replace(/[^0-9.]/g, "");
    return parseFloat(numericAmount) || 0;
  };

  const normalizeYear = (dateStr) => {
    if (!dateStr) return null;
    // Extract first 4-digit year from various date formats
    const yearMatch = String(dateStr).match(/\b(\d{4})\b/);
    return yearMatch ? parseInt(yearMatch[1]) : null;
  };

  const calculateSimilarity = (text1, text2) => {
    if (!text1 || !text2) return 0;

    const norm1 = normalizeText(text1);
    const norm2 = normalizeText(text2);

    if (norm1 === norm2) return 100;

    // Simple word-based similarity
    const words1 = norm1.split(" ").filter((w) => w.length > 2);
    const words2 = norm2.split(" ").filter((w) => w.length > 2);

    if (words1.length === 0 && words2.length === 0) return 100;
    if (words1.length === 0 || words2.length === 0) return 0;

    const intersection = words1.filter((w) => words2.includes(w));
    const union = [...new Set([...words1, ...words2])];

    return (intersection.length / union.length) * 100;
  };

  const calculateGrantSimilarity = (grant1, grant2) => {
    // Title similarity (most important)
    const titleSim = calculateSimilarity(grant1.title, grant2.title);

    // Agency similarity
    const agency1 = grant1.agency || grant1.sponsor || grant1.funding_agency || grant1.granting_agency;
    const agency2 = grant2.agency || grant2.sponsor || grant2.funding_agency || grant2.granting_agency;
    // const agencySim = calculateSimilarity(agency1, agency2);
    const agencySim = 100; // Ignore agency similarity for stricter matching

    // Year comparison - must be exact match or very close
    const year1 = normalizeYear(grant1.year || grant1.dates);
    const year2 = normalizeYear(grant2.year || grant2.dates);
    let yearSim = 0;
    if (year1 && year2) {
      const yearDiff = Math.abs(year1 - year2);
      if (yearDiff === 0) {
        yearSim = 100;
      } else if (yearDiff === 1) {
        yearSim = 50; // Adjacent years might be related but different grants
      } else {
        yearSim = 0; // Different years = different grants
      }
    }

    // Amount comparison - must be very close (within 2%) to be considered the same
    const amount1 = normalizeAmount(grant1.amount);
    const amount2 = normalizeAmount(grant2.amount);
    let amountSim = 0;
    if (amount1 > 0 && amount2 > 0) {
      const diff = Math.abs(amount1 - amount2) / Math.max(amount1, amount2);
      if (diff <= 0.02) {
        // Within 2% - extremely strict
        amountSim = Math.max(0, (1 - diff) * 100);
      } else {
        amountSim = 0; // Too different = different grants
      }
    } else if (amount1 === 0 && amount2 === 0) {
      amountSim = 100; // Both have no amount info
    }

    // Strict matching: require near-perfect matches on all key fields
    const titleThreshold = 95; // High threshold for title similarity
    const hasExactYear = yearSim === 100;
    const hasExactAmount = amountSim >= 98; // Within 2%

    let weightedScore = 0;

    if (titleSim >= titleThreshold) {
      if (hasExactYear && hasExactAmount) {
        // Same title, year, and amount - very likely duplicate
        weightedScore = titleSim * 0.6 + yearSim * 0.2 + amountSim * 0.2;
      } else {
        // Different year OR amount - these are different grants, don't flag as duplicates
        weightedScore = 0;
      }
    } else {
      // Title not similar enough - not a duplicate
      weightedScore = 0;
    }

    return {
      overall: Math.round(weightedScore),
      title: Math.round(titleSim),
      agency: Math.round(agencySim),
      year: yearSim,
      amount: Math.round(amountSim),
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

        // Ultra-strict criteria: Only flag as duplicate if it's nearly identical
        // Title 98%+, Year exact, Amount within 2%, Agency should be similar
        const isHighConfidenceDuplicate = similarity.title >= 90 && similarity.year === 100 && similarity.amount >= 95; // Within 2% for amount

        if (isHighConfidenceDuplicate) {
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

    // Sort by similarity score (highest first)
    return duplicates.sort((a, b) => b.similarity.overall - a.similarity.overall);
  };

  // Function to categorize grants for display
  const categorizeGrants = () => {
    const duplicateGrantIndices = new Set();
    const duplicateGrants = [];
    const newGrants = [];
    const existingGrantsMatched = new Set();

    // First, identify which imported grants have duplicates and track matched existing grants
    potentialDuplicates.forEach((duplicate) => {
      duplicateGrantIndices.add(duplicate.importedIndex);
      existingGrantsMatched.add(duplicate.existingIndex);

      if (!duplicateGrants.find((g) => g.importedIndex === duplicate.importedIndex)) {
        duplicateGrants.push({
          grant: duplicate.importedGrant,
          importedIndex: duplicate.importedIndex,
          duplicates: potentialDuplicates.filter((d) => d.importedIndex === duplicate.importedIndex),
        });
      }
    });

    // Then, categorize all imported grants
    allSecureFundingData.forEach((grant, index) => {
      if (!duplicateGrantIndices.has(index)) {
        newGrants.push({ grant, importedIndex: index });
      }
    });

    // Get unmatched existing grants (those that don't appear in duplicates)
    const unmatchedExistingGrants = existingGrantsData.filter((_, index) => !existingGrantsMatched.has(index));

    return {
      duplicateGrants: duplicateGrants.sort((a, b) => {
        const maxSimilarityA = Math.max(...a.duplicates.map((d) => d.similarity.overall));
        const maxSimilarityB = Math.max(...b.duplicates.map((d) => d.similarity.overall));
        return maxSimilarityB - maxSimilarityA;
      }),
      newGrants: sortSecureFundingByDate(newGrants.map((item) => item.grant)).map((grant) => ({
        grant,
        importedIndex: allSecureFundingData.indexOf(grant),
      })),
      unmatchedExistingGrants: unmatchedExistingGrants,
    };
  };

  // Component to display a grant with potential duplicates (read-only, no checkbox)
  const GrantWithDuplicates = ({ grantItem, duplicates }) => {
    const maxSimilarity = Math.max(...duplicates.map((d) => d.similarity.overall));

    return (
      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
        <div className="flex items-start gap-3">
          {/* Skip indicator instead of checkbox */}
          <div className="flex-shrink-0 mt-1">
            <div className="w-6 h-6 bg-red-100 border-2 border-red-300 rounded flex items-center justify-center">
              <span className="text-red-600 text-sm font-bold">✕</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 flex-1">
            <div className="mb-3">
              <div className="text-sm font-medium text-red-800 mb-2">
                📥 Imported Grant ({maxSimilarity}% similarity)
              </div>
              <div className="border border-blue-200 rounded-lg p-3 bg-white">
                <div className="text-sm space-y-1">
                  <div>
                    <strong>Title:</strong> {grantItem.grant.title}
                  </div>
                  <div>
                    <strong>Agency:</strong> {grantItem.grant.agency || grantItem.grant.sponsor || "N/A"}
                  </div>
                  <div>
                    <strong>Year:</strong> {normalizeYear(grantItem.grant.year || grantItem.grant.dates) || "N/A"}
                  </div>
                  <div>
                    <strong>Amount:</strong> {grantItem.grant.amount || "N/A"}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-green-700">Existing Grant</div>
              {duplicates.map((duplicate, idx) => (
                <div key={idx} className="border border-green-200 rounded-lg p-3 bg-white">
                  <div className="text-sm space-y-1 text-gray-700">
                    <div>
                      <strong>Title:</strong> {duplicate.existingGrant.title}
                    </div>
                    <div>
                      <strong>Agency:</strong>{" "}
                      {duplicate.existingGrant.agency || duplicate.existingGrant.sponsor || "N/A"}
                    </div>
                    <div>
                      <strong>Year:</strong>{" "}
                      {normalizeYear(duplicate.existingGrant.year || duplicate.existingGrant.dates) || "N/A"}
                    </div>
                    <div>
                      <strong>Amount:</strong> {duplicate.existingGrant.amount || "N/A"}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* <div className="text-xs text-red-700 col-span-2 bg-red-100 p-2 rounded border">
              ⚠️ <strong>Automatic Skip:</strong> This imported grant appears to be a duplicate of your existing grant. We'll skip importing this one and keep your existing entry unchanged.
            </div> */}
          </div>
        </div>
      </div>
    );
  };

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
      const dateA = a.dates || "";
      const dateB = b.dates || "";

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
        const startDate = dateStr.split("-")[0].trim();

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

        // Filter RISE data: entries with Canadian funding agencies go to external
        const canadianFundingFromRise = processedRiseData.filter((item) => {
          const hasCanadianAgency = isCanadianFundingAgency(item);
          return hasCanadianAgency;
        });

        const pureRiseData = processedRiseData.filter((item) => !isCanadianFundingAgency(item));

        // Combine external data with Canadian funding from RISE
        const combinedExternalData = [...processedExternalData, ...canadianFundingFromRise];

        // console.log("External data (including Canadian from RISE):", combinedExternalData.length);
        // console.log("Pure RISE data:", pureRiseData.length);
        // console.log("Canadian funding moved from RISE to external:", canadianFundingFromRise.length);

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
      data.year = data.dates.split("-")[0];
      delete data.dates;
      delete data.dates_0;
      delete data.dates_1;
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
        } else if (
          sponsor.includes("cfi") ||
          sponsor.includes("canada foundation for innovation") ||
          sponsor.includes("canadian foundation for innovation")
        ) {
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
            {/* Workflow Information Section */}
            <div className="mb-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 text-lg">ℹ️</span>
                  <div className="text-sm text-blue-800 leading-relaxed">
                    <div className="font-medium mb-1">Import Process:</div>
                    <ul className="space-y-1 text-xs">
                      <li>
                        • <strong>Step 1:</strong> Review potential duplicates below - these will be automatically
                        skipped to preserve your existing entries
                      </li>
                      <li>
                        • <strong>Step 2:</strong> Select which new grants you want to add from the remaining imports
                      </li>
                      <li>• Only selected new grants will be added to your CV - no existing data will be modified</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

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
                      </div>

                      {/* Potential Duplicates Section - Step 1 */}
                      {duplicateGrants.length > 0 ? (
                        <div className="border border-red-300 rounded-lg">
                          <div className="p-3 flex items-center justify-between bg-red-50 rounded-t-lg">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setDuplicatesExpanded(!duplicatesExpanded)}
                                className="flex items-center gap-2 hover:bg-red-100 p-1 rounded transition-colors"
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
                              <span className="font-medium text-red-800">
                                Step 1: Potential Duplicates - Will Be Skipped ({duplicateGrants.length})
                              </span>
                            </div>
                          </div>

                          <div className="px-3 pb-2 bg-red-50 border-b border-red-200">
                            <p className="text-sm font-medium text-red-700">
                              ✋ <strong>These grants will NOT be imported</strong> because they appear to match
                              existing entries in your CV. Your existing grants will remain unchanged and the duplicates
                              will be skipped automatically.
                            </p>
                          </div>

                          {duplicatesExpanded && (
                            <div className="p-4 space-y-4">
                              {duplicateGrants.map((grantItem, index) => (
                                <GrantWithDuplicates
                                  key={`duplicate-${index}`}
                                  grantItem={grantItem}
                                  duplicates={grantItem.duplicates}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="border border-green-200 rounded-lg bg-green-50 p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-green-600 text-xl">✅</span>
                            <div>
                              <div className="font-medium text-green-800">Step 1: No Duplicates Found</div>
                              <div className="text-sm text-green-700">
                                All imported grants appear to be new entries that don't match your existing CV data.
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* New Grants Section - Step 2 */}
                      {newGrants.length > 0 ? (
                        <div className="border border-green-200 rounded-lg">
                          <div className="p-3 flex items-center justify-between bg-green-50 rounded-t-lg">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setNewGrantsExpanded(!newGrantsExpanded)}
                                className="flex items-center gap-2 hover:bg-green-100 p-1 rounded transition-colors"
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
                              <span className="font-medium text-green-700">
                                Step 2: New Grants Available for Import ({newGrants.length})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {(() => {
                                const selectedNewGrants = newGrants.filter((item) =>
                                  selectedSecureFundingData.includes(item.grant)
                                );

                                return (
                                  <>
                                    <button
                                      className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition"
                                      onClick={() => {
                                        const newGrantsOnly = newGrants.map((item) => item.grant);
                                        if (selectedNewGrants.length === newGrants.length) {
                                          // Deselect all new grants
                                          setSelectedSecureFundingData((prev) =>
                                            prev.filter((item) => !newGrantsOnly.includes(item))
                                          );
                                        } else {
                                          // Select all new grants
                                          setSelectedSecureFundingData((prev) => {
                                            const filtered = prev.filter((item) => !newGrantsOnly.includes(item));
                                            return [...filtered, ...newGrantsOnly];
                                          });
                                        }
                                      }}
                                      disabled={newGrants.length === 0}
                                    >
                                      {selectedNewGrants.length === newGrants.length
                                        ? "Deselect All New"
                                        : "Select All New"}
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-success px-6 py-2 text-white rounded-lg shadow hover:shadow-md transition"
                                      onClick={addSecureFundingData}
                                      disabled={addingData || selectedSecureFundingData.length === 0}
                                    >
                                      {addingData
                                        ? "Adding grants data..."
                                        : `Add ${selectedSecureFundingData.length} Grant${
                                            selectedSecureFundingData.length !== 1 ? "s" : ""
                                          }`}
                                    </button>
                                  </>
                                );
                              })()}
                            </div>
                          </div>

                          <div className="pb-2 px-3 bg-green-50 border-b border-green-100">
                            <p className="text-sm text-green-600">
                              ✅ <strong>Select which grants to add:</strong> These are new grants from{" "}
                              {selectedSource === "rise" ? "RISE" : "external sources"} that don't match your existing
                              entries.
                            </p>
                          </div>

                          {newGrantsExpanded && (
                            <div className="p-4 space-y-2">
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
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 text-xl">📋</span>
                            <div>
                              <div className="font-medium text-gray-800">Step 2: No New Grants to Import</div>
                              <div className="text-sm text-gray-600">
                                {duplicateGrants.length > 0
                                  ? "All imported grants appear to be duplicates of your existing entries."
                                  : "No grants were found that can be imported."}
                              </div>
                            </div>
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
