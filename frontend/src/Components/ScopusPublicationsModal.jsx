import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import { fetchAuthSession } from "aws-amplify/auth";
import { addStagingScopusPublications } from "../graphql/graphqlHelpers";

const ScopusPublicationsModal = ({ user, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [publications, setPublications] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [fetchCompleted, setFetchCompleted] = useState(false);
  const [currentScopusId, setCurrentScopusId] = useState("");

  let baseUrl = process.env.REACT_APP_BATCH_API_BASE_URL || "";
  // omit the last '/' from baseUrl
  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }

  const handleFetchPublications = async () => {
    setLoading(true);
    setMessage("");
    setError("");
    setPublications([]);
    setFetchCompleted(false);

    try {
      let allPublications = [];

      // Check if user has Scopus ID
      const hasScopus = user.scopus_id && user.scopus_id.trim() !== "";
      if (!hasScopus) {
        throw new Error("No Scopus ID found for this user");
      }

      const scopusIds = user.scopus_id
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id !== "");

      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      if (!idToken) throw new Error("Auth Error: No ID token found.");

      for (let scopusId of scopusIds) {
        setCurrentScopusId(scopusId);
        console.log(`Fetching publications for Scopus ID: ${scopusId}`);
        try {
          // Get total publications count
          const countPayload = {
            arguments: {
              scopus_id: scopusId,
            },
          };

          const countResponse = await fetch(`${baseUrl}/batch/getTotalScopusPublications`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify(countPayload),
          });

          
          if (!countResponse.ok) throw new Error(`Server error: ${countResponse.status}`);
          
          const countData = await countResponse.json();
          console.log(countData)
          const totalPublications = countData.total_results || 0;
          setTotalResults(totalPublications);
          console.log(`Total Scopus publications: ${totalPublications}`);

          // Fetch in batches
          const maxBatchSize = 50;
          for (let startIndex = 0; startIndex < totalPublications; startIndex += maxBatchSize) {
            const batchSize = Math.min(maxBatchSize, totalPublications - startIndex);

            const batchPayload = {
              arguments: {
                scopus_id: scopusId,
                start_index: startIndex,
                batch_size: batchSize,
              },
            };

            const batchResponse = await fetch(`${baseUrl}/batch/getBatchedScopusPublications`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify(batchPayload),
            });

            if (!batchResponse.ok) throw new Error(`Server error: ${batchResponse.status}`);

            const batchData = await batchResponse.json();
            console.log(
              `Fetched ${batchData.publications.length} publications from Scopus (batch starting at ${startIndex})`
            );
            allPublications = [...allPublications, ...batchData.publications];
          }
        } catch (error) {
          console.error("Error in Scopus publication fetch process:", error);
          throw error;
        }
      }

      console.log("Total Scopus Publications fetched:", allPublications.length);
      setPublications(allPublications);
      setFetchCompleted(true);
      setMessage(`Successfully fetched ${allPublications.length} publications from Scopus`);
    } catch (err) {
      console.error("Error fetching publications:", err);
      setError(`Error fetching publications: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDatabase = async () => {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      // Convert publications to JSON strings since GraphQL expects AWSJSON type
      const publicationsAsJson = publications.map(pub => JSON.stringify(pub));
      
      // Use the new GraphQL mutation to save to scopus_publications table
      const result = await addStagingScopusPublications(user.user_id, publicationsAsJson);
      
      if (result && !result.includes("Error")) {
        setMessage(`Successfully saved ${publications.length} publications to staging table.`);
      } else {
        throw new Error(result || "Failed to save publications to database");
      }
    } catch (err) {
      console.error("Error saving publications:", err);
      setError(`Error saving publications: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Fetch Scopus Publications</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" disabled={loading}>
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!fetchCompleted ? (
            <>
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  This will fetch all publications for{" "}
                  <span className="font-semibold">
                    {user.first_name} {user.last_name}
                  </span>{" "}
                  from Scopus and save them to the staging table.
                </p>
                {user.scopus_id ? (
                  <p className="text-sm text-gray-500">Scopus ID: {user.scopus_id}</p>
                ) : (
                  <p className="text-sm text-orange-600">Warning: No Scopus ID found for this user.</p>
                )}
              </div>

              {/* Status Messages */}
              {loading && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-blue-700">
                      Fetching publications from Scopus...
                      {currentScopusId && ` (ID: ${currentScopusId})`}
                      {totalResults > 0 && ` (${totalResults} total found)`}
                    </span>
                  </div>
                </div>
              )}

              {message && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <span className="text-green-700">{message}</span>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleFetchPublications}
                  disabled={loading || !user.scopus_id}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Fetching..." : "Fetch Publications"}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Publications List */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Fetched Publications ({publications.length})</h3>
                  <button
                    onClick={handleSaveToDatabase}
                    disabled={loading || publications.length === 0}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving..." : "Add to Staging Table"}
                  </button>
                </div>

                {/* Success/Error Messages */}
                {message && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <span className="text-green-700">{message}</span>
                  </div>
                )}

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <span className="text-red-700">{error}</span>
                  </div>
                )}

                {/* Publications List */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    {publications.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {publications.slice(0, 100).map((publication, index) => (
                          <div key={index} className="p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 pr-4">
                                <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                                  {publication.title || "Untitled"}
                                </h4>
                                <p className="text-sm text-gray-600 mb-1">
                                  {publication.end_date && `${publication.end_date}`}
                                  {publication.journal_title ? ` • ${publication.journal_title}` : ""}
                                </p>
                                {publication.doi && (
                                  <p className="text-xs text-blue-600 font-mono">DOI: {publication.doi}</p>
                                )}
                              </div>
                              <div className="text-xs text-gray-400 whitespace-nowrap">#{index + 1}</div>
                            </div>
                          </div>
                        ))}
                        {publications.length > 100 && (
                          <div className="p-4 text-center text-gray-500 bg-gray-50">
                            ... and {publications.length - 100} more publications
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-500">No publications found</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setFetchCompleted(false);
                    setPublications([]);
                    setMessage("");
                    setError("");
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  disabled={loading}
                >
                  Fetch Again
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  disabled={loading}
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScopusPublicationsModal;
