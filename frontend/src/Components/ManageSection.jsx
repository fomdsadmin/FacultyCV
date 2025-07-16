import React from "react";
import { useState } from "react";
import { FaArrowLeft, FaTrash } from "react-icons/fa";
import DeleteSectionModal from "./DeleteSectionModal";
import EditSectionModal from "./EditSectionModal";
import AttributeModal from "./AttributeModal.jsx";

const ManageSection = ({ section, onBack, getDataSections }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditSectionModalOpen, setIsEditSectionModalOpen] = useState(false);
  const [isUpdateAttributeModalOpen, setIsUpdateAttributeModalOpen] = useState(false);

  const handleBack = () => {
    onBack();
  };

  const handleTrashClick = () => {
    setIsModalOpen(true);
  };

  const handleEditSectionClick = () => {
    setIsEditSectionModalOpen(true);
  };

  const handleUpdateAttributeClick = () => {
    setIsUpdateAttributeModalOpen(true);
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
  console.log("Attributes:", attributes);
  console.log("Attributes Type:", attributesType);

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
      <h2 className="mx-4 mb-4 mt-2 text-left text-xl text-zinc-600 flex">{section.info}</h2>
      <div className="m-4 flex text-lg text-zinc-700">{section.description}</div>

      <div className="m-4">
        <div className="flex flex-wrap gap-4 mb-4">
          <button onClick={handleEditSectionClick} className="btn btn-primary text-white">
            Edit Section
          </button>
          <button onClick={handleUpdateAttributeClick} className="btn btn-secondary text-white">
            Add/Update Attributes
          </button>
        </div>
        <h3 className="text-left text-xl font-semibold text-zinc-600 mb-2">Attributes</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg bg-white shadow">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left font-semibold text-zinc-700 border-b">Name</th>
                <th className="py-2 px-4 text-left font-semibold text-zinc-700 border-b">Type</th>
                <th className="py-2 px-4 text-left font-semibold text-zinc-700 border-b">Options</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(attributesType).map(([type, attrsObj]) => {
                if (type === "dropdown") {
                  // attrsObj: { Type: ["A", "B"] }
                  if (!attrsObj || typeof attrsObj !== "object") return null;
                  return Object.entries(attrsObj).map(([attrName, options], idx) => (
                    <tr key={type + attrName + idx} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b font-medium">{attrName}</td>
                      <td className="py-2 px-4 border-b capitalize">{type}</td>
                      <td className="py-2 px-4 border-b text-gray-600">
                        <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                          {Array.isArray(options) ? options.join(", ") : ""}
                        </span>
                      </td>
                    </tr>
                  ));
                }
                // For other types, attrsObj is an object: { Note: "", Details: "" }
                if (!attrsObj || typeof attrsObj !== "object") return null;
                return Object.keys(attrsObj).map((attrName, idx) => (
                  <tr key={type + attrName + idx} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b font-medium">{attrName}</td>
                    <td className="py-2 px-4 border-b capitalize">{type}</td>
                    <td className="py-2 px-4 border-b text-gray-600">--</td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
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

export default ManageSection;
