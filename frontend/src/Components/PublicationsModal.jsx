import React, { useState, useEffect } from "react";
import "../CustomStyles/scrollbar.css";
import "../CustomStyles/modal.css";
import {
  addUserCVData,
  getPublicationMatches,
  getUserCVData,
  getOrcidSections,
  getTotalOrcidPublications,
  getOrcidPublication,
  getAllSections,
} from "../graphql/graphqlHelpers";
import { useNavigate } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";

const PublicationsModal = ({
  user,
  section,
  onClose,
  setRetrievingData,
  fetchData,
}) => {
  const [allFetchedPublications, setAllFetchedPublications] = useState([]);
  const [totalResults, setTotalResults] = useState("TBD");
  const [currentPage, setCurrentPage] = useState(0);
  const [fetchingData, setFetchingData] = useState(true);
  const [addingData, setAddingData] = useState(false);
  const [initialRender, setInitialRender] = useState(true);
  const [currentScopusId, setCurrentScopusId] = useState("");

  const [count, setCount] = useState(1); // Initialize count in state
  const [fetchStage, setFetchStage] = useState(""); // "scopus", "orcid", "deduplicate", "add"

  const navigate = useNavigate();
  const baseUrl = window.location.hostname.startsWith("dev.")
    ? "https://02m9a64mzf.execute-api.ca-central-1.amazonaws.com/dev"
    : "https://02m9a64mzf.execute-api.ca-central-1.amazonaws.com/dev";

  async function fetchPublicationsData() {
    setInitialRender(false);
    setFetchingData(true);
    let publications = [];
    let failedScopusBatches = [];
    let failedOrcidBatches = [];
    let expectedTotalCount = 0;

    // Scopus
    const hasScopus = user.scopus_id && user.scopus_id.trim() !== "";
    if (hasScopus) {
      setFetchStage("scopus");
      const scopusIds = user.scopus_id
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id !== "");
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      if (!idToken) throw new Error("Auth Error: No ID token found.");

      for (let scopusId of scopusIds) {
        setCurrentScopusId(scopusId);
        try {
          // Get total publications with retry mechanism
          let totalPublications = 0;
          let retryCount = 0;
          const maxRetries = 3;

          while (retryCount < maxRetries) {
            try {
              const countPayload = {
                arguments: {
                  scopus_id: scopusId,
                },
              };

              const countResponse = await fetch(
                `${baseUrl}/getTotalScopusPublications`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                  },
                  body: JSON.stringify(countPayload),
                }
              );

              if (!countResponse.ok)
                throw new Error(`Server error: ${countResponse.status}`);

              const countData = await countResponse.json();
              totalPublications = countData.total_results || 0;
              expectedTotalCount += totalPublications;
              setTotalResults(totalPublications);
              console.log(`Total Scopus publications: ${totalPublications}`);
              break; // Success, exit retry loop
            } catch (error) {
              retryCount++;
              console.error(
                `Error fetching Scopus count (attempt ${retryCount}):`,
                error
              );
              if (retryCount >= maxRetries) throw error; // Rethrow if max retries reached
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * retryCount)
              ); // Exponential backoff
            }
          }

          // Now fetch in batches
          const maxBatchSize = 100;
          for (
            let startIndex = 0;
            startIndex < totalPublications;
            startIndex += maxBatchSize
          ) {
            const batchSize = Math.min(
              maxBatchSize,
              totalPublications - startIndex
            );

            const batchPayload = {
              arguments: {
                scopus_id: scopusId,
                start_index: startIndex,
                batch_size: batchSize,
              },
            };

            try {
              const batchResponse = await fetch(
                `${baseUrl}/getBatchedScopusPublications`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                  },
                  body: JSON.stringify(batchPayload),
                }
              );

              if (!batchResponse.ok)
                throw new Error(`Server error: ${batchResponse.status}`);

              const batchData = await batchResponse.json();
              console.log(
                `Fetched ${batchData.publications.length} publications from Scopus (batch starting at ${startIndex})`
              );
              publications = [...publications, ...batchData.publications];
            } catch (error) {
              console.error(
                `Error fetching Scopus batch (start: ${startIndex}):`,
                error
              );
              // Add to failed batches queue
              failedScopusBatches.push({
                scopusId,
                startIndex,
                batchSize,
                batchPayload,
              });
            }
          }
        } catch (error) {
          console.error("Error in Scopus publication fetch process:", error);
        }
      }
    }
    console.log("Total Scopus Publications fetched:", publications.length);
    console.log("Failed Scopus batches:", failedScopusBatches.length);

    // ORCID
    const hasOrcid = user.orcid_id && user.orcid_id.trim() !== "";
    if (hasOrcid) {
      setFetchStage("orcid");

      try {
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString();
        if (!idToken) throw new Error("Auth Error: No ID token found.");

        // Get ORCID put codes with retry mechanism
        let allPutCodes = [];
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          try {
            const putCodesPayload = {
              arguments: {
                orcid_id: user.orcid_id,
              },
            };

            // Using POST for fetching put codes
            const putCodesResponse = await fetch(
              `${baseUrl}/getTotalOrcidPublications`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify(putCodesPayload),
              }
            );

            if (!putCodesResponse.ok)
              throw new Error(`Server error: ${putCodesResponse.status}`);

            const putCodesData = await putCodesResponse.json();
            allPutCodes = putCodesData.put_codes || [];
            const totalOrcidPublications = allPutCodes.length;
            expectedTotalCount += totalOrcidPublications;

            console.log(`Got ${totalOrcidPublications} put codes from ORCID`);
            setTotalResults((prev) => prev + totalOrcidPublications);
            break; // Success, exit retry loop
          } catch (error) {
            retryCount++;
            console.error(
              `Error fetching ORCID put codes (attempt ${retryCount}):`,
              error
            );
            if (retryCount >= maxRetries) throw error; // Rethrow if max retries reached
            await new Promise((resolve) =>
              setTimeout(resolve, 100 * retryCount)
            ); // Exponential backoff
          }
        }

        // Now fetch in batches
        const maxBatchSize = 250;
        for (
          let startIndex = 0;
          startIndex < allPutCodes.length;
          startIndex += maxBatchSize
        ) {
          const batchPutCodes = allPutCodes.slice(
            startIndex,
            startIndex + maxBatchSize
          );

          const batchPayload = {
            arguments: {
              orcid_id: user.orcid_id,
              put_codes: batchPutCodes,
            },
          };

          try {
            const batchResponse = await fetch(
              `${baseUrl}/getBatchedOrcidPublications`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify(batchPayload),
              }
            );

            if (!batchResponse.ok)
              throw new Error(`Server error: ${batchResponse.status}`);

            const batchData = await batchResponse.json();
            console.log(
              `Fetched ${batchData.publications.length} publications from ORCID (batch starting at ${startIndex})`
            );

            publications = [...publications, ...batchData.publications];
          } catch (error) {
            console.error(
              `Error fetching ORCID batch (start: ${startIndex}):`,
              error
            );
            // Add to failed batches queue
            failedOrcidBatches.push({
              startIndex,
              batchPutCodes,
              batchPayload,
            });
          }
        }
      } catch (error) {
        console.error("Error in ORCID publication fetch process:", error);
      }
    }

    console.log(
      "Publications fetched before retry attempts:",
      publications.length
    );
    console.log("Failed Scopus batches:", failedScopusBatches.length);
    console.log("Failed ORCID batches:", failedOrcidBatches.length);

    // Process failed batches
    if (failedScopusBatches.length > 0 || failedOrcidBatches.length > 0) {
      setFetchStage("retry");
      console.log("Retrying failed batches...");

      // Retry Scopus batches
      if (failedScopusBatches.length > 0) {
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString();

        for (const batch of failedScopusBatches) {
          try {
            const batchResponse = await fetch(
              `${baseUrl}/getBatchedScopusPublications`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify(batch.batchPayload),
              }
            );

            if (!batchResponse.ok)
              throw new Error(`Server error: ${batchResponse.status}`);

            const batchData = await batchResponse.json();
            console.log(
              `Retry successful: Fetched ${batchData.publications.length} publications from Scopus (batch starting at ${batch.startIndex})`
            );
            publications = [...publications, ...batchData.publications];
          } catch (error) {
            console.error(
              `Failed retry for Scopus batch (start: ${batch.startIndex}):`,
              error
            );
          }
        }
      }

      // Retry ORCID batches
      if (failedOrcidBatches.length > 0) {
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString();

        for (const batch of failedOrcidBatches) {
          try {
            const batchResponse = await fetch(
              `${baseUrl}/getBatchedOrcidPublications`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify(batch.batchPayload),
              }
            );

            if (!batchResponse.ok)
              throw new Error(`Server error: ${batchResponse.status}`);

            const batchData = await batchResponse.json();
            console.log(
              `Retry successful: Fetched ${batchData.publications.length} publications from ORCID (batch starting at ${batch.startIndex})`
            );
            publications = [...publications, ...batchData.publications];
          } catch (error) {
            console.error(
              `Failed retry for ORCID batch (start: ${batch.startIndex}):`,
              error
            );
          }
        }
      }
    }

    // Handle empty case
    if (publications.length === 0) {
      console.warn("No publications fetched from either source");
    } else {
      // Validate total count
      console.log(
        `Total publications fetched: ${publications.length}. Expected: ~${expectedTotalCount}`
      );
      if (publications.length < expectedTotalCount * 0.9) {
        console.warn(
          `Warning: Only fetched ${publications.length} of approximately ${expectedTotalCount} expected publications`
        );
      }
    }

    // Deduplication
    setFetchStage("deduplicate");
    publications = deduplicatePublications(publications);

    // Adding
    setAllFetchedPublications(publications);
    setFetchStage("add");
    await addPublicationsData(publications);

    setFetchingData(false);
  }

  function deduplicatePublications(publications) {
    const seen = new Map();

    function countNonNullProperties(publication) {
      return Object.values(publication).reduce((count, value) => {
        if (Array.isArray(value)) {
          return (
            count + value.filter((item) => item !== null && item !== "").length
          );
        }
        return count + (value !== null && value !== "" ? 1 : 0);
      }, 0);
    }

    publications.forEach((publication) => {
      const doi = publication.doi || "";
      const title = publication.title || "";
      const key = `${doi}|${title ? title.toLowerCase() : ""}`; // Unique key combining DOI and Title

      // Check if any matching DOI or Title already exists
      const existingKey = Array.from(seen.keys()).find((existingKey) => {
        const [existingDoi, existingTitle] = existingKey.split("|");
        return doi === existingDoi || title === existingTitle;
      });

      if (existingKey) {
        const existingPublication = seen.get(existingKey);
        const existingCount = countNonNullProperties(existingPublication);
        const currentCount = countNonNullProperties(publication);

        // Replace if the current publication has more non-null items
        if (currentCount > existingCount) {
          seen.delete(existingKey);
          seen.set(key, publication);
        }
      } else {
        // Add new publication if no matching DOI or Title exists
        seen.set(key, publication);
      }
    });

    return Array.from(seen.values());
  }

  async function addPublicationsData(publications) {
    setAddingData(true);
    setCount(1);

    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      if (!idToken) throw new Error("Auth Error: No ID token found.");

      let dataSections = [];
      dataSections = await getAllSections();
      const publicationsSectionId = dataSections.find(
        (section) => section.title === "Publications"
      )?.data_section_id;

      const payload = {
        arguments: {
          data_details_list: publications,
          user_id: user.user_id,
          data_section_id: publicationsSectionId,
          editable: "false",
        },
      };
      const baseUrl = window.location.hostname.startsWith("dev.")
        ? "https://02m9a64mzf.execute-api.ca-central-1.amazonaws.com/dev"
        : "https://02m9a64mzf.execute-api.ca-central-1.amazonaws.com/dev";

      const response = await fetch(`${baseUrl}/addBatchedData`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      else {
        console.log(
          "Added ",
          payload.arguments.data_details_list.length,
          " Publications Successfully | 200 OK"
        );
      }
    } catch (error) {
      console.error("Error adding publications:", error);
    }
    // try {
    //   const result = await addUserCVData(
    //     user.user_id,
    //     section.data_section_id,
    //     publicationJSON,
    //     false
    //   );
    // } catch (error) {
    //   console.error("Error adding new entry:", error);
    // }
    console.log("Saved ", publications.length, " publications successfully");
    setAddingData(false);
    fetchData();
  }

  const navigateHome = () => {
    navigate("/");
  };

  // Add this inside PublicationsModal, before the return statement
  const IdCard = ({ label, value, color, link }) => (
    <div
      className="bg-gray-50 rounded-lg p-4 border"
      style={{ borderColor: color }}
    >
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
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
          user.scopus_id !== "" || user.orcid_id !== "" ? (
            <div className="flex flex-col items-center justify-center w-full mt-5 mb-5">
              <div className="text-center mb-6 w-full">
                <h3 className="text-lg font-medium mb-8">
                  Publications will be fetched from Elsevier and ORCID using
                  these profiles:
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
                  <IdCard
                    label="ORCID ID"
                    value={user.orcid_id}
                    color="#ea580c"
                    link={
                      user.orcid_id
                        ? `https://orcid.org/${user.orcid_id}`
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
                Fetch Publications
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full mt-5 mb-5">
              <div className="block text-m mb-1 mt-6 mr-5 ml-5 text-zinc-600 text-center">
                Please enter your Scopus/ORCID ID in the Profile section to
                fetch publications.
              </div>
              <button
                type="button"
                className="btn btn-secondary text-white mt-6 "
                onClick={() => navigateHome()}
              >
                Go to Profile Section
              </button>
            </div>
          )
        ) : fetchingData ? (
          <div className="flex flex-col items-center justify-center w-full mt-5 mb-5">
            {fetchStage === "scopus" && (
              <div className="block text-lg font-bold mb-2 mt-6 text-zinc-600">
                Fetching data from Scopus...
              </div>
            )}
            {fetchStage === "orcid" && (
              <div className="block text-lg font-bold mb-2 mt-6 text-zinc-600">
                Fetching data from ORCID...
              </div>
            )}
            {fetchStage === "deduplicate" && (
              <div className="block text-lg font-bold mb-2 mt-6 text-zinc-600">
                Removing duplicates...
              </div>
            )}
            {fetchStage === "add" && (
              <div className="block text-lg font-bold mb-2 mt-6 text-zinc-600">
                {addingData
                  ? `Adding ${allFetchedPublications.length} publications...`
                  : allFetchedPublications.length === 0
                  ? "No Publications Found"
                  : "Publications Added!"}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center w-full mt-5 mb-5">
            <div className="block text-lg font-bold mb-2 mt-6 text-zinc-600">
              {addingData
                ? `Adding ${allFetchedPublications.length} publications...`
                : allFetchedPublications.length === 0
                ? "No Publications Found"
                : "Publications Added!"}
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
};

export default PublicationsModal;
