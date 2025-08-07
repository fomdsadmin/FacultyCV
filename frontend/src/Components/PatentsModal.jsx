import React, { useState, useEffect } from "react";
import "../CustomStyles/scrollbar.css";
import "../CustomStyles/modal.css";
import PatentsEntry from "./PatentsEntry";
import { getPatentMatches, addUserCVData, getAllSections } from "../graphql/graphqlHelpers";
import { fetchAuthSession } from "aws-amplify/auth";

const PatentsModal = ({ user, section, onClose, setRetrievingData, fetchData }) => {
  const [allPatentsData, setAllPatentsData] = useState([]);
  const [selectedPatentsData, setSelectedPatentsData] = useState([]);
  const [fetchingData, setFetchingData] = useState(true);
  const [initialRender, setInitialRender] = useState(true);
  const [addingData, setAddingData] = useState(false);
  const [addedSuccessfully, setAddedSuccessfully] = useState(false);

  async function fetchPatentsData() {
    setFetchingData(true);
    setInitialRender(false);
    try {
      const retrievedData = await getPatentMatches(user.first_name, user.last_name);
      console.log("Retrieved patents data, Total: ", retrievedData.length);

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

      setAllPatentsData(allDataDetails);
      setSelectedPatentsData(allDataDetails);
    } catch (error) {
      console.error("Error fetching patents data:", error);
    }
    setFetchingData(false);
  }

  const handleSelect = (patentsData, isAdded) => {
    setSelectedPatentsData((prevState) => {
      if (isAdded) {
        return [...prevState, patentsData];
      } else {
        return prevState.filter((data) => data !== patentsData);
      }
    });
  };

  async function addPatentsData() {
    setAddingData(true);

    // make a single batch
    const newBatchedData = [];
    for (const data of selectedPatentsData) {
      // data.year = data.publication_date.split("-")[0];
      // delete data.publication_date; // Remove the old key
      data.year = data.publication_date ? data.publication_date.split("-")[0] : "";
      newBatchedData.push(data);
    }

    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      if (!idToken) throw new Error("Auth Error: No ID token found.");

      let dataSections = [];
      dataSections = await getAllSections();
      const patentsSectionId = dataSections.find((section) => section.title.includes("Patents"))?.data_section_id;

      const payload = {
        arguments: {
          data_details_list: newBatchedData,
          user_id: user.user_id,
          data_section_id: patentsSectionId,
          editable: "false",
        },
      };
      let baseUrl = process.env.REACT_APP_BATCH_API_BASE_URL || "";
      // omit the last '/' from baseUrl
      if (baseUrl.endsWith("/")) {
        baseUrl = baseUrl.slice(0, -1);
      }

      const response = await fetch(`${baseUrl}/batch/addBatchedData`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      else {
        console.log("Added ", payload.arguments.data_details_list.length, "Patents Successfully | 200 OK");
        setAddedSuccessfully(true);
      }
    } catch (error) {
      console.error("Error adding new entry:", error);
    }

    setAddingData(false);

    // Don't immediately close - allow the success message to display
    setTimeout(() => {
      setRetrievingData(false);
      fetchData();
    }, 2500);
  }

  // Dynamically set modal height based on number of entries
  let modalHeightClass = "h-4/5";
  if (initialRender || fetchingData) {
    modalHeightClass = "h-1/3";
  } else if (allPatentsData.length <= 2) {
    modalHeightClass = "h-[55vh]";
  } else if (allPatentsData.length <= 6) {
    modalHeightClass = "h-4/5";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <dialog
        className={`modal ${modalHeightClass} max-h-4/5 relative bg-white 
        rounded-xl shadow-xl max-w-[60vw] mx-4 w-full p-0 overflow-y-auto`}
        open
        style={{ margin: 0, padding: 0 }}
      >
        {/* X close button at the top right */}
        <button
          type="button"
          className="btn btn-sm btn-circle btn-ghost absolute top-4 right-4 z-20 hover:bg-red-500 hover:text-white transition"
          onClick={onClose}
          aria-label="Close"
        >
          <span className="text-lg leading-none">✕</span>
        </button>
        {initialRender ? (
          <div className="flex flex-col items-center justify-center w-full mt-5 mb-5 p-12">
            <div className="text-center mb-4">
              This data is fetched from the European Patent Office, which contains both published patent applications
              and published patents from major intellectual property offices.
            </div>
            <button type="button" className="btn btn-secondary mt-5" onClick={fetchPatentsData}>
              Fetch Patents Data
            </button>
          </div>
        ) : fetchingData ? (
          <div className="flex items-center justify-center w-full mt-5 mb-5">
            <div className="text-m text-zinc-600">Fetching patents data...</div>
          </div>
        ) : addedSuccessfully ? (
          <div className="flex flex-col items-center justify-center w-full mt-5 mb-5">
            <div className="block text-lg font-bold mb-2 mt-6 text-green-600">Patents Added Successfully!</div>
            <div className="text-sm text-gray-600 mt-1">
              {selectedPatentsData.length} patents have been added to your profile
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full mt-7 mb-5 p-4">
            <div className="w-full max-w-3xl">
              {allPatentsData.length === 0 ? (
                <div className="text-center text-gray-500">No data found</div>
              ) : (
                <>
                  <div
                    className="flex items-center justify-between bg-gray-100 mt-4 mx-auto p-4 rounded-xl 
                  shadow mb-4 max-w-3xl w-full"
                  >
                    <div className="flex items-center gap-2 p-4">
                      <span className="text-xl font-semibold text-gray-700">Matched Patents</span>
                      <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                        {selectedPatentsData.length} selected
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className={`px-3 py-1 text-sm font-medium ${
                          selectedPatentsData.length > 0
                            ? "text-red-600 bg-red-100 hover:bg-red-200"
                            : "text-green-600 bg-green-100 hover:bg-green-200"
                        } rounded-full transition`}
                        onClick={() => {
                          if (selectedPatentsData.length > 0) {
                            // If there are selected items, deselect all
                            setSelectedPatentsData([]);
                          } else {
                            // If nothing is selected, select all
                            setSelectedPatentsData([...allPatentsData]);
                          }
                        }}
                      >
                        {selectedPatentsData.length > 0 ? "Deselect All" : "Select All"}
                      </button>
                      {allPatentsData.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-secondary px-6 py-2 ml-2 text-white rounded-lg shadow hover:shadow-md transition"
                          onClick={addPatentsData}
                          disabled={addingData || selectedPatentsData.length === 0}
                        >
                          {addingData ? "Adding patents data..." : "Add Patent Data"}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 w-full max-w-3xl mx-auto">
                    {allPatentsData.map((patentData, index) => (
                      <PatentsEntry
                        key={index}
                        patentData={patentData}
                        onSelect={handleSelect}
                        selected={selectedPatentsData.includes(patentData)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
};

export default PatentsModal;
