import React, { useState, useEffect } from 'react';
import '../CustomStyles/scrollbar.css';
import '../CustomStyles/modal.css';
import SecureFundingEntry from './SecureFundingEntry';
import { getSecureFundingMatches, getRiseDataMatches, addUserCVData } from '../graphql/graphqlHelpers';

const SecureFundingModal = ({ user, section, onClose, setRetrievingData, fetchData }) => {
  const [allSecureFundingData, setAllSecureFundingData] = useState([]);
  const [selectedSecureFundingData, setSelectedSecureFundingData] = useState([]);
  const [fetchingData, setFetchingData] = useState(true);
  const [initialRender, setInitialRender] = useState(true);
  const [addingData, setAddingData] = useState(false);

  async function fetchSecureFundingData() {
    setFetchingData(true);
    setInitialRender(false);
    try {
      // Switch to first name and last name
      const retrievedData = await getSecureFundingMatches(user.first_name, user.last_name);
      console.log(retrievedData);
  
      const allDataDetails = []; // Initialize an array to accumulate data_details
      const uniqueDataDetails = new Set(); // Initialize a set to track unique entries
  
      for (const dataObject of retrievedData) {
        const { data_details } = dataObject; // Extract the data_details property
        const data_details_json = JSON.parse(data_details);
  
        // Create a unique key based on first_name, last_name, title, and amount
        const uniqueKey = `${data_details_json.first_name}-${data_details_json.last_name}-${data_details_json.title}-${data_details_json.amount}`;
  
        // Check if the unique key is already in the set
        if (!uniqueDataDetails.has(uniqueKey)) {
          uniqueDataDetails.add(uniqueKey); // Add the unique key to the set
          allDataDetails.push(data_details_json); // Accumulate data_details
        }
      }
  
      setAllSecureFundingData(allDataDetails); // Set the state once after the loop
      setSelectedSecureFundingData(allDataDetails); // Set the selected data to all data
    } catch (error) {
      console.error('Error fetching secure funding data:', error);
    }
    setFetchingData(false);
  }

  async function fetchRiseData() {
    setFetchingData(true);
    setInitialRender(false);
    try {
      const retrievedData = await getRiseDataMatches(user.first_name, user.last_name);
      console.log(retrievedData);
  
      const allDataDetails = []; // Initialize an array to accumulate data_details
      const uniqueDataDetails = new Set(); // Initialize a set to track unique entries
  
      for (const dataObject of retrievedData) {
        const { data_details } = dataObject; // Extract the data_details property
        const data_details_json = JSON.parse(data_details);
  
        // Create a unique key based on first_name, last_name, title, and amount
        const uniqueKey = `${data_details_json.first_name}-${data_details_json.last_name}-${data_details_json.title}-${data_details_json.amount}`;
  
        // Check if the unique key is already in the set
        if (!uniqueDataDetails.has(uniqueKey)) {
          uniqueDataDetails.add(uniqueKey); // Add the unique key to the set
          allDataDetails.push(data_details_json); // Accumulate data_details
        }
      }
  
      setAllSecureFundingData(allDataDetails); // Set the state once after the loop
      setSelectedSecureFundingData(allDataDetails); // Set the selected data to all data
    } catch (error) {
      console.error('Error fetching secure funding data:', error);
    }
    setFetchingData(false);
  }

  const handleSelect = (secureFundingData, isAdded) => {
    setSelectedSecureFundingData(prevState => {
      if (isAdded) {
        return [...prevState, secureFundingData];
      } else {
        return prevState.filter(data => data !== secureFundingData);
      }
    });
  };

  async function addSecureFundingData() {
    setAddingData(true);
    for (const data of selectedSecureFundingData) {
      try {
        data.year = data.dates.split('-')[0];
        delete data.dates;  // Remove the old key
        const dataJSON = JSON.stringify(data).replace(/"/g, '\\"');
        console.log('Adding new entry:', `"${dataJSON}"`);
        const result = await addUserCVData(user.user_id, section.data_section_id, `"${dataJSON}"`, false);
        console.log(result);
      } catch (error) {
        console.error('Error adding new entry:', error);
      }
    }
    setRetrievingData(false);
    setAddingData(false);
    fetchData();
  }

  return (
    <dialog className="modal-dialog" open>
      <button type="button" className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4" onClick={onClose}>✕</button>
      {initialRender ? (
        <div className='flex flex-col items-center justify-center w-full mt-5 mb-5'>
          <div className='text-center mb-4'>
            <div className='text-center mb-1'>
              <div className='mb-2'>Fetch data from RISE:</div>
            </div>
            <button type="button" className="btn btn-secondary mt-5 mb-8" onClick={() => fetchRiseData()}>
              Fetch RISE Data
            </button>
            <div className='mb-2'>Fetch data from the following external grant sources:</div>
            <div className='text-sm'>1. Canadian Institutes of Health Research (CIHR)</div>
            <div className='text-sm'>2. Natural Sciences and Engineering Research Council of Canada (NSERC)</div>
            <div className='text-sm'>3. Social Sciences and Humanities Research Council (SSHRC)</div>
            <div className='text-sm'>4. Canada Foundation for Innovation (CFI)</div>
          </div>
          <button type="button" className="btn btn-info mt-1" onClick={() => fetchSecureFundingData()}>
            Fetch External Data
          </button>
        </div>      
      ) : (
        fetchingData ? (
          <div className='flex items-center justify-center w-full mt-5 mb-5'>
            <div className="block text-m mb-1 mt-6 text-zinc-600">
              Fetching secure funding data...
            </div>
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center w-full mt-5 mb-5'>
            <div className="block text-m mt-6 text-zinc-600">
              {allSecureFundingData.length === 0 ? (
                "No data found"
              ) : (
                <>
                  {allSecureFundingData.map((secureFundingData, index) => (
                    <SecureFundingEntry key={index} secureFundingData={secureFundingData} onSelect={handleSelect} />
                  ))}
                </>
              )}
            </div>
            {allSecureFundingData.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary mb-4 mt-4 text-white"
                onClick={addSecureFundingData}
                disabled={addingData}
              >
                {addingData ? "Adding secure funding data..." : "Add Secure Funding Data"}
              </button>
            )}
          </div>

        )
      )}
    </dialog>
  );
};

export default SecureFundingModal;
