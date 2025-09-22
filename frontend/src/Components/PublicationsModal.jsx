import React, { useState, useEffect } from "react";
import "../CustomStyles/scrollbar.css";
import "../CustomStyles/modal.css";
import {
  getUserCVData,
  getAllSections,
  getStagingScopusPublications,
  updateStagingScopusPublications,
  updateUserCVDataArchive,
} from "../graphql/graphqlHelpers";
import { useNavigate } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";
import PublicationsSelectModal from "./PublicationsSelectModal";
import {
  hasBeenMergedFromScopus,
  calculateTitleSimilarity,
  calculateStringSimilarity,
  calculateAuthorSimilarity,
  extractDOIsFromCitation,
  normalizeDOI,
} from "utils/publicationsMergeUtils";

const PublicationsModal = ({ user, section, onClose, setRetrievingData, fetchData, existingPublications }) => {
  const [newStagingPublications, setNewStagingPublications] = useState([]);
  const [totalResults, setTotalResults] = useState("TBD");
  const [fetchingData, setFetchingData] = useState(true);
  const [addingData, setAddingData] = useState(false);
  const [initialRender, setInitialRender] = useState(true);

  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [selectedPublications, setSelectedPublications] = useState(new Set());
  const [matchedPublications, setMatchedPublications] = useState([]);
  const [allExistingPublications, setAllExistingPublications] = useState([]); // Combined journal + other publications

  const [count, setCount] = useState(1); // Initialize count in state

  const navigate = useNavigate();
  let baseUrl = process.env.REACT_APP_BATCH_API_BASE_URL || "";
  // omit the last '/' from baseUrl
  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }

  async function fetchPublicationsData() {
    setInitialRender(false);
    setFetchingData(true);

    // Fetch publications from staging table instead of Scopus API
    try {
      console.log("Fetching publications from staging table for user:", user.first_name + " " + user.last_name);
      const stagingResponse = await getStagingScopusPublications(user.user_id);

      if (stagingResponse && stagingResponse.publications) {
        // Extract the data_details from each staging publication
        let newStagingPublications = [];
        stagingResponse.publications.forEach((pub, index) => {
          if (pub.is_new) {
            let dataDetails = {};
            if (typeof pub.data_details === "string") {
              try {
                dataDetails = JSON.parse(pub.data_details);
              } catch (error) {
                console.error("Error parsing data_details:", error);
                dataDetails = {};
              }
            } else {
              dataDetails = pub.data_details || {};
            }
            // Add staging metadata to track which publications were saved
            newStagingPublications.push({
              ...dataDetails,
              _staging_id: pub.id, // Preserve staging table ID
              _staging_is_new: pub.is_new,
              originalIndex: index, // Add original index for tracking
            });
          }
        });

        console.log(`Retrieved ${newStagingPublications.length} publications from staging table`);

        setNewStagingPublications(newStagingPublications);
        setTotalResults(newStagingPublications.length);

        // Fetch existing user publications for comparison
        let parsedExistingJournalPublications = [];
        try {
          // journal publications section
          const existingData = await getUserCVData(user.user_id, section.data_section_id);
          parsedExistingJournalPublications = existingData.map((data) => ({
            ...data,
            data_details: JSON.parse(data.data_details),
            section_type: "Journal Publications", // Add section type for identification
          }));
          console.log("Total Existing Journal publications: ", parsedExistingJournalPublications.length);
        } catch (error) {
          console.error("Error fetching existing publications:", error);
        }

        // Find matched publications
        let matches = [];
        if (parsedExistingJournalPublications.length > 0 && newStagingPublications.length > 0) {
          matches = findPublicationMatches(newStagingPublications, parsedExistingJournalPublications);
        } else {
          console.log("No matching performed:", {
            existingCount: parsedExistingJournalPublications.length,
            fetchedCount: newStagingPublications.length,
          });
        }

        console.log(matches);
        setMatchedPublications(matches);
        // Set the combined list for the modal
        setAllExistingPublications(parsedExistingJournalPublications);
        // Pass COMBINED list (journal + other) to the selection modal so it can properly identify "Other Publications"
        setFetchingData(false);
        setShowSelectionModal(true);
      } else {
        console.warn("No publications found in staging table");
        setNewStagingPublications([]);
        setTotalResults(0);
        setFetchingData(false);
        setShowSelectionModal(true);
      }
    } catch (error) {
      console.error("Error fetching publications from staging table:", error);
      setNewStagingPublications([]);
      setTotalResults(0);
      setFetchingData(false);
      setShowSelectionModal(true);
    }
  }

  // Helper function to find matches between fetched and existing publications
  const findPublicationMatches = (publications, parsedExisting) => {
    const matches = [];
    const usedExistingIds = new Set();

    // Filter out existing publications that have already been merged from Scopus
    const existingToMatch = parsedExisting.filter((existingPub) => {
      const alreadyMerged = hasBeenMergedFromScopus(existingPub);
      return !alreadyMerged;
    });

    console.log(
      `Filtering: ${parsedExisting.length} existing publications -> ${existingToMatch.length} to match (${
        parsedExisting.length - existingToMatch.length
      } already merged from Scopus)`
    );

    // STEP 1: DOI-based matching (more precise)
    // Extract DOIs from existing publications' citation fields
    const existingDOIs = new Map(); // Map DOI -> Set of existing publications
    existingToMatch.forEach((existingPub, index) => {
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

    // Match publications by DOI
    let matchedFetchedIndices = new Set();
    publications.forEach((fetchedPub, fetchedIndex) => {
      if (fetchedPub.doi) {
        const normalizedScopusDOI = normalizeDOI(fetchedPub.doi);
        let matchFound = false;

        // First try exact match
        if (normalizedScopusDOI && existingDOIs.has(normalizedScopusDOI)) {
          const matchedExistingPubsSet = existingDOIs.get(normalizedScopusDOI);
          const matchedExistingPubs = Array.from(matchedExistingPubsSet);

          // Verify with author similarity for additional confidence
          const authorSimilarity =
            matchedExistingPubs.length > 0
              ? calculateAuthorSimilarity(fetchedPub, matchedExistingPubs[0].data_details)
              : 0;
          matches.push({
            fetchedPublication: { ...fetchedPub, originalIndex: fetchedIndex },
            existingPublications: matchedExistingPubs,
            primaryExistingPublication: matchedExistingPubs[0],
            existingPublication: matchedExistingPubs[0],
            matchType: "doi",
            similarity: 1.0,
            authorSimilarity: authorSimilarity,
            isMultiMatch: matchedExistingPubs.length > 1,
            matchIndex: 0,
            doi: normalizedScopusDOI,
          });

          matchedExistingPubs.forEach((existingPub) => {
            usedExistingIds.add(existingPub.user_cv_data_id);
          });
          matchedFetchedIndices.add(fetchedIndex);
          matchFound = true;
        }

        // If no exact match, try fuzzy matching for minor differences
        if (!matchFound && normalizedScopusDOI) {
          const existingDOIsList = Array.from(existingDOIs.keys());
          let bestMatch = null;
          let bestSimilarity = 0;
          let bestAuthorSimilarity = 0;
          let bestExistingPubs = null;

          existingDOIsList.forEach((existingDOI) => {
            const doiSimilarity = calculateStringSimilarity(normalizedScopusDOI, existingDOI);
            // For fuzzy DOI matches, also check author similarity
            const existingPubsSet = existingDOIs.get(existingDOI);
            const existingPubs = Array.from(existingPubsSet);
            const authorSimilarity =
              existingPubs.length > 0 ? calculateAuthorSimilarity(fetchedPub, existingPubs[0].data_details) : 0;

            // Combined score: DOI similarity (70%) + Author similarity (30%)
            const combinedScore = doiSimilarity * 0.7 + authorSimilarity * 0.3;
            // Accept if combined score is good OR if DOI similarity is very high
            if (
              (doiSimilarity > 0.9 && doiSimilarity > bestSimilarity) ||
              combinedScore > bestSimilarity &&
              combinedScore > 0.75
            ) {
              bestMatch = existingDOI;
              bestSimilarity = combinedScore;
              bestAuthorSimilarity = authorSimilarity;
              bestExistingPubs = existingPubs;
            }
          });

          if (bestMatch && bestExistingPubs) {
            matches.push({
              fetchedPublication: { ...fetchedPub, originalIndex: fetchedIndex },
              existingPublications: bestExistingPubs,
              primaryExistingPublication: bestExistingPubs[0],
              existingPublication: bestExistingPubs[0],
              matchType: "doi",
              similarity: 1.0,
              doiSimilarity: calculateStringSimilarity(normalizedScopusDOI, bestMatch),
              authorSimilarity: bestAuthorSimilarity,
              combinedScore: bestSimilarity,
              isMultiMatch: bestExistingPubs.length > 1,
              matchIndex: 0,
              doi: normalizedScopusDOI,
              matchedDoi: bestMatch,
            });

            bestExistingPubs.forEach((existingPub) => {
              usedExistingIds.add(existingPub.user_cv_data_id);
            });
            matchedFetchedIndices.add(fetchedIndex);
            matchFound = true;
          }
        }
      }
    });

    // STEP 2: Title-based matching for remaining publications
    // console.log("=== STEP 2: Title-based matching ===");

    const remainingFetchedPublications = [];
    publications.forEach((pub, index) => {
      if (!matchedFetchedIndices.has(index)) {
        remainingFetchedPublications.push({ ...pub, originalIndex: index });
      }
    });

    const remainingExistingPublications = existingToMatch.filter(
      (existingPub) => !usedExistingIds.has(existingPub.user_cv_data_id)
    );

    remainingFetchedPublications.forEach((fetchedPub) => {
      const fetchedIndex = fetchedPub.originalIndex;
      const allMatches = [];
      remainingExistingPublications.forEach((existingPub) => {
        if (usedExistingIds.has(existingPub.user_cv_data_id)) {
          return;
        }

        if (fetchedPub.title && existingPub.data_details.title) {
          const titleSimilarity = calculateTitleSimilarity(fetchedPub.title, existingPub.data_details.title);
          const authorSimilarity = calculateAuthorSimilarity(fetchedPub, existingPub.data_details);

          // Combined score: weighted average of title and author similarity
          // Title gets 75% weight, author gets 25% weight
          const combinedScore = titleSimilarity * 0.8 + authorSimilarity * 0.2;

          // Accept match if combined score is above threshold OR if title similarity is very high
          if (titleSimilarity > 0.95 || combinedScore > 0.9) {
            allMatches.push({
              existingPublication: existingPub,
              similarity: titleSimilarity,
              authorSimilarity: authorSimilarity,
              combinedScore: combinedScore,
            });
          }
        }
      });

      if (allMatches.length > 0) {
        // Sort by combined score (considering both title and author similarity)
        allMatches.sort((a, b) => (b.combinedScore || b.similarity) - (a.combinedScore || a.similarity));
        const maxSimilarity = Math.max(...allMatches.map((m) => m.similarity));
        const maxCombinedScore = Math.max(...allMatches.map((m) => m.combinedScore || m.similarity));

        matches.push({
          fetchedPublication: { ...fetchedPub, originalIndex: fetchedIndex },
          existingPublications: allMatches.map((m) => m.existingPublication),
          primaryExistingPublication: allMatches[0].existingPublication,
          existingPublication: allMatches[0].existingPublication,
          matchType: "title",
          similarity: maxSimilarity,
          authorSimilarity: allMatches[0].authorSimilarity,
          combinedScore: maxCombinedScore,
          isMultiMatch: allMatches.length > 1,
          matchIndex: 0,
          allSimilarities: allMatches.map((m) => m.similarity),
          allAuthorSimilarities: allMatches.map((m) => m.authorSimilarity),
          allCombinedScores: allMatches.map((m) => m.combinedScore),
        });

        allMatches.forEach((match) => {
          usedExistingIds.add(match.existingPublication.user_cv_data_id);
        });
        matchedFetchedIndices.add(fetchedIndex);
      }
    });

    console.log("=== ENHANCED TITLE + AUTHOR MATCHING SUMMARY ===");
    console.log(`Total matches found: ${matches.length}`);
    return matches;
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

      // Extract staging IDs only from publications that have them (i.e., from Scopus)
      const stagingIds = publications
        .filter((pub) => pub._staging_id) // Only publications with staging IDs
        .map((pub) => pub._staging_id);

      console.log(
        `Found ${stagingIds.length} staging publications to mark as processed out of ${publications.length} total publications`
      );

      // Add "Type: Journal" to each publication and clean staging metadata
      const cleanedPublications = publications.map((pub) => {
        // Remove staging metadata before saving to CV
        const { _staging_id, _staging_is_new, originalIndex, ...cleanPub } = pub;
        return {
          ...cleanPub,
          publication_type: "Journal", // Assuming all fetched publications are journal articles
        };
      });

      const payload = {
        arguments: {
          data_details_list: cleanedPublications,
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

      // Update staging table to mark publications as processed (is_new = false)
      // Only update if we have staging IDs (i.e., publications from Scopus)
      if (stagingIds.length > 0) {
        try {
          // Ensure all IDs are strings
          const stringIds = stagingIds.map((id) => String(id));
          const updateResult = await updateStagingScopusPublications(stringIds, false);
          console.log("Staging publications updated:", updateResult);
        } catch (updateError) {
          console.error("Error updating staging publications:", updateError);
          // Don't fail the entire operation if staging update fails
        }
      } else {
        console.log("No staging publications to update (all selected publications were existing duplicates)");
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
    if (selectedPublications.size === newStagingPublications.length) {
      setSelectedPublications(new Set());
    } else {
      setSelectedPublications(new Set(newStagingPublications.map((_, index) => index)));
    }
  };

  const handleBulkSelectPublications = (indices, shouldSelect) => {
    const newSelected = new Set(selectedPublications);

    indices.forEach((index) => {
      if (shouldSelect) {
        newSelected.add(index);
      } else {
        newSelected.delete(index);
      }
    });

    setSelectedPublications(newSelected);
  };

  const handleAddSelected = async (selectedExistingPublications = new Set()) => {
    const publicationsToAdd = [];
    const publicationsToArchive = []; // Track publications from "Other Publications" section to archive

    // Process each selected Scopus publication
    for (const index of selectedPublications) {
      const publication = newStagingPublications[index];

      // Check if this publication is a potential duplicate
      const matchingDuplicate = matchedPublications.find((match) => match.fetchedPublication.originalIndex === index);

      if (matchingDuplicate) {
        // This is a potential duplicate - merge Scopus data with existing data
        const mergedPublication = mergePublicationData(
          publication,
          matchingDuplicate.existingPublications || [matchingDuplicate.existingPublication]
        );
        publicationsToAdd.push(mergedPublication);

        // Identify matched existing publications from "Other Publications" section to archive
        const existingPubs = matchingDuplicate.existingPublications || [matchingDuplicate.existingPublication];
        existingPubs.forEach((existingPub) => {
          if (existingPub.section_type === "Other Publications") {
            publicationsToArchive.push(existingPub.user_cv_data_id);
          }
        });
      } else {
        // This is a new publication, use as-is
        publicationsToAdd.push(publication);
      }
    }

    // Process each selected existing publication (create duplicates)
    for (const publicationId of selectedExistingPublications) {
      const existingPublication = allExistingPublications.find((pub) => pub.user_cv_data_id === publicationId);
      if (existingPublication) {
        // Create a copy of the existing publication data without the user_cv_data_id
        const { user_cv_data_id, ...publicationDataWithoutId } = existingPublication;
        const duplicatePublication = {
          ...existingPublication.data_details,
          // Add any additional metadata if needed
          publication_type: existingPublication.data_details.publication_type || "Journal",
        };
        publicationsToAdd.push(duplicatePublication);
      }
    }

    if (publicationsToAdd.length > 0) {
      await addPublicationsData(publicationsToAdd);
    }
  };

  // Function to merge Scopus publication data with existing publication data
  const mergePublicationData = (scopusPublication, existingPublications) => {
    // Start with all Scopus fields as the base (preserve staging metadata)
    const mergedPublication = { ...scopusPublication };

    // Collect unique fields from all existing publications that aren't in Scopus
    const scopusFields = new Set(
      Object.keys(scopusPublication).filter(
        (key) =>
          scopusPublication[key] !== null &&
          scopusPublication[key] !== undefined &&
          scopusPublication[key] !== "" &&
          !key.startsWith("_staging") && // Exclude staging metadata from field comparison
          key !== "originalIndex"
      )
    );

    // Define field priorities - these fields from existing publications should be preferred if they're more complete
    const preferExistingFields = [
      "citation",
      "notes",
      "comments",
      "additional_info",
      "publication_type",
      "category",
      "tags",
      "custom_field",
    ];

    // Define fields that should be combined rather than replaced
    const combinableFields = ["keywords", "subjects", "authors"];

    let addedFieldsCount = 0;
    let updatedFieldsCount = 0;

    existingPublications.forEach((existingPub, index) => {
      const existingData = existingPub.data_details;

      // Iterate through existing publication fields
      Object.keys(existingData).forEach((field) => {
        const existingValue = existingData[field];
        const scopusValue = mergedPublication[field];

        // Skip if existing value is empty or null, or if it's staging metadata
        if (
          !existingValue ||
          existingValue === "" ||
          existingValue === null ||
          existingValue === undefined ||
          existingValue.toString().trim() === "" ||
          field.startsWith("_staging") ||
          field === "originalIndex"
        ) {
          return;
        }

        // Case 1: Field doesn't exist in Scopus - add it
        if (
          !scopusFields.has(field) ||
          !scopusValue ||
          scopusValue === "" ||
          scopusValue === null ||
          scopusValue === undefined
        ) {
          mergedPublication[field] = existingValue;
          addedFieldsCount++;
          return;
        }

        // Case 2: Field exists in both, check if we should prefer existing
        if (preferExistingFields.includes(field)) {
          if (existingValue.toString().length > scopusValue.toString().length) {
            mergedPublication[field] = existingValue;
            updatedFieldsCount++;
          }
          return;
        }

        // Case 3: Combinable fields - merge them intelligently
        if (combinableFields.includes(field)) {
          const combined = combineFieldValues(scopusValue, existingValue, field);
          if (combined !== scopusValue) {
            mergedPublication[field] = combined;
            updatedFieldsCount++;
          }
          return;
        }

        // Case 4: Default - keep Scopus value but consider length and completeness
        if (existingValue.toString().length > scopusValue.toString().length * 1.2) {
          mergedPublication[field] = existingValue;
          updatedFieldsCount++;
        }
      });
    });

    // Log the merge operation for debugging
    console.log("Merge operation completed:", {
      scopusFields: Array.from(scopusFields),
      originalScopusFields: Object.keys(scopusPublication).length,
      mergedFields: Object.keys(mergedPublication).length,
      addedFields: addedFieldsCount,
      updatedFields: updatedFieldsCount,
      existingPublicationsProcessed: existingPublications.length,
      hasStagingId: !!mergedPublication._staging_id,
    });

    return mergedPublication;
  };

  // Helper function to intelligently combine field values
  const combineFieldValues = (scopusValue, existingValue, fieldName) => {
    if (!scopusValue) return existingValue;
    if (!existingValue) return scopusValue;

    const scopusStr = scopusValue.toString().toLowerCase();
    const existingStr = existingValue.toString().toLowerCase();

    // If values are very similar, prefer the longer one
    if (scopusStr.includes(existingStr) || existingStr.includes(scopusStr)) {
      return scopusValue.toString().length > existingValue.toString().length ? scopusValue : existingValue;
    }

    // For authors, try to combine if they seem to be different representations
    if (fieldName === "authors") {
      // Simple combination - could be made more sophisticated
      if (!scopusStr.includes(existingStr.split(",")[0]) && !existingStr.includes(scopusStr.split(",")[0])) {
        return `${scopusValue}; ${existingValue}`;
      }
    }

    // For keywords and subjects, combine unique values
    if (fieldName === "keywords" || fieldName === "subjects") {
      const scopusItems = scopusValue
        .toString()
        .split(/[,;]/)
        .map((s) => s.trim().toLowerCase());
      const existingItems = existingValue
        .toString()
        .split(/[,;]/)
        .map((s) => s.trim().toLowerCase());
      const uniqueItems = [...new Set([...scopusItems, ...existingItems])];
      return uniqueItems.join(", ");
    }

    // Default: return the original Scopus value
    return scopusValue;
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
                Fetching and processing publications...
              </div>
            </div>
          ) : null}
        </div>
      </dialog>

      {showSelectionModal && (
        <PublicationsSelectModal
          onClose={onClose}
          allFetchedPublications={newStagingPublications}
          existingPublications={allExistingPublications} // Pass combined list so modal can identify Other Publications
          matchedPublications={matchedPublications}
          selectedPublications={selectedPublications}
          addingData={addingData}
          getPublicationDateInfo={getPublicationDateInfo}
          handleSelectPublication={handleSelectPublication}
          handleSelectAll={handleSelectAll}
          handleBulkSelectPublications={handleBulkSelectPublications}
          handleAddSelected={handleAddSelected}
          setShowSelectionModal={setShowSelectionModal}
          extractDOIsFromCitation={extractDOIsFromCitation}
        />
      )}
    </>
  );
};

export default PublicationsModal;
