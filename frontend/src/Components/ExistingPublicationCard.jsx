import React from "react";
import { extractDOIsFromCitation } from '../utils/publicationsMergeUtils';
import { truncateAuthors } from "utils/publicationsMergeUtils";

const ExistingPublicationCard = ({ publication, selectedExistingPublications, handleSelectExistingPublication,  }) => {
  // Extract DOIs from citation text to show what was extracted
  const extractedDOIs = publication.data_details.citation
    ? extractDOIsFromCitation(publication.data_details.citation)
    : [];

  return (
    <div
      className={`border rounded-lg p-3 cursor-pointer transition-colors my-2 ${
        selectedExistingPublications.has(publication.user_cv_data_id)
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
      onClick={() => handleSelectExistingPublication(publication.user_cv_data_id)}
    >
      <div className="flex items-start gap-2">
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
          <h4 className="font-medium text-gray-900 mb-1 leading-tight text-sm">
            {publication.data_details.title || "Untitled"}
          </h4>
          <div className="text-xs text-gray-600 space-y-1">
            {publication.data_details.end_date && (
              <p>
                <span className="font-medium">Date:</span> {publication.data_details.end_date}
              </p>
            )}
            {publication.data_details.author_names && (
              <p>
                <span className="font-medium">Authors:</span> {truncateAuthors(publication.data_details.author_names)}
              </p>
            )}
            {publication.data_details.authors && (
              <p>
                <span className="font-medium">Authors:</span> {truncateAuthors(publication.data_details.authors)}
              </p>
            )}
            {(publication.data_details.journal_title || publication.data_details.journal) && (
              <p>
                <span className="font-medium">Journals:</span>{" "}
                {publication.data_details.journal_title || publication.data_details.journal}
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
                    <span className="font-medium text-gray-600">Extracted DOI(s):</span>
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

export default ExistingPublicationCard;
