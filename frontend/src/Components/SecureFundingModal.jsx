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
      const retrievedData = await getSecureFundingMatches(user.first_name, user.last_name);
      const allDataDetails = [];
      const uniqueDataDetails = new Set();

      for (const dataObject of retrievedData) {
        const { data_details } = dataObject;
        const data_details_json = JSON.parse(data_details);
        const uniqueKey = `${data_details_json.first_name}-${data_details_json.last_name}-${data_details_json.title}-${data_details_json.amount}`;
        if (!uniqueDataDetails.has(uniqueKey)) {
          uniqueDataDetails.add(uniqueKey);
          allDataDetails.push(data_details_json);
        }
      }

      setAllSecureFundingData(allDataDetails);
      setSelectedSecureFundingData(allDataDetails);
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
      const allDataDetails = [];
      const uniqueDataDetails = new Set();

      for (const dataObject of retrievedData) {
        const { data_details } = dataObject;
        const data_details_json = JSON.parse(data_details);
        const uniqueKey = `${data_details_json.first_name}-${data_details_json.last_name}-${data_details_json.title}-${data_details_json.amount}`;
        if (!uniqueDataDetails.has(uniqueKey)) {
          uniqueDataDetails.add(uniqueKey);
          allDataDetails.push(data_details_json);
        }
      }

      setAllSecureFundingData(allDataDetails);
      setSelectedSecureFundingData(allDataDetails);
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
        delete data.dates;
        const escapedDataJSON = JSON.stringify(data).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        const graphqlReadyJSON = `"${escapedDataJSON}"`;
        await addUserCVData(user.user_id, section.data_section_id, graphqlReadyJSON, false);
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
            <div className='mb-2'>Fetch data from RISE:</div>
            <button type="button" className="btn btn-secondary mt-5 mb-8" onClick={fetchRiseData}>
              Fetch RISE Data
            </button>
            <div className='mb-2'>Fetch data from the following external grant sources:</div>
            <div className='text-sm'>1. Canadian Institutes of Health Research (CIHR)</div>
            <div className='text-sm'>2. Natural Sciences and Engineering Research Council of Canada (NSERC)</div>
            <div className='text-sm'>3. Social Sciences and Humanities Research Council (SSHRC)</div>
            <div className='text-sm'>4. Canada Foundation for Innovation (CFI)</div>
          </div>
          <button type="button" className="btn btn-info mt-1" onClick={fetchSecureFundingData}>
            Fetch External Data
          </button>
        </div>
      ) : (
        fetchingData ? (
          <div className='flex items-center justify-center w-full mt-5 mb-5'>
            <div className="text-m text-zinc-600">Fetching secure funding data...</div>
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center w-full mt-5 mb-5'>
            <div className="w-full max-w-3xl">
              {allSecureFundingData.length === 0 ? (
                <div className="text-center text-gray-500">No data found</div>
              ) : (
                <>
                  <div className="flex items-center justify-between bg-gray-100 p-4 rounded-xl shadow mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-semibold text-gray-700">Matched Grants</span>
                      <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                        {selectedSecureFundingData.length} selected
                      </span>
                    </div>
                    <button
                      className="px-3 py-1 text-sm font-medium text-red-600 bg-red-100 hover:bg-red-200 rounded-full transition"
                      onClick={() => setSelectedSecureFundingData([])}
                    >
                      Deselect All
                    </button>
                  </div>
                  <div className="space-y-2">
                    {allSecureFundingData.map((secureFundingData, index) => (
                      <SecureFundingEntry
                        key={index}
                        secureFundingData={secureFundingData}
                        onSelect={handleSelect}
                        selected={selectedSecureFundingData.includes(secureFundingData)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            {allSecureFundingData.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary mt-6 px-6 py-2 text-white rounded-lg shadow hover:shadow-md transition"
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
