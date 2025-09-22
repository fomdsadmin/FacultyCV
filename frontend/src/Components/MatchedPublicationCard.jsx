import React from "react";
import { extractDOIsFromCitation } from "../utils/publicationsMergeUtils";
import { truncateAuthors } from "utils/publicationsMergeUtils";

const MatchedPublicationCard = ({ matchedItem, selectedPublications, handleSelectPublication }) => {
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
          {hasDOIMatch && (
            <>
              <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                {matchedItem.doiSimilarity !== undefined && matchedItem.doiSimilarity < 1.0
                  ? `${Math.round(matchedItem.doiSimilarity * 100)}% DOI`
                  : "DOI Match"}
              </span>
              {matchedItem.authorSimilarity !== undefined && (
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                  {Math.round(matchedItem.authorSimilarity * 100)}% Author
                </span>
              )}
              {matchedItem.combinedScore !== undefined && matchedItem.doiSimilarity < 1.0 && (
                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                  {Math.round(matchedItem.combinedScore * 100)}% Combined
                </span>
              )}
            </>
          )}
          {hasTitleMatch && (
            <>
              <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                {matchedItem.similarity ? `${Math.round(matchedItem.similarity * 100)}% Title` : "Title Match"}
              </span>
              {matchedItem.authorSimilarity !== undefined && (
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                  {Math.round(matchedItem.authorSimilarity * 100)}% Author
                </span>
              )}
              {matchedItem.combinedScore !== undefined && (
                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                  {Math.round(matchedItem.combinedScore * 100)}% Combined
                </span>
              )}
            </>
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
              checked={selectedPublications && selectedPublications.has(matchedItem.fetchedPublication.originalIndex)}
              onChange={() => handleSelectPublication(matchedItem.fetchedPublication.originalIndex)}
              className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">NEW FROM SCOPUS</span>
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
                {matchedItem.fetchedPublication.author_names && (
                  <p>
                    <span className="font-medium">Authors:</span>{" "}
                    {truncateAuthors(matchedItem.fetchedPublication.author_names)}
                  </p>
                )}
                {(matchedItem.fetchedPublication.journal_title || matchedItem.fetchedPublication.journal) && (
                  <p>
                    <span className="font-medium">Journal:</span>{" "}
                    {matchedItem.fetchedPublication.journal_title || matchedItem.fetchedPublication.journal}
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
                {existingPub.data_details.author_names && (
                  <p>
                    <span className="font-medium">Authors:</span>{" "}
                    {truncateAuthors(existingPub.data_details.author_names)}
                  </p>
                )}
                {(existingPub.data_details.journal_title || existingPub.data_details.journal) && (
                  <p>
                    <span className="font-medium">Journal:</span>{" "}
                    {existingPub.data_details.journal_title || existingPub.data_details.journal}
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
                    <span className="font-medium">Citation:</span> {existingPub.data_details.citation}
                  </p>
                )}
                {/* Show extracted DOI information for DOI matches */}
                {hasDOIMatch && existingPub.doiSource && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                    <p className="text-sm">
                      <span className="font-medium text-blue-700">Matched DOI Source:</span>{" "}
                      <span className="text-blue-600">
                        {existingPub.doiSource === "citation" ? "Extracted from Citation" : "Direct DOI Field"}
                      </span>
                    </p>
                    {existingPub.originalDoiText && (
                      <p className="text-xs text-blue-600 mt-1">
                        <span className="font-medium">Original:</span> "{existingPub.originalDoiText.substring(0, 100)}
                        ..."
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MatchedPublicationCard;
