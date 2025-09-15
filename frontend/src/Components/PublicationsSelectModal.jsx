import React, { useState } from "react";
import "../CustomStyles/scrollbar.css";

const PublicationsSelectModal = ({
  allFetchedPublications,
  existingPublications,
  matchedPublications,
  selectedPublications,
  addingData,
  getPublicationDateInfo,
  handleSelectPublication,
  handleSelectAll,
  handleAddSelected,
  setShowSelectionModal,
  extractDOIsFromCitation,
}) => {
  // Group publications into duplicates, unmatched from Scopus, and unmatched from existing
  const groupPublications = () => {
    const duplicatePublications = [];
    const unmatchedScopusPublications = [];
    const unmatchedExistingPublications = [];
    const matchedFetchedIndices = new Set();
    const matchedExistingIds = new Set();

    // Process matches - since each fetched publication now has only one match object, we can simplify
    matchedPublications.forEach((match) => {
      const fetchedIndex = match.fetchedPublication.originalIndex;
      
      // Debug logging for DOI matches
      if (match.matchType === 'doi') {
        console.log(`DOI match found: fetched index ${fetchedIndex}, DOI: ${match.doi}`);
      }

      // Each match is already consolidated, so we can directly add it to duplicates
      duplicatePublications.push({
        fetchedPublication: match.fetchedPublication,
        existingPublications: match.existingPublications || [match.existingPublication],
        existingPublication: match.existingPublication, // Keep for backward compatibility
        similarity: match.similarity,
        isMultiMatch: match.isMultiMatch,
        matchCount: match.existingPublications ? match.existingPublications.length : 1,
        matchType: match.matchType,
        matchTypes: [match.matchType], // Convert to array for consistency
        doi: match.doi,
      });

      // Mark as matched
      matchedFetchedIndices.add(fetchedIndex);
      
      // Mark all existing publications as matched
      const existingPubs = match.existingPublications || [match.existingPublication];
      existingPubs.forEach((existingPub) => {
        matchedExistingIds.add(existingPub.user_cv_data_id);
      });
    });

    // Then, collect all fetched publications that don't have matches (unmatched Scopus)
    console.log("Matched fetched indices:", Array.from(matchedFetchedIndices).sort((a,b) => a-b));
    allFetchedPublications.forEach((pub, index) => {
      if (!matchedFetchedIndices.has(index)) {
        unmatchedScopusPublications.push({ ...pub, originalIndex: index });
      } else {
        console.log(`Excluding fetched pub ${index} from unmatched (title: "${pub.title?.substring(0, 50)}...")`);
      }
    });

    // Collect all existing publications that don't have matches (unmatched existing)
    existingPublications.forEach((existingPub) => {
      if (!matchedExistingIds.has(existingPub.user_cv_data_id)) {
        unmatchedExistingPublications.push(existingPub);
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

    return { duplicatePublications, unmatchedScopusPublications, unmatchedExistingPublications };
  };

  const { duplicatePublications, unmatchedScopusPublications, unmatchedExistingPublications } = groupPublications();
  const [duplicatesExpanded, setDuplicatesExpanded] = useState(false);
  const [unmatchedScopusExpanded, setUnmatchedScopusExpanded] = useState(false);
  const [unmatchedExistingExpanded, setUnmatchedExistingExpanded] = useState(false);

  // Validation: duplicates + unmatched Scopus should equal total fetched
  console.log("=== PublicationsSelectModal Validation ===");
  console.log("Raw matchedPublications received:", matchedPublications.length);
  
  // Let's check each type of match
  const titleMatches = matchedPublications.filter(m => m.matchType === 'title');
  const doiMatches = matchedPublications.filter(m => m.matchType === 'doi');
  console.log("Title matches received:", titleMatches.length);
  console.log("DOI matches received:", doiMatches.length);
  
  // Log the indices of each type
  console.log("Title match indices:", titleMatches.map(m => m.fetchedPublication.originalIndex).sort((a,b) => a-b));
  console.log("DOI match indices:", doiMatches.map(m => m.fetchedPublication.originalIndex).sort((a,b) => a-b));
  
  console.log("Final duplicatePublications:", duplicatePublications.length);
  console.log("Unmatched Scopus publications:", unmatchedScopusPublications.length);
  console.log("Unmatched existing publications:", unmatchedExistingPublications.length);
  console.log("Total fetched:", allFetchedPublications.length, "Total existing:", existingPublications.length);
  console.log("Validation check:", {
    duplicates: duplicatePublications.length,
    unmatchedScopus: unmatchedScopusPublications.length,
    unmatchedExisting: unmatchedExistingPublications.length,
    totalFetched: allFetchedPublications.length,
    totalExisting: existingPublications.length,
    isValid: duplicatePublications.length + unmatchedScopusPublications.length === allFetchedPublications.length,
  });

  const ExistingPublicationCard = ({ publication }) => {
    // Extract DOIs from citation text to show what was extracted
    const extractedDOIs = publication.data_details.citation
      ? extractDOIsFromCitation(publication.data_details.citation)
      : [];

    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
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
    );
  };

  const PublicationCard = ({ publication, index }) => (
    <div
      key={index}
      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
        selectedPublications.has(index) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
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
      <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
        <div className="space-y-3">
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
                    ALREADY IN CV{" "}
                    {isMultiMatch && existingPublications.length > 1
                      ? `(${index + 1}/${existingPublications.length})`
                      : ""}
                  </span>
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
                      {existingPub.data_details.citation.substring(0, 100)}...
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
              {existingPublications.length} original, {allFetchedPublications.length} from Scopus <br />
              • {duplicatePublications.length} potential matches • {unmatchedScopusPublications.length} new publications
              {unmatchedExistingPublications.length > 0 && (
                <span> • {unmatchedExistingPublications.length} existing without Scopus matches</span>
              )}
            </div>
            {duplicatePublications.some((dup) => dup.isMultiMatch) && (
              <div className="text-sm text-orange-600 mt-1">
                ⚠️ Some publications match multiple existing entries
              </div>
            )}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost"
            onClick={() => setShowSelectionModal(false)}
            disabled={addingData}
          >
            ✕
          </button>
        </div>

        <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded">
          <div className="flex items-center gap-4">
            <button type="button" className="btn btn-sm btn-outline" onClick={handleSelectAll} disabled={addingData}>
              {selectedPublications.size === allFetchedPublications.length ? "Deselect All" : "Select All"}
            </button>
            <span className="text-sm text-gray-600">
              {selectedPublications.size} of {allFetchedPublications.length} selected
            </span>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAddSelected}
            disabled={selectedPublications.size === 0 || addingData}
          >
            {addingData ? "Adding..." : `Add Selected (${selectedPublications.size})`}
          </button>
        </div>
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-4">
            {/* MAtched Duplicates */}
            {duplicatePublications.length > 0 && (
              <div className="border border-orange-200 rounded-lg">
                <button
                  type="button"
                  className="w-full p-4 flex items-center justify-between bg-orange-50 hover:bg-orange-100 transition-colors rounded-lg"
                  onClick={() => setDuplicatesExpanded(!duplicatesExpanded)}
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-4 h-4 transition-transform ${duplicatesExpanded ? "rotate-90" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-medium text-orange-800">
                      Potential Duplicates ({duplicatePublications.length} Scopus publications with matches)
                    </span>
                  </div>
                  <span className="text-sm text-orange-600 font-medium">Review Needed</span>
                </button>
                {duplicatesExpanded && (
                  <div className="p-4 pt-0 space-y-3">
                    {duplicatePublications.map((matchedItem, index) => (
                      <MatchedPublicationCard key={`duplicate-${index}`} matchedItem={matchedItem} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Unmatched Scopus Publications */}
            {unmatchedScopusPublications.length > 0 && (
              <div className="border border-green-200 rounded-lg">
                <button
                  type="button"
                  className="w-full p-4 flex items-center justify-between bg-green-50 hover:bg-green-100 transition-colors rounded-lg"
                  onClick={() => setUnmatchedScopusExpanded(!unmatchedScopusExpanded)}
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-4 h-4 transition-transform ${unmatchedScopusExpanded ? "rotate-90" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-medium text-green-800">
                      New Unmatched Publications from Scopus ({unmatchedScopusPublications.length})
                    </span>
                  </div>
                  <span className="text-sm text-green-600 font-medium">Safe to Add</span>
                </button>
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

            {/* Unmatched Existing Publications */}
            {unmatchedExistingPublications.length > 0 && (
              <div className="border border-blue-200 rounded-lg">
                <button
                  type="button"
                  className="w-full p-4 flex items-center justify-between bg-blue-50 hover:bg-blue-100 transition-colors rounded-lg"
                  onClick={() => setUnmatchedExistingExpanded(!unmatchedExistingExpanded)}
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-4 h-4 transition-transform ${unmatchedExistingExpanded ? "rotate-90" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-medium text-blue-800">
                      Existing Publications without Scopus Matches ({unmatchedExistingPublications.length})
                    </span>
                  </div>
                  <span className="text-sm text-blue-600 font-medium">Reference Only</span>
                </button>
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

            {/* No publications message */}
            {duplicatePublications.length === 0 &&
              unmatchedScopusPublications.length === 0 &&
              unmatchedExistingPublications.length === 0 && (
                <div className="text-center py-8 text-gray-500">No publications found.</div>
              )}

            {/* Enhanced validation debug */}
            <div className="text-xs text-gray-500 text-center p-2 bg-gray-50 rounded">
              <div className="mb-2 font-medium">Validation Summary:</div>
              <div>
                Fetched from Scopus: {allFetchedPublications.length} | 
                Existing in CV: {existingPublications.length}
              </div>
              <div>
                Matched (duplicates): {duplicatePublications.length} | 
                New (unmatched): {unmatchedScopusPublications.length} | 
                Existing unmatched: {unmatchedExistingPublications.length}
              </div>
              <div>
                Validation: {duplicatePublications.length} + {unmatchedScopusPublications.length} = {duplicatePublications.length + unmatchedScopusPublications.length} 
                {duplicatePublications.length + unmatchedScopusPublications.length === allFetchedPublications.length ? (
                  <span className="text-green-600 ml-2">✓ Valid</span>
                ) : (
                  <span className="text-red-600 ml-2">✗ Invalid</span>
                )}
              </div>
              <div className="mt-1">
                Raw matches: {matchedPublications.length} total | 
                Unique Scopus matched: {new Set(matchedPublications.map(m => m.fetchedPublication.originalIndex)).size} | 
                Unique existing matched: {new Set(matchedPublications.map(m => m.existingPublication.user_cv_data_id)).size}
              </div>
              <div>
                Match types: Title: {matchedPublications.filter((m) => m.matchType === "title").length}, 
                DOI: {matchedPublications.filter((m) => m.matchType === "doi").length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default PublicationsSelectModal;
