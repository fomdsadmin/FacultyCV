import React, { useState } from "react";
import "../CustomStyles/scrollbar.css";
import "../CustomStyles/modal.css";
import { editSectionDetails } from "../graphql/graphqlHelpers";
import { useAuditLogger, AUDIT_ACTIONS } from "../Contexts/AuditLoggerContext";

const EditSectionModal = ({ setIsModalOpen, section, onBack, getDataSections }) => {
  const [title, setTitle] = useState(section.title || "");
  const [type, setType] = useState(section.data_type || "");
  const [description, setDescription] = useState(section.description || "");
  const [info, setInfo] = useState(section.info || "");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const { logAction } = useAuditLogger();

  const handleUpdate = async () => {
    if (!title.trim() || !type.trim()) {
      setError("Title and Type are required.");
      return;
    }
    setUpdating(true);
    try {
      let trimmedTitle = title.trim();
      let trimmedType = type.trim();
      let trimmedDescription = description.trim();
      let trimmedInfo = info.trim();

      await editSectionDetails(section.data_section_id, trimmedTitle, trimmedType, trimmedDescription, trimmedInfo);
      console.log("Section updated successfully:", section.title);

      await logAction(AUDIT_ACTIONS.EDIT_SECTION_DETAILS);

      setIsModalOpen(false);
      setUpdating(false);
      getDataSections();
    } catch (err) {
      setError("Failed to update section.");
      console.error(err);
      setUpdating(false);
    }
  };

  return (
    <dialog className="modal-dialog ml-4" open>
      <div className="modal-content">
        <button
          type="button"
          className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
          onClick={() => setIsModalOpen(false)}
        >
          ✕
        </button>
        <h2 className="text-lg font-semibold mb-4 mt-4 px-4 text-left">Edit Section</h2>
        <div className="flex flex-col gap-4 px-4">
          <label className="font-medium text-sm">
            Title
            <input
              className="input input-bordered w-full mt-1 text-md"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Section Title"
            />
          </label>
          <label className="font-medium text-sm">
            Category
            <input
              className="input input-bordered w-full mt-1 text-md"
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="Section Type"
            />
          </label>
          <label className="font-medium text-sm">
            Information
            <textarea
              className="input input-bordered h-full w-full mt-1 py-1 text-md font-normal"
              rows={2}
              value={info}
              onChange={(e) => setInfo(e.target.value)}
              placeholder="Section Information"
            />
          </label>
          <label className="font-medium text-sm">
            Description ("/newline" or "\n" for new line, "\li" for list item)
            <textarea
              className="input input-bordered h-full w-full mt-1 py-1 text-md font-normal"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Section Description"
            />
          </label>
          {error && <div className="text-red-500 text-sm">{error}</div>}
        </div>
        <div className="flex justify-end gap-2 mt-6 mb-4 px-4">
          <button
            type="button"
            className="btn btn-info text-white"
            onClick={() => setIsModalOpen(false)}
            disabled={updating}
          >
            Cancel
          </button>
          <button type="button" className="btn btn-primary text-white" onClick={handleUpdate} disabled={updating}>
            {updating ? "Updating..." : "Update Section"}
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default EditSectionModal;
