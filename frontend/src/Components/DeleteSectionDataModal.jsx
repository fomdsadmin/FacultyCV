import React, { useState } from "react";
import "../CustomStyles/scrollbar.css";
import "../CustomStyles/modal.css";
import { deleteSectionCVData, deleteUserCVSectionData } from "../graphql/graphqlHelpers";
import { useAuditLogger, AUDIT_ACTIONS } from "../Contexts/AuditLoggerContext";

const DeleteSectionDataModal = ({ 
  setIsModalOpen, 
  section, 
  onBack, 
  getSectionData, 
  totalRows, 
  selectedDepartment = "all",
  departmentUserIds = null 
}) => {
  const [deletingSectionData, setDeletingSectionData] = useState(false);
  const { logAction } = useAuditLogger();

  async function deleteSectionData() {
    setDeletingSectionData(true);
    try {
      if (selectedDepartment === "all") {
        // Delete all data for the section
        await deleteSectionCVData(section.data_section_id);
      } else {
        // Delete data only for users in the selected department
        if (departmentUserIds && departmentUserIds.length > 0) {
          // Delete data for each user in the department
          const deletePromises = departmentUserIds.map(user_id => 
            deleteUserCVSectionData({
              user_id: user_id,
              data_section_id: section.data_section_id
            })
          );
          await Promise.all(deletePromises);
        }
      }
      // Log the section delete action
      await logAction(AUDIT_ACTIONS.DELETE_SECTION_DATA);
    } catch (error) {
      console.error("Error deleting section Data: ", error);
    }
    setDeletingSectionData(false);
    await getSectionData();
    setIsModalOpen(false);
    onBack();
  }

  return (
    <dialog className="modal-dialog ml-4" open>
      <div className="modal-content">
        <div className="p-6">
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            onClick={() => setIsModalOpen(false)}
          >
            ✕
          </button>
          
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-4">
              Delete Section Data
            </h3>
            
            <p className="text-gray-700 mb-4">
              This will remove {selectedDepartment === "all" ? "all rows" : `rows for ${selectedDepartment} department`} for the section:
            </p>
            
            <div className="space-y-3">
              <div className="bg-gray-200 rounded-lg p-3 text-center">
                <span className="font-bold text-lg">{section.title}</span>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-3 text-center">
                <span className="font-semibold">
                  {selectedDepartment === "all" 
                    ? `Total Rows: ${totalRows}` 
                    : `${selectedDepartment} Department Rows: ${totalRows}`
                  }
                </span>
              </div>
            </div>
            
            <p className="text-gray-700 mt-4 font-medium">
              Are you sure you want to do this? This action cannot be undone.
            </p>
          </div>
          
          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={() => setIsModalOpen(false)}
              disabled={deletingSectionData}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-error text-white"
              onClick={deleteSectionData}
              disabled={deletingSectionData}
            >
              {deletingSectionData 
                ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Deleting...
                  </>
                ) 
                : `Delete${selectedDepartment !== "all" ? ` (${selectedDepartment})` : ""}`
              }
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default DeleteSectionDataModal;
