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
} from "../graphql/graphqlHelpers";
import { useNavigate } from "react-router-dom";

const PublicationsModal = ({
  user,
  section,
  onClose,
  setRetrievingData,
  fetchData,
}) => {
  const [allFetchedPublications, setAllFetchedPublications] = useState([]);
  const [pageSize, setPageSize] = useState(25); // Number of publications to fetch per page
  const [totalResults, setTotalResults] = useState("TBD");
  const [currentPage, setCurrentPage] = useState(0);
  const [fetchingData, setFetchingData] = useState(true);
  const [addingData, setAddingData] = useState(false);
  const [initialRender, setInitialRender] = useState(true);
  const [currentScopusId, setCurrentScopusId] = useState("");

  const [count, setCount] = useState(1); // Initialize count in state
  const [fetchStage, setFetchStage] = useState(""); // "scopus", "orcid", "deduplicate", "add"

  const navigate = useNavigate();

  async function fetchPublicationsData() {
    setInitialRender(false);
    setFetchingData(true);
    let publications = [];

    // Scopus
    const hasScopus = user.scopus_id && user.scopus_id.trim() !== "";
    if (hasScopus) {
      setFetchStage("scopus");
      const scopusIds = user.scopus_id
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id !== "");
      for (let scopusId of scopusIds) {
        setCurrentScopusId(scopusId);
        let pageNumber = 0;
        let totalPages = 1;

        while (pageNumber <= totalPages) {
          const retrievedData = await getPublicationMatches(
            scopusId,
            pageNumber,
            pageSize
          );

          // Important defensive check
          if (!retrievedData || !retrievedData.publications) {
            console.warn("Scopus returned invalid data, skipping...");
            break;
          }

          publications = [...publications, ...retrievedData.publications];
          totalPages = retrievedData.total_pages ?? 0;
          setTotalResults(retrievedData.total_results ?? 0);
          pageNumber += 1;
        }
      }
    }

    // ORCID
    const hasOrcid = user.orcid_id && user.orcid_id.trim() !== "";
    if (hasOrcid) {
      setFetchStage("orcid");
      const totalOrcidPublications = await getTotalOrcidPublications(
        user.orcid_id
      );
      console.log("Total ORCID Publications fetched:", totalOrcidPublications);
      const putCodes = totalOrcidPublications.put_codes || [];
      const batchSize = 100;
      let orcidPublications = [];

      for (let i = 0; i < putCodes.length; i += batchSize) {
        const batch = putCodes.slice(i, i + batchSize);
        if (!batch.length || batch.some((code) => code == null)) {
          console.error("Skipping invalid or empty batch:", batch);
          continue;
        }
        const result = await getOrcidPublication(user.orcid_id, batch);
        if (result && Array.isArray(result.publications)) {
          orcidPublications = [...orcidPublications, ...result.publications];
          console.log(
            "Fetched ORCID Publications for batch:",
            orcidPublications
          );
        }
      }

      publications = [...publications, ...orcidPublications];
      totalOrcidPublications.total_results += totalResults || 0;
      setTotalResults(totalOrcidPublications.total_results ?? 0);
    }

    // Handle empty case
    if (publications.length === 0) {
      console.warn("No publications fetched from either source");
    }

    // Deduplication
    setFetchStage("deduplicate");
    publications = deduplicatePublications(publications);

    // Adding
    setAllFetchedPublications(publications); // <-- set before adding!
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

    const existingPublications = await getUserCVData(
      user.user_id,
      section.data_section_id
    );
    const existingData = existingPublications.map((pub) => pub.data_details);
    console.log("Existing publications:", existingData);

    for (const publication of publications) {
      if (
        existingData.includes(JSON.stringify(publication)) ||
        existingData.includes(publication)
      ) {
        setCount((prevCount) => prevCount + 1);
        continue;
      }

      publication.title = publication.title;
      publication.journal = publication.journal;
      const publicationJSON = JSON.stringify(publication);
      console.log("Adding new publication:", publicationJSON);

      try {
        const result = await addUserCVData(
          user.user_id,
          section.data_section_id,
          publicationJSON,
          false
        );
      } catch (error) {
        console.error("Error adding new entry:", error);
      }
      setCount((prevCount) => prevCount + 1);
    }
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
                  ? `Adding ${count} of ${allFetchedPublications.length} publications...`
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
                ? `Adding ${count} of ${allFetchedPublications.length} publications...`
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
