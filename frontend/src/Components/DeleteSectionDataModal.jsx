import React, { useState } from "react";
import "../CustomStyles/scrollbar.css";
import "../CustomStyles/modal.css";
import { deleteSectionCVData } from "../graphql/graphqlHelpers";
import { useAuditLogger, AUDIT_ACTIONS } from "../Contexts/AuditLoggerContext";

const DeleteSectionDataModal = ({ setIsModalOpen, section, onBack, getSectionData, totalRows }) => {
  const [deletingSectionData, setDeletingSectionData] = useState(false);
  const { logAction } = useAuditLogger();

  async function deleteSectionData() {
    setDeletingSectionData(true);
    try {
      await deleteSectionCVData(section.data_section_id);
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
    <dialog className="modal-dialog" open>
      <div className="modal-content">
        <div>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            onClick={() => setIsModalOpen(false)}
          >
            ✕
          </button>
          <p className="mt-10 font-semibold ">
            This will remove all rows for the section
            <br />
            <span className="text-lg flex items-center justify-center p-2 mt-4 bg-gray-200 rounded-lg">
              <b>{section.title}</b>
            </span>
            <span className="text-md flex items-center justify-center p-2 mt-2 bg-gray-100 rounded-lg">
              <b>Total Rows: {totalRows}</b>
            </span>
            <br />
            Are you sure you want to do this?
          </p>
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              className={`btn btn-warning  mr-2 text-white`}
              onClick={deleteSectionData}
              disabled={deletingSectionData}
            >
              {deletingSectionData ? "Deleting Section..." : "Delete Section"}
            </button>
            <button type="button" className="btn btn-info text-white" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default DeleteSectionDataModal;
