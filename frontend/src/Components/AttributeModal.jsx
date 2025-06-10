import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { updateSection } from '../graphql/graphqlHelpers';

const AttributeModal = ({
  setIsOpen,
  onBack,
  getDataSections,
  section,
  mode = "add", // "add" or "edit"
}) => {
  // Prefill attributes if editing, else start with one empty field
  const [attributes, setAttributes] = useState([{}]);
  const [addingSection, setAddingSection] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (mode === "edit") {
      let existingAttributes = {};
      try {
        existingAttributes = typeof section.attributes === "string"
          ? JSON.parse(section.attributes)
          : section.attributes;
      } catch {
        existingAttributes = {};
      }
      // Convert object to array of {key: value}
      const attrArr = Object.keys(existingAttributes).length
        ? Object.entries(existingAttributes).map(([key, value]) => ({ [key]: value }))
        : [{}];
      setAttributes(attrArr);
    } else {
      setAttributes([{}]);
    }
  }, [mode, section]);

  const handleAttributeChange = (index, key) => {
    const newAttributes = [...attributes];
    newAttributes[index] = { [key]: Object.values(newAttributes[index])[0] || '' };
    setAttributes(newAttributes);
  };

  const handleValueChange = (index, value) => {
    const newAttributes = [...attributes];
    const key = Object.keys(newAttributes[index])[0];
    newAttributes[index] = { [key]: value };
    setAttributes(newAttributes);
  };

  const handleAddAttribute = () => {
    setAttributes([...attributes, {}]);
  };

  const handleRemoveAttribute = (index) => {
    const newAttributes = attributes.filter((_, i) => i !== index);
    setAttributes(newAttributes);
  };

  const handleUpdateSection = async () => {
    const newErrors = {};
    // Validate: no empty keys
    if (
      attributes.length === 0 ||
      attributes.some(attr => !Object.keys(attr)[0] || Object.keys(attr)[0].trim() === "")
    ) {
      newErrors.attributes = 'All attribute names are required';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setAddingSection(true);

    // Convert array of {key: value} to object
    const combinedAttributes = attributes.reduce((acc, obj) => {
      const key = Object.keys(obj)[0];
      acc[key] = obj[key];
      return acc;
    }, {});

    // Merge with existing attributes if editing
    let existingAttributes = {};
    try {
      existingAttributes = typeof section.attributes === "string"
        ? JSON.parse(section.attributes)
        : section.attributes;
    } catch {
      existingAttributes = {};
    }
    const updatedAttributes =
      mode === "edit"
        ? combinedAttributes // Only keep what's in the edited list
        : { ...existingAttributes, ...combinedAttributes }; // Add mode: merge with existing

    const attributesJSONString = JSON.stringify(updatedAttributes);

    try {
      await updateSection(section.data_section_id, false, attributesJSONString);
    } catch (error) {
      console.error('Error updating section:', error);
    }
    await getDataSections();
    setAddingSection(false);
    onBack();
  };

  return (
    <dialog className="modal-dialog" open>
      <div className="modal-content">
        <button
          type="button"
          className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
          onClick={() => setIsOpen(false)}
        >
          ✕
        </button>
        <div className='mt-5 leading-tight mr-4 ml-4'>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {mode === "edit" ? "Edit Section Attributes" : "Add Section Attributes"}
            </label>
            {attributes.map((attribute, index) => (
              <div key={index} className="flex gap-4 mb-2 items-center">
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Attribute name"
                  value={Object.keys(attribute)[0] || ''}
                  onChange={(e) => handleAttributeChange(index, e.target.value)}
                />
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Default value (optional)"
                  value={Object.values(attribute)[0] || ''}
                  onChange={(e) => handleValueChange(index, e.target.value)}
                />
                {attributes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAttribute(index)}
                    className="btn btn-danger hover:bg-red-700 text-white bg-black h-15 w-15 flex items-center justify-center"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            ))}
            {errors.attributes && <p className="text-red-500 text-sm">{errors.attributes}</p>}
            <button
              type="button"
              onClick={handleAddAttribute}
              className="btn btn-accent text-white mt-2 flex items-center"
            >
              <FaPlus className="mr-2" /> Add Attribute
            </button>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleUpdateSection}
              className="btn btn-primary text-white"
              disabled={addingSection}
            >
              {addingSection ? (mode === "edit" ? 'Updating...' : 'Adding...') : (mode === "edit" ? 'Update Section' : 'Add Section')}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default AttributeModal;