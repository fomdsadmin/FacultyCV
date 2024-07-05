import React from 'react';
import { RiDraggable } from 'react-icons/ri';
import { FaRegEdit } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';

const GenericEntry = ({ onEdit, field1, field2 }) => {
  return (
    <div className="min-h-8 shadow-glow mx-4 my-2 max-w-lg px-2 flex items-center">
      <div className="mr-2">
        <RiDraggable className="h-5 w-5" />
      </div>
      
      <p className="font-bold text-sm break-words">
        {field1}
        {field2 ? `, ${field2}` : ''}
      </p>

      <div className="flex items-center space-x-0 ml-auto">
        <button className="btn btn-xs btn-circle btn-ghost" onClick={onEdit}>
          <FaRegEdit className="h-4 w-4" />
        </button>
        
        <button className="btn btn-xs btn-circle btn-ghost">
          <IoClose className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default GenericEntry;
