import React, { useState, useEffect, useMemo } from "react";
import "../CustomStyles/scrollbar.css";
import ExistingPublicationCard from "./ExistingPublicationCard";
import NewPublicationCard from "./NewPublicationCard";
import MatchedPublicationCard from "./MatchedPublicationCard";
import { truncateAuthors } from "utils/publicationsMergeUtils";

const PublicationsSelectModal = ({
  onClose,
  allFetchedPublications,
  existingPublications,
  matchedPublications,
  selectedPublications,
  addingData,
  getPublicationDateInfo,
  handleSelectPublication,
  handleSelectAll,
  handleBulkSelectPublications,
  handleAddSelected,
  setShowSelectionModal,
}) => {
  // State for tracking selected existing publications
  const [selectedExistingPublications, setSelectedExistingPublications] = useState(new Set());
  
  // Ref to track if initial selection has been done
  const initialSelectionDone = React.useRef(false);

  // Group publications into DOI matches, title matches, multi-matches, non-duplicate matches, unmatched from Scopus, and unmatched from existing
  const groupPublications = () => {
    const doiMatches = [];
    const titleMatches = [];
    const multiDuplicateMatches = [];
    const nonDuplicateMatches = [];
    const unmatchedScopusPublications = [];
    const unmatchedExistingPublications = [];
    const matchedFetchedIndices = new Set();
    const matchedExistingIds = new Set();

    // Process matches - separate into DOI matches, title matches, multi-duplicates, and non-duplicate matches
    matchedPublications.forEach((match) => {
      const fetchedIndex = match.fetchedPublication.originalIndex;
      const existingPubs = match.existingPublications || [match.existingPublication];

      // Determine if this is a true duplicate (same section type) or a cross-section match
      const isDuplicate = existingPubs.some((pub) => pub.section_type === "Journal Publications");
      const isMultiMatch = match.isMultiMatch || (match.existingPublications && match.existingPublications.length > 1);

      const matchData = {
        fetchedPublication: match.fetchedPublication,
        existingPublications: match.existingPublications || [match.existingPublication],
        existingPublication: match.existingPublication, // Keep for backward compatibility
        similarity: match.similarity,
        isMultiMatch: isMultiMatch,
        matchCount: match.existingPublications ? match.existingPublications.length : 1,
        matchType: match.matchType,
        matchTypes: [match.matchType], // Convert to array for consistency
        doi: match.doi,
      };

      if (isDuplicate) {
        // If it's a duplicate and has multiple matches, put it in the multi-duplicate section
        if (isMultiMatch) {
          multiDuplicateMatches.push(matchData);
        } else {
          // Separate DOI matches from title matches
          if (match.matchType === "doi") {
            doiMatches.push(matchData);
          } else if (match.matchType === "title") {
            titleMatches.push(matchData);
          } else {
            // Fallback for any other match types
            doiMatches.push(matchData);
          }
        }
      } else {
        nonDuplicateMatches.push(matchData);
      }

      // Mark as matched
      matchedFetchedIndices.add(fetchedIndex);

      // Mark all existing publications as matched
      existingPubs.forEach((existingPub) => {
        matchedExistingIds.add(existingPub.user_cv_data_id);
      });
    });

    // Then, collect all fetched publications that don't have matches (unmatched Scopus)
    allFetchedPublications.forEach((pub, index) => {
      if (!matchedFetchedIndices.has(index)) {
        unmatchedScopusPublications.push({ ...pub, originalIndex: index });
      }
    });

    // Collect all existing publications that don't have matches (unmatched existing)
    // Only include Journal Publications in the unmatched existing list, exclude Other Publications
    existingPublications.forEach((existingPub) => {
      if (!matchedExistingIds.has(existingPub.user_cv_data_id)) {
        // Only show Journal Publications as unmatched - Other Publications are handled through matching
        if (existingPub.section_type === "Journal Publications") {
          unmatchedExistingPublications.push(existingPub);
        }
      }
    });

    // Sort unmatched Scopus publications by date (newest first)
    unmatchedScopusPublications.sort((a, b) => {
      const dateA = getPublicationDateInfo(a);
      const dateB = getPublicationDateInfo(b);

      // First sort by year (descending)
      if (dateA.year !== dateB.year) {
        return (dateB.year || 0) - (dateA.year || 0);
      }

      // If years are the same, sort by month (descending)
      return dateB.month - dateA.month;
    });

    // Sort unmatched existing publications by date (newest first)
    unmatchedExistingPublications.sort((a, b) => {
      const dateA = getPublicationDateInfo(a.data_details);
      const dateB = getPublicationDateInfo(b.data_details);

      // First sort by year (descending)
      if (dateA.year !== dateB.year) {
        return (dateB.year || 0) - (dateA.year || 0);
      }

      // If years are the same, sort by month (descending)
      return dateB.month - dateA.month;
    });

    // Sort title matches by similarity percentage (highest first)
    titleMatches.sort((a, b) => {
      return (b.similarity || 0) - (a.similarity || 0);
    });
    return {
      doiMatches,
      titleMatches,
      multiDuplicateMatches,
      nonDuplicateMatches,
      unmatchedScopusPublications,
      unmatchedExistingPublications,
    };
  };

  const grouped = useMemo(
    () => groupPublications(),
    [allFetchedPublications, existingPublications, matchedPublications]
  );
  const {
    doiMatches,
    titleMatches,
    multiDuplicateMatches,
    nonDuplicateMatches,
    unmatchedScopusPublications,
    unmatchedExistingPublications,
  } = grouped;

  // Determine if all publications are matches
  const allAreMatches =
    doiMatches.length + titleMatches.length + multiDuplicateMatches.length + nonDuplicateMatches.length ===
      allFetchedPublications.length &&
    doiMatches.length + titleMatches.length + multiDuplicateMatches.length === existingPublications.length;

  const [doiMatchesExpanded, setDoiMatchesExpanded] = useState(allAreMatches); // Expand by default if all are matches
  const [titleMatchesExpanded, setTitleMatchesExpanded] = useState(allAreMatches); // Expand by default if all are matches
  const [multiDuplicatesExpanded, setMultiDuplicatesExpanded] = useState(false);
  const [unmatchedScopusExpanded, setUnmatchedScopusExpanded] = useState(false);
  const [unmatchedExistingExpanded, setUnmatchedExistingExpanded] = useState(false);

  // Helper functions for existing publication selection
  const handleSelectExistingPublication = (publicationId) => {
    const newSelected = new Set(selectedExistingPublications);
    if (newSelected.has(publicationId)) {
      newSelected.delete(publicationId);
    } else {
      newSelected.add(publicationId);
    }
    setSelectedExistingPublications(newSelected);
  };

  // Helper functions for category-specific select all
  const getDoiMatchIndices = () => {
    return doiMatches.map((dup) => dup.fetchedPublication.originalIndex);
  };

  const getTitleMatchIndices = () => {
    return titleMatches.map((dup) => dup.fetchedPublication.originalIndex);
  };

  const getMultiDuplicateIndices = () => {
    return multiDuplicateMatches.map((dup) => dup.fetchedPublication.originalIndex);
  };

  const getUnmatchedScopusIndices = () => {
    return unmatchedScopusPublications.map((pub) => pub.originalIndex);
  };

  const handleSelectAllCategory = (categoryIndices) => {
    const allSelected = categoryIndices.every((index) => selectedPublications.has(index));

    // Use the bulk selection handler for efficient state updates
    if (allSelected) {
      // If all are selected, deselect them all
      handleBulkSelectPublications(categoryIndices, false);
    } else {
      // If not all are selected, select them all
      handleBulkSelectPublications(categoryIndices, true);
    }
  };

  // Select all publications by default when component mounts
  React.useEffect(() => {
    if (allFetchedPublications.length > 0 && selectedPublications.size === 0 && !initialSelectionDone.current) {
      // Use handleSelectAll to select all publications at once
      handleSelectAll();
      initialSelectionDone.current = true;
    }
  }, [allFetchedPublications.length]); // Only depend on the publications length

  // Select all existing publications by default when they're available
  React.useEffect(() => {
    if (unmatchedExistingPublications.length > 0 && selectedExistingPublications.size === 0) {
      const unmatchedExistingIds = unmatchedExistingPublications.map((pub) => pub.user_cv_data_id);
      setSelectedExistingPublications(new Set(unmatchedExistingIds));
    }
  }, [unmatchedExistingPublications.length, selectedExistingPublications.size]);

  const handleClose = () => {
    setShowSelectionModal(false);
    onClose();
  };

  // Modified to pass selected existing publications to parent
  const handleAddSelectedWithExisting = () => {
    handleAddSelected(selectedExistingPublications);
  };

  return (
    <dialog
      className="fixed inset-0 flex items-center justify-center p-0 m-0 w-screen h-screen bg-black bg-opacity-40 z-50"
      open
    >
      <div className="modal-box relative max-w-7xl w-full bg-white p-6 rounded-lg shadow-xl mx-auto min-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold">Select Publications to Add</h3>
            <div className="text-sm text-gray-600 mt-1">
              {existingPublications.filter((pub) => pub.section_type === "Journal Publications").length} existing
              Journal Publications
            </div>
          </div>
          <button type="button" className="btn btn-sm btn-circle btn-ghost" onClick={handleClose} disabled={addingData}>
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-4">
            {/* Unmatched Existing Publications - only show if not all are matches */}
            <div className="">
              {!allAreMatches && unmatchedExistingPublications.length > 0 && (
                <div className="border border-blue-200 rounded-lg">
                  <div className="p-4 flex items-center justify-between bg-blue-50 rounded-t-lg ">
                    <div className="flex items-center gap-3 px-4">
                      <button
                        type="button"
                        onClick={() => setUnmatchedExistingExpanded(!unmatchedExistingExpanded)}
                        className="flex items-center gap-2 hover:bg-blue-100 p-1 rounded transition-colors"
                      >
                        <svg
                          className={`w-4 h-4 transition-transform ${unmatchedExistingExpanded ? "rotate-90" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <span className="font-medium text-blue-800">
                        Existing Journal Publications ({unmatchedExistingPublications.length})
                      </span>
                      <span className="text-sm text-blue-600 font-medium">Publications without Scopus Matches</span>
                    </div>
                    <div className="py-4"> </div>
                  </div>
                  {unmatchedExistingExpanded && (
                    <div className="p-4 pt-0 space-y-3">
                      {unmatchedExistingPublications.map((publication, index) => (
                        <ExistingPublicationCard
                          key={`existing-${publication.user_cv_data_id}`}
                          publication={publication}
                          selectedExistingPublications={selectedExistingPublications}
                          handleSelectExistingPublication={handleSelectExistingPublication}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              {allFetchedPublications.length > 0 && <h1>SCOPUS Publications: {allFetchedPublications.length}</h1>}
              {(doiMatches.some((dup) => dup.isMultiMatch) ||
                titleMatches.some((dup) => dup.isMultiMatch) ||
                multiDuplicateMatches.length > 0) && (
                <div className="text-sm text-orange-600 mt-2">⚠️ Some publications match multiple existing entries</div>
              )}
            </div>
            {allFetchedPublications.length > 0 && (
              <div className="space-y-4 p-4 border border-zinc-300 rounded-xl ">
                {/* DOI Matches - Scopus publications that match existing Journal Publications by DOI */}
                {doiMatches.length > 0 && (
                  <div className="border border-blue-200 rounded-lg">
                    <div className="p-4 flex items-center justify-between bg-blue-50 rounded-t-lg">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setDoiMatchesExpanded(!doiMatchesExpanded)}
                          className="flex items-center gap-2 hover:bg-blue-100 p-1 rounded transition-colors"
                        >
                          <svg
                            className={`w-4 h-4 transition-transform ${doiMatchesExpanded ? "rotate-90" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <span className="font-medium text-blue-800">
                          DOI Matched Scopus Publications ({doiMatches.length})
                        </span>
                        <span className="text-sm text-blue-600 font-medium">
                          Exact DOI matches with Journal Publications
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline btn-info"
                        onClick={() => handleSelectAllCategory(getDoiMatchIndices())}
                        disabled={addingData}
                      >
                        {getDoiMatchIndices().every((index) => selectedPublications.has(index))
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    </div>
                    {doiMatchesExpanded && (
                      <div className="p-4 pt-0 space-y-3">
                        {doiMatches.map((matchedItem, index) => (
                          <MatchedPublicationCard
                            key={`doi-match-${index}`}
                            matchedItem={matchedItem}
                            selectedPublications={selectedPublications}
                            handleSelectPublication={handleSelectPublication}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Title Matches - Scopus publications that match existing Journal Publications by title similarity */}
                {titleMatches.length > 0 && (
                  <div className="border border-red-200 rounded-lg">
                    <div className="p-4 flex items-center justify-between bg-red-50 rounded-t-lg">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setTitleMatchesExpanded(!titleMatchesExpanded)}
                          className="flex items-center gap-2 hover:bg-red-100 p-1 rounded transition-colors"
                        >
                          <svg
                            className={`w-4 h-4 transition-transform ${titleMatchesExpanded ? "rotate-90" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <span className="font-medium text-red-800">
                          Title Matched Scopus Publications ({titleMatches.length})
                        </span>
                        <span className="text-sm text-red-600 font-medium">
                          Similarity matches with Journal Publications (sorted by % match)
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline btn-error"
                        onClick={() => handleSelectAllCategory(getTitleMatchIndices())}
                        disabled={addingData}
                      >
                        {getTitleMatchIndices().every((index) => selectedPublications.has(index))
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    </div>
                    {titleMatchesExpanded && (
                      <div className="p-4 pt-0 space-y-3">
                        {titleMatches.map((matchedItem, index) => (
                          <MatchedPublicationCard key={`title-match-${index}`} matchedItem={matchedItem} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {/* Multi-Duplicate Matches - Scopus publications that match multiple existing entries */}
                {multiDuplicateMatches.length > 0 && (
                  <div className="border border-purple-200 rounded-lg">
                    <div className="p-4 flex items-center justify-between bg-purple-50 rounded-t-lg">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setMultiDuplicatesExpanded(!multiDuplicatesExpanded)}
                          className="flex items-center gap-2 hover:bg-purple-100 p-1 rounded transition-colors"
                        >
                          <svg
                            className={`w-4 h-4 transition-transform ${multiDuplicatesExpanded ? "rotate-90" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <span className="font-medium text-purple-800">
                          Potential Duplicate Matches ({multiDuplicateMatches.length})
                        </span>
                        <span className="text-sm text-purple-600 font-medium">
                          1 Scopus → Multiple existing entries
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        style={{ borderColor: "#7c3aed", color: "#7c3aed" }}
                        onClick={() => handleSelectAllCategory(getMultiDuplicateIndices())}
                        disabled={addingData}
                      >
                        {getMultiDuplicateIndices().every((index) => selectedPublications.has(index))
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    </div>
                    {multiDuplicatesExpanded && (
                      <div className="p-4 pt-0 space-y-3">
                        {multiDuplicateMatches.map((matchedItem, index) => (
                          <MatchedPublicationCard key={`multi-duplicate-${index}`} matchedItem={matchedItem} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Unmatched Scopus Publications - only show if not all are matches */}
                {!allAreMatches && unmatchedScopusPublications.length > 0 && (
                  <div className="border border-green-200 rounded-lg">
                    <div className="p-4 flex items-center justify-between bg-green-50 rounded-t-lg">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setUnmatchedScopusExpanded(!unmatchedScopusExpanded)}
                          className="flex items-center gap-2 hover:bg-green-100 p-1 rounded transition-colors"
                        >
                          <svg
                            className={`w-4 h-4 transition-transform ${unmatchedScopusExpanded ? "rotate-90" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <span className="font-medium text-green-800">
                          New Publications from Scopus ({unmatchedScopusPublications.length})
                        </span>
                        <span className="text-sm text-green-600 font-medium">Safe to Add</span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline btn-success"
                        onClick={() => handleSelectAllCategory(getUnmatchedScopusIndices())}
                        disabled={addingData}
                      >
                        {getUnmatchedScopusIndices().every((index) => selectedPublications.has(index))
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    </div>
                    {unmatchedScopusExpanded && (
                      <div className="p-4 pt-0 space-y-3">
                        {unmatchedScopusPublications.map((publication) => (
                          <NewPublicationCard
                            key={publication.originalIndex}
                            publication={publication}
                            index={publication.originalIndex}
                            selectedPublications={selectedPublications}
                            handleSelectPublication={handleSelectPublication}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {/* No publications message */}
            {doiMatches.length === 0 &&
              titleMatches.length === 0 &&
              multiDuplicateMatches.length === 0 &&
              nonDuplicateMatches.length === 0 &&
              unmatchedScopusPublications.length === 0 &&
              unmatchedExistingPublications.length === 0 && (
                <div className="text-center py-8 text-gray-500">No publications found.</div>
              )}
          </div>
        </div>
        {allFetchedPublications.length > 0 && (
          <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded">
            <div className="flex items-center gap-4">
              {/* Calculate accurate counts */}
              {(() => {
                // Count publications from "Other Publications" that will be archived and won't be double-counted
                const otherPublicationsToArchive = new Set();

                // Track selected Scopus publications that match with "Other Publications"
                selectedPublications.forEach((index) => {
                  const matchingDuplicate = matchedPublications.find(
                    (match) => match.fetchedPublication.originalIndex === index
                  );
                  if (matchingDuplicate) {
                    const existingPubs = matchingDuplicate.existingPublications || [
                      matchingDuplicate.existingPublication,
                    ];
                    existingPubs.forEach((existingPub) => {
                      if (existingPub.section_type === "Other Publications") {
                        otherPublicationsToArchive.add(existingPub.user_cv_data_id);
                      }
                    });
                  }
                });

                // Calculate net additions: Scopus + existing - publications that will be archived
                const scopusCount = selectedPublications.size;
                const existingCount = selectedExistingPublications.size;
                const archiveCount = otherPublicationsToArchive.size;
                const netTotal = scopusCount + existingCount;

                return (
                  <span className="text-sm text-gray-600">
                    {scopusCount} Scopus + {existingCount} existing = {netTotal} total selected
                    {archiveCount > 0 && (
                      <span className="text-red-600 ml-2">
                        ({archiveCount} from Other Publications will be archived)
                      </span>
                    )}
                  </span>
                );
              })()}
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddSelectedWithExisting}
              disabled={(selectedPublications.size === 0 && selectedExistingPublications.size === 0) || addingData}
            >
              {addingData
                ? "Adding..."
                : `Add Selected (${selectedPublications.size + selectedExistingPublications.size})`}
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
};

export default PublicationsSelectModal;
