import React from "react";

const GrantWithDuplicates = ({ grantItem, duplicates, normalizeYear }) => {
  const maxSimilarity = Math.max(...duplicates.map((d) => d.similarity.overall));

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <div className="w-6 h-6 bg-gray-200 border border-gray-300 rounded flex items-center justify-center">
            <span className="text-gray-600 text-sm font-bold">✕</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          <div>
            <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Found in Database ({maxSimilarity}% match)
            </div>
            <div className="border border-gray-200 rounded-lg p-3 bg-white">
              <div className="text-sm space-y-2 text-gray-700">
                <div>
                  <span className="font-semibold text-gray-800">Title:</span> {grantItem.grant.title}
                </div>
                <div>
                  <span className="font-semibold text-gray-800">Year:</span>{" "}
                  {normalizeYear(grantItem.grant.year || grantItem.grant.dates) || "N/A"}
                </div>
                <div>
                  <span className="font-semibold text-gray-800">Amount:</span> {grantItem.grant.amount || "N/A"}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Already in Your CV
            </div>
            {duplicates.map((duplicate, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-white">
                <div className="text-sm space-y-2 text-gray-700">
                  <div>
                    <span className="font-semibold text-gray-800">Title:</span> {duplicate.existingGrant.title}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">Agency:</span>{" "}
                    {duplicate.existingGrant.agency || duplicate.existingGrant.sponsor || "N/A"}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">Year:</span>{" "}
                    {normalizeYear(duplicate.existingGrant.year || duplicate.existingGrant.dates) || "N/A"}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">Amount:</span> {duplicate.existingGrant.amount || "N/A"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrantWithDuplicates;
