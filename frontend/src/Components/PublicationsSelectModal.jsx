import React, { useState, useEffect, useMemo } from "react";
import "../CustomStyles/scrollbar.css";

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
  extractDOIsFromCitation,
}) => {
  // State for tracking selected existing publications
  const [selectedExistingPublications, setSelectedExistingPublications] = useState(new Set());

  // Group publications into duplicates, multi-duplicate matches, non-duplicate matches, unmatched from Scopus, and unmatched from existing
  const groupPublications = () => {
    const duplicatePublications = [];
    const multiDuplicateMatches = [];
    const nonDuplicateMatches = [];
    const unmatchedScopusPublications = [];
    const unmatchedExistingPublications = [];
    const matchedFetchedIndices = new Set();
    const matchedExistingIds = new Set();

    console.log("Grouping publications:", {
      matchedPublications: matchedPublications.length,
      allFetchedPublications: allFetchedPublications.length,
      existingPublications: existingPublications.length
    });

    // Process matches - separate into duplicates, multi-duplicates, and non-duplicate matches
    matchedPublications.forEach((match) => {
      const fetchedIndex = match.fetchedPublication.originalIndex;
      const existingPubs = match.existingPublications || [match.existingPublication];
      
      // Determine if this is a true duplicate (same section type) or a cross-section match
      const isDuplicate = existingPubs.some(pub => pub.section_type === 'Journal Publications');
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
          duplicatePublications.push(matchData);
        }
      } else {
        nonDuplicateMatches.push(matchData);
      }

      // Mark as matched
      matchedFetchedIndices.add(fetchedIndex);

      // Mark all existing publications as matched
      existingPubs.forEach((existingPub) => {
        matchedExistingIds.add(existingPub.user_cv_data_id);
        console.log(`Matched existing publication: ${existingPub.data_details.title} (${existingPub.section_type}) - ${isDuplicate ? (isMultiMatch ? 'multi-duplicate' : 'duplicate') : 'cross-section match'}`);
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
        if (existingPub.section_type === 'Journal Publications') {
          unmatchedExistingPublications.push(existingPub);
        }
        console.log(`Unmatched existing publication: ${existingPub.data_details.title} (${existingPub.section_type}) - ${existingPub.section_type === 'Journal Publications' ? 'included' : 'excluded'}`);
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

    console.log("Grouping results:", {
      duplicatePublications: duplicatePublications.length,
      multiDuplicateMatches: multiDuplicateMatches.length,
      nonDuplicateMatches: nonDuplicateMatches.length,
      unmatchedScopusPublications: unmatchedScopusPublications.length,
      unmatchedExistingPublications: unmatchedExistingPublications.length,
      duplicatesWithOtherPubs: duplicatePublications.filter(dup => 
        (dup.existingPublications || [dup.existingPublication]).some(pub => pub.section_type === 'Other Publications')
      ).length
    });

    return { duplicatePublications, multiDuplicateMatches, nonDuplicateMatches, unmatchedScopusPublications, unmatchedExistingPublications };
  };

  const grouped = useMemo(
    () => groupPublications(),
    [allFetchedPublications, existingPublications, matchedPublications]
  );
  const { duplicatePublications, multiDuplicateMatches, nonDuplicateMatches, unmatchedScopusPublications, unmatchedExistingPublications } = grouped;

  // Determine if all publications are matches
  const allAreMatches =
    (duplicatePublications.length + multiDuplicateMatches.length + nonDuplicateMatches.length) === allFetchedPublications.length &&
    (duplicatePublications.length + multiDuplicateMatches.length) === existingPublications.length;

  const [duplicatesExpanded, setDuplicatesExpanded] = useState(allAreMatches); // Expand by default if all are matches
  const [multiDuplicatesExpanded, setMultiDuplicatesExpanded] = useState(false);
  const [nonDuplicateMatchesExpanded, setNonDuplicateMatchesExpanded] = useState(false);
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

  const getUnmatchedExistingIds = () => {
    return unmatchedExistingPublications.map((pub) => pub.user_cv_data_id);
  };

  const handleSelectAllExistingCategory = (categoryIds) => {
    const allSelected = categoryIds.every((id) => selectedExistingPublications.has(id));

    if (allSelected) {
      // If all are selected, deselect them all
      const newSelected = new Set(selectedExistingPublications);
      categoryIds.forEach((id) => newSelected.delete(id));
      setSelectedExistingPublications(newSelected);
    } else {
      // If not all are selected, select them all
      const newSelected = new Set(selectedExistingPublications);
      categoryIds.forEach((id) => newSelected.add(id));
      setSelectedExistingPublications(newSelected);
    }
  };

  // Helper functions for category-specific select all
  const getDuplicateIndices = () => {
    return duplicatePublications.map((dup) => dup.fetchedPublication.originalIndex);
  };

  const getMultiDuplicateIndices = () => {
    return multiDuplicateMatches.map((dup) => dup.fetchedPublication.originalIndex);
  };

  const getNonDuplicateMatchIndices = () => {
    return nonDuplicateMatches.map((match) => match.fetchedPublication.originalIndex);
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
    if (allFetchedPublications.length > 0 && selectedPublications.size === 0) {
      // Use handleSelectAll to select all publications at once
      handleSelectAll();
    }
  }, [allFetchedPublications.length, selectedPublications.size, handleSelectAll]);

  // Select all existing publications by default when they're available
  React.useEffect(() => {
    if (unmatchedExistingPublications.length > 0 && selectedExistingPublications.size === 0) {
      const unmatchedExistingIds = unmatchedExistingPublications.map((pub) => pub.user_cv_data_id);
      setSelectedExistingPublications(new Set(unmatchedExistingIds));
    }
  }, [unmatchedExistingPublications.length, selectedExistingPublications.size]);

  const ExistingPublicationCard = ({ publication }) => {
    // Extract DOIs from citation text to show what was extracted
    const extractedDOIs = publication.data_details.citation
      ? extractDOIsFromCitation(publication.data_details.citation)
      : [];

    return (
      <div
        className={`border rounded-lg p-4 cursor-pointer transition-colors my-4 ${
          selectedExistingPublications.has(publication.user_cv_data_id)
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 hover:border-gray-300"
        }`}
        onClick={() => handleSelectExistingPublication(publication.user_cv_data_id)}
      >
        <div className="flex items-start gap-3 ">
          <input
            type="checkbox"
            checked={selectedExistingPublications.has(publication.user_cv_data_id)}
            onChange={() => handleSelectExistingPublication(publication.user_cv_data_id)}
            className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-600 bg-gray-200 px-2 py-1 rounded">EXISTING IN CV</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-2 leading-tight">
              {publication.data_details.title || "Untitled"}
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              {publication.data_details.end_date && (
                <p>
                  <span className="font-medium">Date:</span> {publication.data_details.end_date}
                </p>
              )}
              {publication.data_details.authors && (
                <p>
                  <span className="font-medium">Authors:</span> {publication.data_details.authors}
                </p>
              )}
              {publication.data_details.journal_name && (
                <p>
                  <span className="font-medium">Journal:</span> {publication.data_details.journal_name}
                </p>
              )}
              {publication.data_details.doi && (
                <p>
                  <span className="font-medium">DOI:</span>
                  <a
                    href={`https://doi.org/${publication.data_details.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-blue-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {publication.data_details.doi}
                  </a>
                </p>
              )}
              {publication.data_details.citation && (
                <div>
                  <p>
                    <span className="font-medium">Citation:</span>
                    <span className="ml-1 text-gray-700">{publication.data_details.citation}</span>
                  </p>
                  {extractedDOIs.length > 0 && (
                    <p className="mt-1">
                      <span className="font-medium text-blue-600">Extracted DOI(s):</span>
                      {extractedDOIs.map((doi, index) => (
                        <span key={index}>
                          <a
                            href={`https://doi.org/${doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {doi}
                          </a>
                          {index < extractedDOIs.length - 1 && ", "}
                        </span>
                      ))}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PublicationCard = ({ publication, index }) => (
    <div
      key={index}
      className={`border rounded-lg p-4 cursor-pointer transition-colors my-4 ${
        selectedPublications.has(index) ? "border-green-500 bg-green-50 bg-opacity-10" : "border-gray-200 hover:border-gray-300"
      }`}
      onClick={() => handleSelectPublication(index)}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selectedPublications.has(index)}
          onChange={() => handleSelectPublication(index)}
          className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300"
        />
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-2 leading-tight">{publication.title || "Untitled"}</h4>
          <div className="text-sm text-gray-600 space-y-1">
            {publication.end_date && (
              <p>
                <span className="font-medium">Date:</span> {publication.end_date}
              </p>
            )}
            {publication.authors && (
              <p>
                <span className="font-medium">Authors:</span> {publication.authors}
              </p>
            )}
            {publication.journal_name && (
              <p>
                <span className="font-medium">Journal:</span> {publication.journal_name}
              </p>
            )}
            {publication.doi && (
              <p>
                <span className="font-medium">DOI:</span>
                <a
                  href={`https://doi.org/${publication.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {publication.doi}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const MatchedPublicationCard = ({ matchedItem }) => {
    // Determine if this is a multi-match scenario
    const isMultiMatch = matchedItem.isMultiMatch;
    const existingPublications = matchedItem.existingPublications || [matchedItem.existingPublication];

    // Get match type
    const matchType = matchedItem.matchType;
    const hasTitleMatch = matchType === "title";
    const hasDOIMatch = matchType === "doi";

    return (
      <div className="border border-orange-200 rounded-lg p-4 bg-orange-50 my-4">
        <div className="space-y-3 ">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>

            {/* Show match type badges */}
            {hasDOIMatch && <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">DOI Match</span>}
            {hasTitleMatch && (
              <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                {matchedItem.similarity ? `${Math.round(matchedItem.similarity * 100)}% Title Match` : "Title Match"}
              </span>
            )}
            {!hasDOIMatch && !hasTitleMatch && (
              <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">Match</span>
            )}

            {matchedItem.doi && (
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">DOI: {matchedItem.doi}</span>
            )}
          </div>

          {/* Fetched Publication */}
          <div className="bg-white border border-gray-200 rounded p-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedPublications.has(matchedItem.fetchedPublication.originalIndex)}
                onChange={() => handleSelectPublication(matchedItem.fetchedPublication.originalIndex)}
                className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    NEW FROM SCOPUS
                  </span>
                </div>
                <h4 className="font-medium text-gray-900 mb-1 leading-tight">
                  {matchedItem.fetchedPublication.title || "Untitled"}
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  {matchedItem.fetchedPublication.end_date && (
                    <p>
                      <span className="font-medium">Date:</span> {matchedItem.fetchedPublication.end_date}
                    </p>
                  )}
                  {matchedItem.fetchedPublication.authors && (
                    <p>
                      <span className="font-medium">Authors:</span> {matchedItem.fetchedPublication.authors}
                    </p>
                  )}
                  {matchedItem.fetchedPublication.journal_name && (
                    <p>
                      <span className="font-medium">Journal:</span> {matchedItem.fetchedPublication.journal_name}
                    </p>
                  )}
                  {matchedItem.fetchedPublication.doi && (
                    <p>
                      <span className="font-medium">DOI:</span>
                      <a
                        href={`https://doi.org/${matchedItem.fetchedPublication.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 text-blue-600 hover:underline"
                      >
                        {matchedItem.fetchedPublication.doi}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* All Existing Publications that match */}
          <div className="space-y-2">
            {existingPublications.map((existingPub, index) => (
              <div
                key={`existing-${existingPub.user_cv_data_id}-${index}`}
                className="bg-gray-50 border border-gray-200 rounded p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-600 bg-gray-200 px-2 py-1 rounded">
                    EXISTING{" "}
                    {isMultiMatch && existingPublications.length > 1
                      ? `(${index + 1}/${existingPublications.length})`
                      : ""}
                  </span>
                  {existingPub.section_type && (
                    <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded">
                      {existingPub.section_type}
                    </span>
                  )}
                  {existingPub.section_type === 'Other Publications' && (
                    <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                      ⚠️ WILL BE ARCHIVED
                    </span>
                  )}
                </div>
                <h4 className="font-medium text-gray-700 mb-1 leading-tight">
                  {existingPub.data_details.title || "Untitled"}
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  {existingPub.data_details.end_date && (
                    <p>
                      <span className="font-medium">Date:</span> {existingPub.data_details.end_date}
                    </p>
                  )}
                  {existingPub.data_details.authors && (
                    <p>
                      <span className="font-medium">Authors:</span> {existingPub.data_details.authors}
                    </p>
                  )}
                  {existingPub.data_details.journal_name && (
                    <p>
                      <span className="font-medium">Journal:</span> {existingPub.data_details.journal_name}
                    </p>
                  )}
                  {existingPub.data_details.doi && (
                    <p>
                      <span className="font-medium">DOI:</span>
                      <a
                        href={`https://doi.org/${existingPub.data_details.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 text-blue-600 hover:underline"
                      >
                        {existingPub.data_details.doi}
                      </a>
                    </p>
                  )}
                  {existingPub.data_details.citation && (
                    <p>
                      <span className="font-medium">Citation:</span>{" "}
                      {existingPub.data_details.citation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

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
      <div className="modal-box relative max-w-4xl w-full bg-white p-6 rounded-lg shadow-xl mx-auto min-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold">Select Publications to Add</h3>
            <div className="text-sm text-gray-600 mt-1">
              {existingPublications.filter(pub => pub.section_type === 'Journal Publications').length} current journal publications, {allFetchedPublications.length} from Scopus
              {existingPublications.filter(pub => pub.section_type === 'Other Publications').length > 0 && (
                <span className="ml-2 text-orange-600">
                  (+{existingPublications.filter(pub => pub.section_type === 'Other Publications').length} from Other Publications for matching)
                </span>
              )}
            </div>
            {duplicatePublications.some((dup) => 
              dup.existingPublications?.some(pub => pub.section_type === 'Other Publications') ||
              dup.existingPublication?.section_type === 'Other Publications'
            ) || multiDuplicateMatches.some((dup) => 
              dup.existingPublications?.some(pub => pub.section_type === 'Other Publications') ||
              dup.existingPublication?.section_type === 'Other Publications'
            ) && (
              <div className="text-sm text-red-600 mt-1">
                🗂️ Matched entries from "Other Publications" will be archived and replaced with merged Scopus data.
              </div>
            )}
            {(duplicatePublications.some((dup) => dup.isMultiMatch) || multiDuplicateMatches.length > 0) && (
              <div className="text-sm text-orange-600 mt-1">⚠️ Some publications match multiple existing entries</div>
            )}
          </div>
          <button type="button" className="btn btn-sm btn-circle btn-ghost" onClick={handleClose} disabled={addingData}>
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-4">
            {/* True Duplicates - Scopus publications that match single existing Journal Publications */}
            {duplicatePublications.length > 0 && (
              <div className="border border-red-200 rounded-lg">
                <div className="p-4 flex items-center justify-between bg-red-50 rounded-t-lg">
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
                      Matches Scopus Publications ({duplicatePublications.length})
                    </span>
                    <span className="text-sm text-red-600 font-medium">
                      1:1 matches with Journal Publications
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline btn-error"
                    onClick={() => handleSelectAllCategory(getDuplicateIndices())}
                    disabled={addingData}
                  >
                    {getDuplicateIndices().every((index) => selectedPublications.has(index))
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
                {duplicatesExpanded && (
                  <div className="p-4 pt-0 space-y-3">
                    {duplicatePublications.map((matchedItem, index) => (
                      <MatchedPublicationCard key={`duplicate-${index}`} matchedItem={matchedItem} />
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
                    style={{ borderColor: '#7c3aed', color: '#7c3aed' }}
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

            {/* Non-Duplicate Matches - Scopus publications that match Other Publications */}
            {nonDuplicateMatches.length > 0 && (
              <div className="border border-orange-200 rounded-lg">
                <div className="p-4 flex items-center justify-between bg-orange-50 rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setNonDuplicateMatchesExpanded(!nonDuplicateMatchesExpanded)}
                      className="flex items-center gap-2 hover:bg-orange-100 p-1 rounded transition-colors"
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${nonDuplicateMatchesExpanded ? "rotate-90" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <span className="font-medium text-orange-800">
                      Matched Other Publications ({nonDuplicateMatches.length})
                    </span>
                    <span className="text-sm text-orange-600 font-medium">
                      Will archive matched "Other Publications"
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline btn-warning"
                    onClick={() => handleSelectAllCategory(getNonDuplicateMatchIndices())}
                    disabled={addingData}
                  >
                    {getNonDuplicateMatchIndices().every((index) => selectedPublications.has(index))
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
                {nonDuplicateMatchesExpanded && (
                  <div className="p-4 pt-0 space-y-3">
                    {nonDuplicateMatches.map((matchedItem, index) => (
                      <MatchedPublicationCard key={`non-duplicate-${index}`} matchedItem={matchedItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Unmatched Existing Publications - only show if not all are matches */}
            {!allAreMatches && unmatchedExistingPublications.length > 0 && (
              <div className="border border-blue-200 rounded-lg">
                <div className="p-4 flex items-center justify-between bg-blue-50 rounded-t-lg">
                  <div className="flex items-center gap-3">
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
                  {/* <button
                    type="button"
                    className="btn btn-sm btn-outline btn-info"
                    onClick={() => handleSelectAllExistingCategory(getUnmatchedExistingIds())}
                    disabled={addingData}
                  >
                    {getUnmatchedExistingIds().every((id) => selectedExistingPublications.has(id))
                      ? "Deselect All"
                      : "Select All"}
                  </button> */}
                </div>
                {unmatchedExistingExpanded && (
                  <div className="p-4 pt-0 space-y-3">
                    {unmatchedExistingPublications.map((publication, index) => (
                      <ExistingPublicationCard
                        key={`existing-${publication.user_cv_data_id}`}
                        publication={publication}
                      />
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
                      <PublicationCard
                        key={publication.originalIndex}
                        publication={publication}
                        index={publication.originalIndex}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* No publications message */}
            {duplicatePublications.length === 0 &&
              multiDuplicateMatches.length === 0 &&
              nonDuplicateMatches.length === 0 &&
              unmatchedScopusPublications.length === 0 &&
              unmatchedExistingPublications.length === 0 && (
                <div className="text-center py-8 text-gray-500">No publications found.</div>
              )}
          </div>
        </div>
        <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded">
          <div className="flex items-center gap-4">
            {/* Calculate accurate counts */}
            {(() => {
              // Count publications from "Other Publications" that will be archived and won't be double-counted
              const otherPublicationsToArchive = new Set();
              
              // Track selected Scopus publications that match with "Other Publications"
              selectedPublications.forEach(index => {
                const matchingDuplicate = matchedPublications.find((match) => match.fetchedPublication.originalIndex === index);
                if (matchingDuplicate) {
                  const existingPubs = matchingDuplicate.existingPublications || [matchingDuplicate.existingPublication];
                  existingPubs.forEach((existingPub) => {
                    if (existingPub.section_type === 'Other Publications') {
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
      </div>
    </dialog>
  );
};

export default PublicationsSelectModal;
