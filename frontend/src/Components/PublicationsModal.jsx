import React, { useState, useEffect } from 'react';
import '../CustomStyles/scrollbar.css';
import '../CustomStyles/modal.css';
import { addUserCVData, getPublicationMatches } from '../graphql/graphqlHelpers';
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

      // Split the scopus_id string into an array of IDs
      const scopusIds = user.scopus_id.split(',');

      // Loop through each scopus ID
      for (let scopusId of scopusIds) {
        setCurrentScopusId(scopusId.trim()); // Set currentScopusId before fetching data
        let pageNumber = 0;
        let totalPages = 1; // Initialize with 1 to enter the loop
        let totalResults = 0;

        // Fetch data for the current scopus ID
        while (pageNumber <= totalPages) {
          const retrievedData = await getPublicationMatches(scopusId.trim(), pageNumber, pageSize);
          

          // Add the publications from the current page to the array
          publications = [...publications, ...retrievedData.publications];

          // Update totalPages, totalResults, and increment pageNumber
          totalPages = retrievedData.total_pages;
          totalResults = retrievedData.total_results;
          pageNumber += 1;
          setCurrentPage(pageNumber);
          setTotalResults(totalResults);
        }
      }

      // Add publications to the state
      addPublicationsData(publications);
      setAllFetchedPublications(publications);
    } catch (error) {
      console.error('Error fetching publications data:', error);
    }
    setFetchingData(false);
  }

  async function addPublicationsData(publications) {
    setAddingData(true);
    setCount(1); // Reset count to 1 before starting
    
    for (const publication of publications) {
      publication.title = publication.title.replace(/"/g, '');
      publication.journal = publication.journal.replace(/"/g, '');
      const publicationJSON = JSON.stringify(publication).replace(/"/g, '\\"');
      // Handle adding new entry using data_details
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
              The data is fetched from Elsevier using your Scopus ID(s).
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
              Please enter your Scopus ID in the Profile section to fetch publications.
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
