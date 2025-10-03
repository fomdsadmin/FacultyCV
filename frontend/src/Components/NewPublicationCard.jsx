import React from "react";
import { extractDOIsFromCitation } from "../utils/publicationsMergeUtils";
import { truncateAuthors } from "utils/publicationsMergeUtils";

const NewPublicationCard = ({ publication, index, handleSelectPublication, selectedPublications }) => (
  <div
    key={index}
    className={`border rounded-lg p-3 cursor-pointer transition-colors my-2 ${
      selectedPublications.has(index)
        ? "border-gray-500 bg-gray-50"
        : "border-gray-200 hover:border-gray-300"
    }`}
    onClick={() => handleSelectPublication(index)}
  >
    <div className="flex items-start gap-2">
      <input
        type="checkbox"
        checked={selectedPublications.has(index)}
        onChange={() => handleSelectPublication(index)}
        className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300"
      />
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 mb-1 leading-tight text-sm">{publication.title || "Untitled"}</h4>
        <div className="text-xs text-gray-600 space-y-1">
          {publication.end_date && (
            <p>
              <span className="font-medium">Date:</span> {publication.end_date}
            </p>
          )}
          {publication.author_names && (
            <p>
              <span className="font-medium">Authors:</span> {truncateAuthors(publication.author_names)}
            </p>
          )}
          {(publication.journal_title || publication.journal) && (
            <p>
              <span className="font-medium">Journals:</span> {publication.journal_title || publication.journal}
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

export default NewPublicationCard;
