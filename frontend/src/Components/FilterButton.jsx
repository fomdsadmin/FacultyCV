import React from 'react';
import { IoClose } from "react-icons/io5";
import { FaCheck } from "react-icons/fa6";

const FilterButton = ({ filter, onClick, isActive }) => {
  return (
    <button
      className={`btn ${isActive ? 'btn-active' : 'btn-accent'} text-white mr-2 leading-tight min-h-0 h-6 px-2 py-1 text-sm flex items-center whitespace-nowrap overflow-hidden text-ellipsis`}
      onClick={onClick}
    >
      <span className="flex-shrink-0 w-4 flex justify-center">
        {isActive ? <FaCheck className="h-3 w-3" /> : <IoClose className="h-4 w-4" />}
      </span>
      <span className="ml-0 flex-1 truncate">{filter}</span>
    </button>
  );
};

export default FilterButton;
