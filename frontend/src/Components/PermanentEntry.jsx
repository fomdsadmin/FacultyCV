import React from 'react';
import { FaEye } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
import { LuUndo2 } from "react-icons/lu";

const MAX_CHAR_LENGTH = 220;

const truncateText = (text, maxLength) => {
  if (text.length > maxLength) {
    return `${text.substring(0, maxLength)}...`;
  }
  return text;
};

const PermanentEntry = ({ isArchived, onEdit, onArchive, onRestore, field1, field2 }) => {
  return (
    <div className="min-h-8 shadow-glow mx-4 my-2 px-4 py-4 flex items-center bg-white rounded-lg">
      <div className="flex-1 max-w-full">
        {field1 && (
          <h1 className="text-gray-800 font-bold break-words">
            {truncateText(field1, MAX_CHAR_LENGTH)}
          </h1>
        )}
        {field2 && (
          <h2 className="text-gray-600 break-words">
            {truncateText(field2, MAX_CHAR_LENGTH)}
          </h2>
        )}
      </div>

      <div className="flex items-center space-x-1">
        {!isArchived && (
          <>
            <button className="btn btn-sm btn-circle btn-ghost" onClick={() => onEdit()}>
              <FaEye className="h-5 w-5" />
            </button>
            <button className="btn btn-sm btn-circle btn-ghost" onClick={() => onArchive()}>
              <IoClose className="h-5 w-5" />
            </button>
          </>
        )}

        {isArchived && (
          <button className="btn btn-xs btn-circle btn-ghost" onClick={onRestore}>
            <LuUndo2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default PermanentEntry;
