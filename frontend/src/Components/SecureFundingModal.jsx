import React, { useState, useEffect } from "react";
import "../CustomStyles/scrollbar.css";
import "../CustomStyles/modal.css";
import SecureFundingEntry from "./SecureFundingEntry";
import { fetchAuthSession } from "aws-amplify/auth";
import {
  getSecureFundingMatches,
  getRiseDataMatches,
  addUserCVData,
  getAllSections,
} from "../graphql/graphqlHelpers";

const SecureFundingModal = ({
  user,
  section,
  onClose,
  setRetrievingData,
  fetchData,
}) => {
  const [allSecureFundingData, setAllSecureFundingData] = useState([]);
  const [selectedSecureFundingData, setSelectedSecureFundingData] = useState(
    []
  );
  const [fetchingData, setFetchingData] = useState(true);
  const [initialRender, setInitialRender] = useState(true);
  const [addingData, setAddingData] = useState(false);
  const [addedSuccessfully, setAddedSuccessfully] = useState(false);

  async function fetchSecureFundingData() {
    setFetchingData(true);
    setInitialRender(false);
    try {
      const retrievedData = await getSecureFundingMatches(
        user.first_name,
        user.last_name
      );
      console.log(
        "Retrieved secure funding data, Total: ",
        retrievedData.length
      );
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
      console.error("Error fetching secure funding data:", error);
    }
    setFetchingData(false);
  }

  async function fetchRiseData() {
    setFetchingData(true);
    setInitialRender(false);
    try {
      const retrievedData = await getRiseDataMatches(
        user.first_name,
        user.last_name
      );
      const allDataDetails = [];
      const uniqueDataDetails = new Set();

      for (const dataObject of retrievedData) {
        const { data_details } = dataObject;
        const data_details_json = JSON.parse(data_details);
        const uniqueKey = `${data_details_json.first_name}-${data_details_json.last_name}-${data_details_json.title}-${data_details_json.amount}-${data_details_json.sponsor}`;
        if (!uniqueDataDetails.has(uniqueKey)) {
          uniqueDataDetails.add(uniqueKey);
          allDataDetails.push(data_details_json);
        }
      }

      console.log("Retrieved RISE data, Total: ", allDataDetails.length);
      setAllSecureFundingData(allDataDetails);
      setSelectedSecureFundingData(allDataDetails);
    } catch (error) {
      console.error("Error fetching secure funding data:", error);
    }
    setFetchingData(false);
  }

  const handleSelect = (secureFundingData, isAdded) => {
    setSelectedSecureFundingData((prevState) => {
      if (isAdded) {
        return [...prevState, secureFundingData];
      } else {
        return prevState.filter((data) => data !== secureFundingData);
      }
    });
  };

  async function addSecureFundingData() {
    setAddingData(true);

    // make a single batch
    const newBatchedData = [];
    let fname, lname;
    const tempData = [...selectedSecureFundingData];
    for (const data of tempData) {
      data.year = data.dates.split("-")[0];
      delete data.dates;
      data.type = "Grant"
      fname = data.first_name || "";
      lname = data.last_name || "";
      if (fname) {
        data.principal_investigator = fname
      }
      if (lname) {
        data.principal_investigator += ` ${lname}`;
      }
      delete data.first_name;
      delete data.last_name;
      newBatchedData.push(data);
    }

    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      if (!idToken) throw new Error("Auth Error: No ID token found.");

      let dataSections = [];
      dataSections = await getAllSections();
      const secureFundingSectionId = dataSections.find(
        (section) => section.title.includes("Research or Equivalent Grants")
      )?.data_section_id;

      const payload = {
        arguments: {
          data_details_list: newBatchedData,
          user_id: user.user_id,
          data_section_id: secureFundingSectionId,
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
          "Grants Successfully | 200 OK"
        );
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
    modalHeightClass = "h-1/2";
  } else if (allSecureFundingData.length <= 2) {
    modalHeightClass = "h-[55vh]";
  } else if (allSecureFundingData.length <= 6) {
    modalHeightClass = "h-4/5";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <dialog
        className={`modal ${modalHeightClass} max-h-4/5 relative bg-white 
        rounded-xl shadow-xl max-w-4xl mx-4 w-full p-0 overflow-y-auto`}
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
          <div className="flex flex-col items-center justify-center w-full mt-5 mb-5">
            <div className="text-center mb-4">
              <div className="mb-2">Fetch data from RISE:</div>
              <button
                type="button"
                className="btn btn-secondary mt-5 mb-8"
                onClick={fetchRiseData}
              >
                Fetch RISE Data
              </button>
              <div className="mb-2">
                Fetch data from the following external grant sources:
              </div>
              <div className="text-sm">
                1. Canadian Institutes of Health Research (CIHR)
              </div>
              <div className="text-sm">
                2. Natural Sciences and Engineering Research Council of Canada
                (NSERC)
              </div>
              <div className="text-sm">
                3. Social Sciences and Humanities Research Council (SSHRC)
              </div>
              <div className="text-sm">
                4. Canada Foundation for Innovation (CFI)
              </div>
            </div>
            <button
              type="button"
              className="btn btn-info mt-1"
              onClick={fetchSecureFundingData}
            >
              Fetch External Data
            </button>
          </div>
        ) : fetchingData ? (
          <div className="flex items-center justify-center w-full mt-5 mb-5">
            <div className="text-m text-zinc-600">Fetching grants data...</div>
          </div>
        ) : addedSuccessfully ? (
          <div className="flex flex-col items-center justify-center w-full mt-5 mb-5">
            <div className="block text-lg font-bold mb-2 mt-6 text-green-600">
              Grants Added Successfully!
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {selectedSecureFundingData.length} grants have been added to your
              profile
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full mt-7 mb-5">
            <div className="w-full max-w-3xl">
              {allSecureFundingData.length === 0 ? (
                <div className="text-center text-gray-500">No data found</div>
              ) : (
                <>
                  <div className="flex items-center justify-between bg-gray-100 mt-4 mx-auto p-4 rounded-xl shadow mb-4 max-w-3xl w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-semibold text-gray-700">
                        Matched Grants
                      </span>
                      <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                        {selectedSecureFundingData.length} selected
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="px-3 py-1 text-sm font-medium text-red-600 bg-red-100 hover:bg-red-200 rounded-full transition"
                        onClick={() => setSelectedSecureFundingData([])}
                      >
                        Deselect All
                      </button>
                      {allSecureFundingData.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-secondary px-6 py-2 ml-2 text-white rounded-lg shadow hover:shadow-md transition"
                          onClick={addSecureFundingData}
                          disabled={addingData}
                        >
                          {addingData
                            ? "Adding grants data..."
                            : "Add Grant Data"}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4 rounded-xl mb-6">
                    {allSecureFundingData.map((secureFundingData, index) => (
                      <SecureFundingEntry
                        key={index}
                        secureFundingData={secureFundingData}
                        onSelect={handleSelect}
                        selected={selectedSecureFundingData.includes(
                          secureFundingData
                        )}
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

export default SecureFundingModal;
