import React, { useState, useEffect } from 'react';
import '../CustomStyles/scrollbar.css';
import '../CustomStyles/modal.css';
import { addUserCVData, getPublicationMatches } from '../graphql/graphqlHelpers';
import { useNavigate } from 'react-router-dom';

const PublicationsModal = ({ user, section, onClose, setRetrievingData, fetchData }) => {
  const [allFetchedPublications, setAllFetchedPublications] = useState([]);
  const [pageSize, setPageSize] = useState(20); // Number of publications to fetch per page
  const [totalResults, setTotalResults] = useState('TBD');
  const [currentPage, setCurrentPage] = useState(0);
  const [fetchingData, setFetchingData] = useState(true);
  const [addingData, setAddingData] = useState(false);
  const [initialRender, setInitialRender] = useState(true);
  const navigate = useNavigate();

  async function fetchPublicationsData() {
    setInitialRender(false);
    try {
      let pageNumber = 0;
      let totalPages = 44; // Initialize with 1 to enter the loop
      let totalResults = 0;
      let publications = [];

      while (pageNumber < totalPages - 42) { // + 1
        const retrievedData = await getPublicationMatches('55765887300', pageNumber, pageSize); //change to loop through real scopus ids
        console.log(retrievedData);

        // Add the publications from the current page to the array
        publications = [...publications, ...retrievedData.publications];

        // Update totalPages, totalResults, and increment pageNumber
        totalPages = retrievedData.total_pages;
        totalResults = retrievedData.total_results;
        pageNumber += 1;
        setCurrentPage(pageNumber);
        setTotalResults(totalResults);
      }
      addPublicationsData(publications);
      setAllFetchedPublications(publications);
    } catch (error) {
      console.error('Error fetching publications data:', error);
    }
    setFetchingData(false);
  }

  async function addPublicationsData(publications) {
    setAddingData(true);
    console.log('Adding publications data...', publications);
    for (const publication of publications) {
        const publicationJSON = JSON.stringify(publication).replace(/"/g, '\\"');
        // Handle adding new entry using data_details
        try {
          //const data_details_json = data_details.replace(/"/g, '\\"'); // Escape special characters
          console.log('Adding new entry:', `"${publicationJSON}"`);
          const result = await addUserCVData(user.user_id, section.data_section_id, `"${publicationJSON}"`);
          console.log(result);
        } catch (error) {
          console.error('Error adding new entry:', error);
        }
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
        className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
        onClick={onClose}
        disabled={fetchingData && !initialRender}
      >
        ✕
      </button>
      {initialRender ? (
        user.scopus_id !== '' ? (
          <div className='flex items-center justify-center w-full mt-5 mb-5'>
            <button
              type="button"
              className="btn btn-secondary text-white"
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
        <div className='flex items-center justify-center w-full mt-5 mb-5'>
          <div className="block text-m mb-1 mt-6 mr-5 ml-5 text-zinc-600">
            Fetching {(currentPage + 1) * pageSize} out of {totalResults} publications...
          </div>
        </div>
      ) : (
        <div className='flex items-center justify-center w-full mt-5 mb-5'>
          <div className="block text-m mb-1 mt-6 text-zinc-600">
            {addingData ? "Adding publication data..." : (allFetchedPublications.length === 0 ? "No Publications Found" : "Publications Added!")}
          </div>
        </div>
      )}
    </dialog>
  );
  
};

export default PublicationsModal;
