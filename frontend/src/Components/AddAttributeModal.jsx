import React, { useState } from 'react';
import { FaArrowLeft, FaPlus, FaTrash } from 'react-icons/fa';
import { updateSection } from '../graphql/graphqlHelpers';

const AddAttributeModal = ({ setIsAddAttributeModalOpen, onBack, getDataSections, section }) => {
  const [attributes, setAttributes] = useState([{}]);
  const [addingSection, setAddingSection] = useState(false);
  const [errors, setErrors] = useState({});

  const handleAttributeChange = (index, key) => {
    const newAttributes = [...attributes];
    newAttributes[index] = { [key]: '' };
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
    if (attributes.length === 0 || Object.keys(attributes[0]).length === 0) newErrors.attributes = 'At least one new attribute is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setAddingSection(true);
    const combinedAttributes = attributes.reduce((acc, obj) => {
      Object.keys(obj).forEach(key => {
        acc[key] = '';
      });
      return acc;
    }, {});

    // Merge combinedAttributes with existing attributes
    const existingAttributes = JSON.parse(section.attributes);
    const updatedAttributes = { ...existingAttributes, ...combinedAttributes };

    const attributesJSONString = JSON.stringify(updatedAttributes).replace(/"/g, '\\"');
    console.log(`"${attributesJSONString}"`);
    try {
      const result = await updateSection(section.data_section_id, false, `"${attributesJSONString}"`);
      console.log('Created section:', result);
    } catch (error) {
      console.error('Error creating section:', error);
    }
    await getDataSections(); // Refresh the sections list after creation
    setAddingSection(false);
    onBack(); // Go back to the previous screen after creation
  };

  return (
    <dialog className="modal-dialog" open>
      <div className="modal-content">
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            onClick={() => setIsAddAttributeModalOpen(false)}
          >
            ✕
          </button>
        <div className='mt-5 leading-tight mr-4 ml-4'>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Add Section Attributes</label>
            {attributes.map((attribute, index) => (
              <div key={index} className="flex gap-4 mb-2 items-center">
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Add attribute"
                  value={Object.keys(attribute)[0] || ''}
                  onChange={(e) => handleAttributeChange(index, e.target.value)}
                />
                {index > 0 && (
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
              {addingSection ? 'Updating...' : 'Update Section'}
            </button>
          </div>
        </div>
      </div>
    </dialog>
      
  );
};

export default AddAttributeModal;
