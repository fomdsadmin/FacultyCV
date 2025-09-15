import React, { useState, useEffect } from "react";
import "../CustomStyles/scrollbar.css";
import "../CustomStyles/modal.css";
import {
  addUserCVData,
  getPublicationMatches,
  getUserCVData,
  getAllSections,
  getStagingScopusPublications,
} from "../graphql/graphqlHelpers";
import { useNavigate } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";
import PublicationsSelectModal from "./PublicationsSelectModal";

const PublicationsModal = ({ user, section, onClose, setRetrievingData, fetchData, existingPublications }) => {
  const [allFetchedPublications, setAllFetchedPublications] = useState([]);
  const [totalResults, setTotalResults] = useState("TBD");
  const [currentPage, setCurrentPage] = useState(0);
  const [fetchingData, setFetchingData] = useState(true);
  const [addingData, setAddingData] = useState(false);
  const [initialRender, setInitialRender] = useState(true);
  const [currentScopusId, setCurrentScopusId] = useState("");
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [selectedPublications, setSelectedPublications] = useState(new Set());
  const [matchedPublications, setMatchedPublications] = useState([]);

  const [count, setCount] = useState(1); // Initialize count in state
  const [fetchStage, setFetchStage] = useState(""); // "scopus", "add"

  const navigate = useNavigate();
  let baseUrl = process.env.REACT_APP_BATCH_API_BASE_URL || "";
  // omit the last '/' from baseUrl
  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }

  async function fetchPublicationsData() {
    setInitialRender(false);
    setFetchingData(true);

    try {
      // Fetch publications from staging table instead of Scopus API
      console.log("Fetching publications from staging table for user:", user.user_id);

      const stagingResponse = await getStagingScopusPublications(user.user_id);

      if (stagingResponse && stagingResponse.publications) {
        // Extract the data_details from each staging publication
        // Parse data_details if it comes as a JSON string
        const publications = stagingResponse.publications.map((pub) => {
          let dataDetails = pub.data_details;
          if (typeof dataDetails === 'string') {
            try {
              dataDetails = JSON.parse(dataDetails);
            } catch (error) {
              console.error("Error parsing data_details:", error);
              dataDetails = {};
            }
          }
          return dataDetails;
        });
        console.log(`Retrieved ${publications.length} publications from staging table`);
        console.log("Sample publication data:", publications[0]); // Debug log

        setAllFetchedPublications(publications);
        setTotalResults(publications.length);

        // Fetch existing user publications for comparison
        let parsedExisting = [];
        try {
          const existingData = await getUserCVData(user.user_id, section.data_section_id);
          parsedExisting = existingData.map((data) => ({
            ...data,
            data_details: JSON.parse(data.data_details),
          }));
        } catch (error) {
          console.error("Error fetching existing publications:", error);
        }

        // Find matched publications if there are existing ones
        let matches = [];
        if (parsedExisting.length > 0 && publications.length > 0) {
          console.log("Starting to find matches...");
          console.log("Sample fetched publication:", publications[0]);
          console.log("Sample existing publication:", parsedExisting[0]);
          matches = findPublicationMatches(publications, parsedExisting);
          console.log("Final matches found:", matches.length);
        } else {
          console.log("No matching performed:", { 
            existingCount: parsedExisting.length, 
            fetchedCount: publications.length 
          });
        }

        setMatchedPublications(matches);
        setFetchingData(false);
        setShowSelectionModal(true);
      } else {
        console.warn("No publications found in staging table");
        setAllFetchedPublications([]);
        setTotalResults(0);
        setFetchingData(false);
        setShowSelectionModal(true);
      }
    } catch (error) {
      console.error("Error fetching publications from staging table:", error);
      setAllFetchedPublications([]);
      setTotalResults(0);
      setFetchingData(false);
      setShowSelectionModal(true);
    }
  }

  // Helper function to find matches between fetched and existing publications
  const findPublicationMatches = (publications, parsedExisting) => {
    console.log(
      "Finding matches between",
      publications.length,
      "fetched and",
      parsedExisting.length,
      "existing publications"
    );

    const matches = [];
    const usedExistingIds = new Set();

    // STEP 1: DOI-based matching (more precise)
    console.log("=== STEP 1: DOI-based matching ===");

    // Extract DOIs from existing publications' citation fields
    const existingDOIs = new Map(); // Map DOI -> Set of existing publications
    parsedExisting.forEach((existingPub, index) => {
      const allDOIs = new Set(); // Collect all DOIs for this publication

      // Extract DOIs from citation
      const extractedDOIs = extractDOIsFromCitation(existingPub.data_details.citation || "");
      extractedDOIs.forEach((doi) => allDOIs.add(doi));

      // Also check if there's a direct DOI field
      if (existingPub.data_details.doi) {
        const normalizedDOI = normalizeDOI(existingPub.data_details.doi);
        if (normalizedDOI) {
          allDOIs.add(normalizedDOI);
        }
      }

      // Add this publication to all its DOIs
      allDOIs.forEach((doi) => {
        if (!existingDOIs.has(doi)) {
          existingDOIs.set(doi, new Set());
        }
        existingDOIs.get(doi).add(existingPub);
      });
    });
    
    console.log(`Found ${existingDOIs.size} unique DOIs in existing publications:`, Array.from(existingDOIs.keys()).slice(0, 5));

    // Match publications by DOI
    let matchedFetchedIndices = new Set();
    publications.forEach((fetchedPub, fetchedIndex) => {
      if (fetchedPub.doi) {
        const normalizedScopusDOI = normalizeDOI(fetchedPub.doi);
        console.log(`Checking Scopus DOI: ${fetchedPub.doi} -> normalized: ${normalizedScopusDOI}`);

        if (normalizedScopusDOI && existingDOIs.has(normalizedScopusDOI)) {
          const matchedExistingPubsSet = existingDOIs.get(normalizedScopusDOI);
          const matchedExistingPubs = Array.from(matchedExistingPubsSet);

          matches.push({
            fetchedPublication: { ...fetchedPub, originalIndex: fetchedIndex },
            existingPublications: matchedExistingPubs,
            primaryExistingPublication: matchedExistingPubs[0],
            existingPublication: matchedExistingPubs[0],
            matchType: "doi",
            similarity: 1.0,
            isMultiMatch: matchedExistingPubs.length > 1,
            matchIndex: 0,
            doi: normalizedScopusDOI,
          });

          matchedExistingPubs.forEach((existingPub) => {
            usedExistingIds.add(existingPub.user_cv_data_id);
          });
          matchedFetchedIndices.add(fetchedIndex);
        }
      }
    });

    // STEP 2: Title-based matching for remaining publications
    console.log("=== STEP 2: Title-based matching ===");

    const remainingFetchedPublications = [];
    publications.forEach((pub, index) => {
      if (!matchedFetchedIndices.has(index)) {
        remainingFetchedPublications.push({ ...pub, originalIndex: index });
      }
    });

    const remainingExistingPublications = parsedExisting.filter(
      (existingPub) => !usedExistingIds.has(existingPub.user_cv_data_id)
    );

    remainingFetchedPublications.forEach((fetchedPub) => {
      const fetchedIndex = fetchedPub.originalIndex;
      const allMatches = [];
      
      console.log(`Checking title matches for: "${fetchedPub.title?.substring(0, 50)}..."`);

      remainingExistingPublications.forEach((existingPub) => {
        if (usedExistingIds.has(existingPub.user_cv_data_id)) {
          return;
        }

        if (fetchedPub.title && existingPub.data_details.title) {
          const similarity = calculateTitleSimilarity(fetchedPub.title, existingPub.data_details.title);

          if (similarity > 0.8) {
            allMatches.push({
              existingPublication: existingPub,
              similarity: similarity,
            });
          }
        }
      });

      if (allMatches.length > 0) {
        allMatches.sort((a, b) => b.similarity - a.similarity);
        const maxSimilarity = Math.max(...allMatches.map((m) => m.similarity));

        matches.push({
          fetchedPublication: { ...fetchedPub, originalIndex: fetchedIndex },
          existingPublications: allMatches.map((m) => m.existingPublication),
          primaryExistingPublication: allMatches[0].existingPublication,
          existingPublication: allMatches[0].existingPublication,
          matchType: "title",
          similarity: maxSimilarity,
          isMultiMatch: allMatches.length > 1,
          matchIndex: 0,
          allSimilarities: allMatches.map((m) => m.similarity),
        });

        allMatches.forEach((match) => {
          usedExistingIds.add(match.existingPublication.user_cv_data_id);
        });
        matchedFetchedIndices.add(fetchedIndex);
      }
    });

    console.log("Total matches found:", matches.length);
    return matches;
  };

  // Helper function to calculate title similarity
  const calculateTitleSimilarity = (title1, title2) => {
    if (!title1 || !title2) return 0;

    // Normalize titles: remove extra spaces, convert to lowercase, remove common punctuation
    const normalize = (title) => {
      return title
        .toLowerCase()
        .replace(/[^\w\s]/g, "") // Remove punctuation
        .replace(/\s+/g, " ") // Replace multiple spaces with single space
        .trim();
    };

    const normalizedTitle1 = normalize(title1);
    const normalizedTitle2 = normalize(title2);

    // Check for exact match after normalization
    if (normalizedTitle1 === normalizedTitle2) {
      return 1.0; // 100% match
    }

    // Calculate similarity using Levenshtein distance
    return calculateStringSimilarity(normalizedTitle1, normalizedTitle2);
  };

  // Helper function to calculate string similarity (simple Levenshtein-based)
  const calculateStringSimilarity = (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  };

  // Levenshtein distance calculation
  const levenshteinDistance = (str1, str2) => {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
        }
      }
    }

    return matrix[str2.length][str1.length];
  };

  // Helper function to extract DOIs from citation text
  const extractDOIsFromCitation = (citation) => {
    if (!citation) return [];

    const dois = new Set();
    const doiPatterns = [
      /https?:\/\/(?:dx\.)?doi\.org\/(10\.\d+\/[^\s,;)]+(?:\.[^\s,;)]*)*)/gi,
      /(?:dx\.)?doi\.org\/(10\.\d+\/[^\s,;)]+(?:\.[^\s,;)]*)*)/gi,
      /doi:\s*(10\.\d+\/[^\s,;)\]]+(?:\.[^\s,;)\]]*)*)/gi,
      /DOI:\s*(10\.\d+\/[^\s,;)\]]+(?:\.[^\s,;)\]]*)*)/gi,
    ];

    doiPatterns.forEach((pattern) => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(citation)) !== null) {
        const normalizedDOI = normalizeDOI(match[1]);
        if (normalizedDOI && isValidDOI(normalizedDOI)) {
          dois.add(normalizedDOI);
        }
      }
    });

    return Array.from(dois);
  };

  // Helper function to validate if a string is a proper DOI
  const isValidDOI = (doi) => {
    if (!doi) return false;
    if (!doi.match(/^10\.\d{4,}\/\S+/)) return false;
    if (doi.match(/^10\.\d{4}\/\d{4}$/)) return false; // Reject year patterns
    if (doi.length < 10) return false;
    return true;
  };

  // Helper function to normalize DOI format
  const normalizeDOI = (doi) => {
    if (!doi) return null;

    let normalized = String(doi)
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/^(dx\.)?doi\.org\//i, "")
      .replace(/^doi:\s*/i, "")
      .replace(/[,;.\s)\]]+$/, "")
      .replace(/^\(+/, "")
      .replace(/^\[+/, "")
      .trim();

    if (normalized.match(/^10\.\d+\/.+/) && isValidDOI(normalized)) {
      return normalized;
    }

    return null;
  };

  async function addPublicationsData(publications) {
    setAddingData(true);
    setCount(1);

    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      if (!idToken) throw new Error("Auth Error: No ID token found.");

      let dataSections = [];
      dataSections = await getAllSections();
      const publicationsSectionId = dataSections.find((section) =>
        section.title.includes("Journal Publication")
      ).data_section_id;

      // Add "Type: Journal" to each publication
      publications = publications.map((pub) => {
        return {
          ...pub,
          publication_type: "Journal", // Assuming all fetched publications are journal articles
        };
      });
      const payload = {
        arguments: {
          data_details_list: publications,
          user_id: user.user_id,
          data_section_id: publicationsSectionId,
          data_section_title: "Publications",
          editable: "false",
        },
      };

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
        console.log("Added ", payload.arguments.data_details_list.length, " Publications Successfully | 200 OK");
      }
    } catch (error) {
      console.error("Error adding publications:", error);
    }
    console.log("Saved ", publications.length, " publications successfully");
    setAddingData(false);
    setShowSelectionModal(false);
    fetchData();
    onClose();
  }

  const handleSelectPublication = (index) => {
    const newSelected = new Set(selectedPublications);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedPublications(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPublications.size === allFetchedPublications.length) {
      setSelectedPublications(new Set());
    } else {
      setSelectedPublications(new Set(allFetchedPublications.map((_, index) => index)));
    }
  };

  const handleAddSelected = async () => {
    const publicationsToAdd = allFetchedPublications.filter((_, index) => selectedPublications.has(index));
    if (publicationsToAdd.length > 0) {
      await addPublicationsData(publicationsToAdd);
    }
  };

  // Helper function to parse publication year and month from various date formats
  const getPublicationDateInfo = (publication) => {
    // Try multiple possible date fields
    const possibleDateFields = [
      publication.end_date,
      publication.publication_date,
      publication.date,
      publication.year,
      publication.start_date,
    ];

    for (const dateStr of possibleDateFields) {
      if (dateStr) {
        const result = extractDateFromString(dateStr);
        if (result.year !== null) {
          return result;
        }
      }
    }

    return { year: null, month: 0 };
  };

  const extractDateFromString = (dateStr) => {
    if (!dateStr) return { year: null, month: 0 };

    const str = String(dateStr).toLowerCase().trim();

    // Handle pure year numbers (like 2025, 2024)
    if (/^\d{4}$/.test(str)) {
      const year = parseInt(str);
      if (year >= 1900 && year <= 2100) {
        return { year, month: 0 };
      }
    }

    // Extract year from various patterns
    const yearMatch = str.match(/\b(20\d{2}|19\d{2})\b/);
    const year = yearMatch ? parseInt(yearMatch[1]) : null;

    // Extract month
    const monthNames = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];

    const monthAbbr = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

    let month = 0;

    // Check for full month names
    for (let i = 0; i < monthNames.length; i++) {
      if (str.includes(monthNames[i])) {
        month = i + 1; // 1-based month
        break;
      }
    }

    // Check for abbreviated month names if no full name found
    if (month === 0) {
      for (let i = 0; i < monthAbbr.length; i++) {
        if (str.includes(monthAbbr[i])) {
          month = i + 1; // 1-based month
          break;
        }
      }
    }

    // If no month name found, check for numeric month patterns
    if (month === 0) {
      // Pattern: YYYY-MM, MM/YYYY, MM-YYYY, YYYY/MM
      const numericPatterns = [
        /\b(?:20\d{2}|19\d{2})[-\/](\d{1,2})\b/, // YYYY-MM or YYYY/MM
        /\b(\d{1,2})[-\/](?:20\d{2}|19\d{2})\b/, // MM-YYYY or MM/YYYY
      ];

      for (const pattern of numericPatterns) {
        const match = str.match(pattern);
        if (match) {
          const monthNum = parseInt(match[1]);
          if (monthNum >= 1 && monthNum <= 12) {
            month = monthNum;
            break;
          }
        }
      }
    }

    return { year, month };
  };

  const navigateHome = () => {
    navigate("/");
  };

  // Add this inside PublicationsModal, before the return statement
  const IdCard = ({ label, value, color, link }) => (
    <div className="bg-gray-50 rounded-lg p-4 border" style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <div className={`text-sm font-bold`} style={{ color }}>
          {label}
        </div>
        <div className="flex items-center">
          {value ? (
            <>
              <span className="font-mono font-medium text-base">{value}</span>
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-500 hover:text-blue-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                </a>
              )}
            </>
          ) : (
            <span className="text-gray-400 italic">Not linked</span>
          )}
        </div>
      </div>
    </div>
  );

  // Update the dialog element styling
  return (
    <>
      <dialog
        className="fixed inset-0 flex items-center justify-center p-0 m-0 w-screen h-screen bg-black bg-opacity-40"
        open
      >
        <div className="modal-box relative max-w-lg w-full bg-white p-6 rounded-lg shadow-xl mx-auto">
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
            user.scopus_id !== "" ? (
              <div className="flex flex-col items-center justify-center w-full mt-5 mb-5">
                <div className="text-center mb-6 w-full">
                  <h3 className="text-lg font-medium mb-8">
                    Publications will be retrieved from staging table for this profile:
                  </h3>
                  <div className="grid grid-cols-1 gap-4 w-full max-w-md mx-auto">
                    <IdCard
                      label="Scopus ID"
                      value={user.scopus_id}
                      color="#ea580c"
                      link={
                        user.scopus_id
                          ? `https://www.scopus.com/authid/detail.uri?authorId=${user.scopus_id}`
                          : undefined
                      }
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary text-white px-6 py-2"
                  onClick={() => fetchPublicationsData()}
                >
                  Retrieve Publications
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full mt-5 mb-5">
                <div className="block text-m mb-1 mt-6 mr-5 ml-5 text-zinc-600 text-center">
                  Please enter your Scopus ID in the Profile section to fetch publications.
                </div>
                <button type="button" className="btn btn-secondary text-white mt-6 " onClick={() => navigateHome()}>
                  Go to Profile Section
                </button>
              </div>
            )
          ) : fetchingData ? (
            <div className="flex flex-col items-center justify-center w-full mt-5 mb-5">
              <div className="block text-lg font-bold mb-2 mt-6 text-zinc-600">
                Retrieving publications from staging table...
              </div>
            </div>
          ) : null}
        </div>
      </dialog>

      {showSelectionModal && (
        <PublicationsSelectModal
          allFetchedPublications={allFetchedPublications}
          existingPublications={existingPublications}
          matchedPublications={matchedPublications}
          selectedPublications={selectedPublications}
          addingData={addingData}
          getPublicationDateInfo={getPublicationDateInfo}
          handleSelectPublication={handleSelectPublication}
          handleSelectAll={handleSelectAll}
          handleAddSelected={handleAddSelected}
          setShowSelectionModal={setShowSelectionModal}
          extractDOIsFromCitation={extractDOIsFromCitation}
        />
      )}
    </>
  );
};

export default PublicationsModal;
