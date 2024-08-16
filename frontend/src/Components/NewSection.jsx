import React, { useState } from 'react';
import { FaArrowLeft, FaPlus, FaTrash } from 'react-icons/fa';
import { addSection } from '../graphql/graphqlHelpers';

const NewSection = ({ onBack, getDataSections, sections }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dataType, setDataType] = useState('');
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

  const handleCreateSection = async () => {
    const newErrors = {};
    if (!title) newErrors.title = 'Title is required';
    if (sections.some(section => section.title === title)) newErrors.title = 'Section title already exists';
    if (!description) newErrors.description = 'Description is required';
    if (!dataType) newErrors.dataType = 'Data type is required';
    if (attributes.length === 0 || Object.keys(attributes[0]).length === 0) newErrors.attributes = 'At least one attribute is required';

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

    const attributesJSONString = JSON.stringify(combinedAttributes).replace(/"/g, '\\"');
    
    try {
      const result = await addSection(title, description, dataType, `"${attributesJSONString}"`);
      
    } catch (error) {
      console.error('Error creating section:', error);
    }
    await getDataSections(); // Refresh the sections list after creation
    setAddingSection(false);
    onBack(); // Go back to the previous screen after creation
  };

  return (
    <div className=" ">
      <button onClick={onBack} className="text-zinc-800 btn btn-ghost min-h-0 h-8 mt-5 leading-tight mr-4">
        <FaArrowLeft className="h-6 w-6 text-zinc-800" />
      </button>
      <div className='mt-5 leading-tight mr-4 ml-4'>
        <h2 className="text-2xl font-bold mb-6">Create New Section</h2>
      
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Enter section title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Section Description</label>
          <textarea
            className="input input-bordered w-full"
            placeholder="Enter section description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Section Type</label>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Enter section type"
            value={dataType}
            onChange={(e) => setDataType(e.target.value)}
          />
          {errors.dataType && <p className="text-red-500 text-sm">{errors.dataType}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Attributes</label>
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
            onClick={handleCreateSection}
            className="btn btn-primary text-white"
            disabled={addingSection}
          >
            {addingSection ? 'Creating...' : 'Create Section'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewSection;
