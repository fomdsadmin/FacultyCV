import React, { useEffect, useState } from "react";
import { FaArrowLeft, FaTrash } from "react-icons/fa";
import DeleteSectionModal from "./DeleteSectionModal";
import DeleteSectionDataModal from "./DeleteSectionDataModal";
import EditSectionModal from "./EditSectionModal";
import AttributeModal from "./AttributeModal.jsx";
import { getUserCVData, getAllUsers, getAllSectionCVData } from "../graphql/graphqlHelpers"; // updated import
import { useApp } from "../Contexts/AppContext"; // To get userInfo
import { useAdmin } from "../Contexts/AdminContext"; // To get all users list

const CVDataSection = ({ section, onBack, getDataSections }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditSectionModalOpen, setIsEditSectionModalOpen] = useState(false);
  const [isUpdateAttributeModalOpen, setIsUpdateAttributeModalOpen] = useState(false);
  const [isDeleteSectionModalOpen, setIsDeleteSectionModalOpen] = useState(false);
  const [dataRows, setDataRows] = useState([]);
  const [allDataRows, setAllDataRows] = useState([]); // Store all data before filtering
  const [loading, setLoading] = useState(true);
  const [totalRows, setTotalRows] = useState(0); // Track total rows
  const [selectedDepartment, setSelectedDepartment] = useState("all"); // Department filter state

  const { userInfo } = useApp();
  const { allUsers } = useAdmin(); // Get all users from admin context

  const fetchAllUserCVData = async () => {
    let allRows = [];
    try {
      const response = await getAllSectionCVData(section.data_section_id);
      
      // Handle new response structure with total_count and data array
      const rows = response.data || response; // Fallback for backward compatibility
      const totalCount = response.total_count || rows.length;
      
      setTotalRows(totalCount); // Set total rows count from server
      
      const parsedRows = rows.map((row) => {
        let details = row.data_details;
        if (typeof details === "string") {
          try {
            details = JSON.parse(details);
          } catch {
            // fallback
          }
        }
        return {
          ...row,
          ...details,
        };
      });
      
      allRows = parsedRows; // All rows are already limited to 5000 by the server
    } catch (error) {
      // skip user if error
      console.error("Error fetching CV data for section:", error);
    }

    setAllDataRows(allRows); // Store all data
    filterDataByDepartment(allRows, selectedDepartment); // Apply current filter
  };

  // Function to filter data based on selected department
  const filterDataByDepartment = (data, department) => {
    if (department === "all") {
      setDataRows(data);
      return;
    }

    // Get user IDs for the selected department
    const departmentUserIds = allUsers
      .filter(user => user.primary_department === department)
      .map(user => user.user_id);

    // Filter data to only include rows from users in the selected department
    const filteredData = data.filter(row => departmentUserIds.includes(row.user_id));
    setDataRows(filteredData);
    console.log(filteredData)
  };

  // Handle department filter change
  const handleDepartmentChange = (event) => {
    const newDepartment = event.target.value;
    setSelectedDepartment(newDepartment);
    filterDataByDepartment(allDataRows, newDepartment);
  };

  // Get unique departments from all users
  const getDepartments = () => {
    const departments = allUsers
      .map(user => user.primary_department)
      .filter(dept => dept && dept.trim() !== "")
      .filter((dept, index, arr) => arr.indexOf(dept) === index)
      .sort();
    
    return departments;
  };

  useEffect(() => {
    const fetchDataRows = async () => {
      setLoading(true);
      if (!section?.data_section_id) {
        setDataRows([]);
        setAllDataRows([]);
        setLoading(false);
        return;
      }
      try {
        await fetchAllUserCVData();
      } catch {
        setDataRows([]);
        setAllDataRows([]);
      }
      setLoading(false);
    };
    fetchDataRows();
  }, [section?.data_section_id]);

  // Re-filter when allUsers changes or selected department changes
  useEffect(() => {
    if (allDataRows.length > 0 && allUsers.length > 0) {
      filterDataByDepartment(allDataRows, selectedDepartment);
    }
  }, [allUsers, selectedDepartment]);

  const handleBack = () => {
    onBack();
  };

  const handleTrashClick = () => {
    setIsModalOpen(true);
  };

  const handleDeleteDataClick = () => {
    setIsDeleteSectionModalOpen(true);
  };

  const attributes = typeof section.attributes === "string" ? JSON.parse(section.attributes) : section.attributes;

  // Try to get dropdown options if present (from section.attributes_types or similar)
  let attributesType =
    typeof section.attributes_type === "string" ? JSON.parse(section.attributes_type) : section.attributes_type;
  if (typeof attributesType === "string") {
    try {
      attributesType = JSON.parse(attributesType);
    } catch {
      attributesType = {};
    }
  }

  return (
    <div className="">
      <div className="flex justify-between items-center pt-4">
        <button onClick={handleBack} className="text-zinc-800 btn btn-ghost min-h-0 h-8 leading-tight mr-4">
          <FaArrowLeft className="h-6 w-6 text-zinc-800" />
        </button>
        <button onClick={handleTrashClick} className="text-red-600 btn btn-ghost bg-min-h-0 h-8 leading-tight">
          <FaTrash className="h-8 w-8 text-red-600" />
        </button>
      </div>
      <div className="m-4 flex items-center">
        <h2 className="text-left text-4xl font-bold text-zinc-600">{section.title}</h2>
      </div>
      <h2 className="mx-4 mt-4 text-left text-2xl text-zinc-600 flex">{section.data_type}</h2>
      {/* delete section data button and department filter */}
      <div className="m-4 flex items-center gap-4">
        {/* Department Filter Dropdown */}
        <select 
          value={selectedDepartment} 
          onChange={handleDepartmentChange}
          className="select select-bordered select-md"
        >
          <option value="all">All Departments</option>
          {getDepartments().map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
        <button 
          onClick={handleDeleteDataClick} 
          className={`btn btn-primary p-4 leading-tight ${dataRows.length === 0 ? "btn-disabled" : "btn-primary "}`}
        >
          Delete Section Data
        </button>
      </div>

      {/* Total rows */}
      <div className="m-4">
        <span className="font-semibold text-lg text-zinc-700">
          Total Data Rows: {loading ? "Loading..." : `${dataRows.length} of ${totalRows}`}
          {selectedDepartment !== "all" && ` (filtered by ${selectedDepartment})`}
        </span>
        {(!loading && totalRows > 5000) && (
          <span className="ml-2 text-zinc-500 text-sm">(showing first 5000 rows)</span>
        )}
        {(!loading && dataRows.length > 0 && totalRows <= 5000 && selectedDepartment === "all") && (
          <span className="ml-2 text-zinc-500 text-sm">(showing all {dataRows.length} rows)</span>
        )}
      </div>

      {/* Data Table */}
      <div className="m-4 overflow-x-auto">
        {loading ? (
          <div className="text-zinc-500 italic">Loading data...</div>
        ) : dataRows.length > 0 ? (
          <table className="table table-zebra w-full border rounded-lg">
            <thead>
              <tr>
                {attributes &&
                  Object.keys(attributes).map((key) => (
                    <th key={key} className="px-4 py-2 text-left bg-gray-100 text-gray-700">
                      {key}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {attributes &&
                    Object.values(attributes).map((attrKey) => (
                      <td key={attrKey} className="px-4 py-2 border-b">
                        {row[attrKey] !== undefined ? String(row[attrKey]) : ""}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-zinc-500 italic">No data rows found for this section.</div>
        )}
      </div>

      {/* Attributes add/update modal */}
      {isEditSectionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center w-full justify-center mx-auto">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
            <EditSectionModal
              setIsModalOpen={setIsEditSectionModalOpen}
              section={section}
              onBack={onBack}
              getDataSections={getDataSections}
            />
          </div>
        </div>
      )}

      {/* Delete section modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center w-full justify-center mx-auto">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
            <DeleteSectionModal
              setIsModalOpen={setIsModalOpen}
              section={section}
              onBack={onBack}
              getDataSections={getDataSections}
            />
          </div>
        </div>
      )}

      {/* Delete section modal */}
      {isDeleteSectionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center w-full justify-center mx-auto">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
            <DeleteSectionDataModal
              setIsModalOpen={setIsDeleteSectionModalOpen}
              section={section}
              onBack={onBack}
              getSectionData={() => {
                fetchAllUserCVData();
              }}
              totalRows={selectedDepartment === "all" ? totalRows : dataRows.length}
              selectedDepartment={selectedDepartment}
              departmentUserIds={selectedDepartment !== "all" ? 
                allUsers
                  .filter(user => user.primary_department === selectedDepartment)
                  .map(user => user.user_id) : 
                null
              }
            />
          </div>
        </div>
      )}

      {/* Attributes add/update modal */}
      {isUpdateAttributeModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex 
                        items-center w-full justify-center mx-auto"
        >
          <AttributeModal
            setIsOpen={setIsUpdateAttributeModalOpen}
            onBack={onBack}
            section={section}
            getDataSections={getDataSections}
            mode="edit"
          />
        </div>
      )}
    </div>
  );
};

export default CVDataSection;
