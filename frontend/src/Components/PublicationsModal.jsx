import React, { useState, useEffect } from 'react';
import '../CustomStyles/scrollbar.css';
import '../CustomStyles/modal.css';
import { addUserCVData, getPublicationMatches, getUserCVData, getOrcidSections } from '../graphql/graphqlHelpers';
import { useNavigate } from 'react-router-dom';

const PublicationsModal = ({ user, section, onClose, setRetrievingData, fetchData }) => {
  const [allFetchedPublications, setAllFetchedPublications] = useState([]); 
  const [pageSize, setPageSize] = useState(25); // Number of publications to fetch per page 
  const [totalResults, setTotalResults] = useState('TBD'); 
  const [currentPage, setCurrentPage] = useState(0); 
  const [fetchingData, setFetchingData] = useState(true); 
  const [addingData, setAddingData] = useState(false); 
  const [initialRender, setInitialRender] = useState(true); 
  const [currentScopusId, setCurrentScopusId] = useState(''); 

  const [count, setCount] = useState(1); // Initialize count in state

  const navigate = useNavigate();

  async function fetchPublicationsData() {
    setInitialRender(false);
    try {
      let publications = [];

      // Fetch data from Scopus
      const scopusIds = user.scopus_id.split(',');
      for (let scopusId of scopusIds) {
        setCurrentScopusId(scopusId.trim());
        let pageNumber = 0;
        let totalPages = 1;

        while (pageNumber <= totalPages) {
          const retrievedData = await getPublicationMatches(scopusId.trim(), pageNumber, pageSize);
          publications = [...publications, ...retrievedData.publications];
          totalPages = retrievedData.total_pages;
          setTotalResults(retrievedData.total_results);
          pageNumber += 1;
        }
      }

      // Fetch data from ORCID
      const orcidResponse = await getOrcidSections(user.orcid_id, "publications");

      const orcidPublications = Array.isArray(orcidResponse.publications) ? orcidResponse.publications : [];
      publications = [...publications, ...orcidPublications];
      

      // Remove duplicates based on DOI (prefer Scopus if DOI matches)
      publications = deduplicatePublications(publications);

      // Add publications to the state
      addPublicationsData(publications);
      setAllFetchedPublications(publications);
    } catch (error) {
      console.error('Error fetching publications data:', error);
    }
    setFetchingData(false);
  }


function deduplicatePublications(publications) {
  const seen = new Map();

  function countNonNullProperties(publication) {
      return Object.values(publication).reduce((count, value) => {
          if (Array.isArray(value)) {
              return count + value.filter((item) => item !== null && item !== "").length;
          }
          return count + (value !== null && value !== "" ? 1 : 0);
      }, 0);
  }

  publications.forEach((publication) => {
      const doi = publication.doi || "";
      const title = publication.title || "";
      const key = `${doi}|${title}`; // Unique key combining DOI and Title

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

    const existingPublications = await getUserCVData(user.user_id, section.data_section_id);
    const existingData = existingPublications.map((pub) => pub.data_details);

    for (const publication of publications) {
      if (existingData.includes(JSON.stringify(publication))) {
        setCount(prevCount => prevCount + 1);
        continue;
      }

      publication.title = publication.title.replace(/"/g, '');
      publication.journal = publication.journal.replace(/"/g, '');
      const publicationJSON = JSON.stringify(publication).replace(/"/g, '\\"');

      try {
        const result = await addUserCVData(user.user_id, section.data_section_id, `"${publicationJSON}"`, false);
      } catch (error) {
        console.error('Error adding new entry:', error);
      }
      setCount(prevCount => prevCount + 1);
    }
    setAddingData(false);
    fetchData();
  }

  const navigateHome = () => {
    navigate('/');
  }


  return (
    <dialog className="modal-dialog" open>
      <button
        type="button"
        className={`btn btn-sm btn-circle btn-ghost absolute right-4 top-4 ${fetchingData && !initialRender ? 'cursor-not-allowed' : ''}`}
        onClick={onClose}
        disabled={fetchingData && !initialRender}
      >
        ✕
      </button>
      {initialRender ? (
        user.scopus_id !== '' ? (
          <div className='flex flex-col items-center justify-center w-full mt-5 mb-5'>
            <div className='text-center'>
              The data is fetched from Elsevier and ORCID using your Scopus ID(s) and ORCID ID.
            </div>
            <button
              type="button"
              className="btn btn-secondary mt-4 text-white"
              onClick={() => fetchPublicationsData()}
            >
              Fetch Publications
            </button>
          </div>
        ) : (
          <div className='flex items-center justify-center w-full mt-5 mb-5'>
            <div className="block text-m mb-1 mt-6 mr-5 ml-5 text-zinc-600">
              Please enter your Scopus ID/ ORCID ID in the Profile section to fetch publications.
            </div>
            <button
              type="button"
              className="btn btn-secondary text-white"
              onClick={() => navigateHome()}
            >
              Go to Profile Section
            </button>
          </div>
        )
      ) : fetchingData ? (
        <div className='flex flex-col items-center justify-center w-full mt-5 mb-5'>
          <div className="block text-lg font-bold mb-2 mt-6 text-zinc-600">
            Fetching data for Scopus ID - {currentScopusId}
            <br />
            Fetching data for ORCID ID - {user.orcid_id}
          </div>
          <div className="block text-m mb-1 text-zinc-600">
          Fetching {Math.min((currentPage + 1) * pageSize, totalResults)} out of {totalResults} publications...
          </div>
        </div>
      ) : (
        <div className='flex items-center justify-center w-full mt-5 mb-5'>
          <div className="block text-m mb-1 mt-6 text-zinc-600">
            {addingData ? `Adding ${count} of ${allFetchedPublications.length} publications...` : (allFetchedPublications.length === 0 ? "No Publications Found" : "Publications Added!")}
          </div>
        </div>
      )}
    </dialog>
  );
  
};

export default PublicationsModal;
