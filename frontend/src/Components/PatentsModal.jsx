import React, { useState, useEffect } from 'react';
import '../CustomStyles/scrollbar.css';
import '../CustomStyles/modal.css';
import PatentsEntry from './PatentsEntry';
import { getPatentMatches, addUserCVData } from '../graphql/graphqlHelpers';

const PatentsModal = ({ user, section, onClose, setRetrievingData, fetchData }) => {
  const [allPatentsData, setAllPatentsData] = useState([]);
  const [selectedPatentsData, setSelectedPatentsData] = useState([]);
  const [fetchingData, setFetchingData] = useState(true);
  const [initialRender, setInitialRender] = useState(true);
  const [addingData, setAddingData] = useState(false);

  async function fetchPatentsData() {
    setFetchingData(true);
    setInitialRender(false);
    try {
      const retrievedData = await getPatentMatches(user.first_name, user.last_name);
      console.log(retrievedData);
  
      const allDataDetails = [];
      const uniqueDataDetails = new Set();
  
      for (const dataObject of retrievedData) {
        const { data_details } = dataObject;
        const data_details_json = JSON.parse(data_details);
  
        const uniqueKey = `${data_details_json.first_name}-${data_details_json.last_name}-${data_details_json.title}-${data_details_json.publication_date}`;
  
        if (!uniqueDataDetails.has(uniqueKey)) {
          uniqueDataDetails.add(uniqueKey);
          allDataDetails.push(data_details_json);
        }
      }

      console.log('allDataDetails', allDataDetails);
  
      setAllPatentsData(allDataDetails);
      setSelectedPatentsData(allDataDetails);
    } catch (error) {
      console.error('Error fetching patents data:', error);
    }
    setFetchingData(false);
  }

  const handleSelect = (patentsData, isAdded) => {
    setSelectedPatentsData(prevState => {
      if (isAdded) {
        return [...prevState, patentsData];
      } else {
        return prevState.filter(data => data !== patentsData);
      }
    });
  };

  async function addPatentsData() {
    setAddingData(true);
    for (const data of selectedPatentsData) {
      try {
        const dataJSON = JSON.stringify(data).replace(/"/g, '\\"');
        console.log('Adding new entry:', `"${dataJSON}"`);
        const result = await addUserCVData(user.user_id, section.data_section_id, `"${dataJSON}"`);
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
          <div className='text-center'>
            The data is fetched from the European Patent Office, which contains both published patent applications and published patents from not just European countries but also other major intellectual property offices.
          </div>
          <button type="button" className="btn btn-secondary mt-5 text-white" onClick={fetchPatentsData}>
            Fetch Patents Data
          </button>
        </div>
      ) : (
        fetchingData ? (
          <div className='flex items-center justify-center w-full mt-5 mb-5'>
            <div className="block text-m mb-1 mt-6 text-zinc-600">
              Fetching patents data...
            </div>
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center w-full mt-5 mb-5'>
            <div className="block text-m mt-6 text-zinc-600">
              {allPatentsData.length === 0 ? (
                "No data found"
              ) : (
                <>
                  {allPatentsData.map((patentData, index) => (
                    <PatentsEntry key={index} patentData={patentData} onSelect={handleSelect} />
                  ))}
                </>
              )}
            </div>
            {allPatentsData.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary mb-4 mt-4 text-white"
                onClick={addPatentsData}
                disabled={addingData}
              >
                {addingData ? "Adding patents data..." : "Add Patents Data"}
              </button>
            )}
          </div>
        )
      )}
    </dialog>
  );
};

export default PatentsModal;
