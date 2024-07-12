import React from 'react';
import { FaRegEdit } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
import { LuUndo2 } from "react-icons/lu";

const GenericEntry = ({ isArchived, onEdit, field1, field2, field3 }) => {

  return (
    <div className="min-h-8 shadow-glow mx-4 my-2 max-w-3xl px-2 flex items-center">
      <div className="mr-2">
      </div>
      
      <p className="font-bold text-sm break-words">
        {field1}
        {field2 ? `, ${field2}` : ''}
        {field3 ? `, ${field3}` : ''}
      </p>

      <div className="flex items-center space-x-0 ml-auto">

        {!isArchived &&
          <button className="btn btn-xs btn-circle btn-ghost" onClick={onEdit}>
            <FaRegEdit className="h-4 w-4" />
          </button>
        }

        {isArchived &&
          <button className="btn btn-xs btn-circle btn-ghost" onClick={onEdit}>
            <LuUndo2 className="h-4 w-4" />
          </button>
        }
        
        <button className="btn btn-xs btn-circle btn-ghost">
          <IoClose className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default GenericEntry;
