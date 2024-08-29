import React from 'react';
import { useState } from 'react';
import { FaArrowLeft, FaTrash } from 'react-icons/fa';
import DeleteSectionModal from './DeleteSectionModal';
import AddAttributeModal from './addAttributeModal.jsx';

const ManageSection = ({ section, onBack, getDataSections }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddAttributeModalOpen, setIsAddAttributeModalOpen] = useState(false);

  const handleBack = () => {
    onBack();
  };

  const handleTrashClick = () => {
    setIsModalOpen(true);
  };

  const handleAddAttributeClick = () => {
    setIsAddAttributeModalOpen(true);
  };

  const attributes = typeof section.attributes === 'string' ? JSON.parse(section.attributes) : section.attributes;

  return (
    <div>
      <div className="flex justify-between items-center pt-4">
        <button onClick={handleBack} className='text-zinc-800 btn btn-ghost min-h-0 h-8 leading-tight mr-4'>
          <FaArrowLeft className="h-6 w-6 text-zinc-800" />
        </button>
        <button onClick={handleTrashClick} className='text-red-600 btn btn-ghost bg-min-h-0 h-8 leading-tight'>
          <FaTrash className="h-8 w-8 text-red-600" />
        </button>
      </div>
      <div className='m-4 flex items-center'>
        <h2 className="text-left text-4xl font-bold text-zinc-600">{section.title}</h2>
      </div>
      <h2 className='m-4 text-left text-2xl text-zinc-600 flex'>{section.data_type}</h2>       
      <div className='m-4 flex'>{section.description}</div>

      <div className='m-4'>
        <button onClick={handleAddAttributeClick} className='btn btn-primary my-4 text-white'>Add Attribute</button>
        <h3 className="text-left text-xl font-semibold text-zinc-600">Attributes</h3>
        <ul className='list-disc list-inside text-zinc-600'>
          {Object.keys(attributes).map((key) => (
            <li key={key} className='ml-4'>{key}</li>
          ))}
        </ul>
      </div>
      {isModalOpen && (
        <DeleteSectionModal setIsModalOpen={setIsModalOpen} section={section} onBack={onBack} getDataSections={getDataSections}/>
      )}
      {isAddAttributeModalOpen && (
        <AddAttributeModal setIsAddAttributeModalOpen={setIsAddAttributeModalOpen} onBack={onBack} section={section} getDataSections={getDataSections}/>
      )}
    </div>
  );
};

export default ManageSection;
