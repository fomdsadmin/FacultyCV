import React from "react";
import { FaPlusCircle, FaTimesCircle } from "react-icons/fa";

const PatentsEntry = ({ patentData, onSelect, selected }) => {
  const handleToggle = () => {
    onSelect(patentData, !selected);
  };

  return (
    <div className="min-h-8 shadow-glow mx-auto w-full max-w-3xl px-4 py-2 flex flex-col justify-between shadow-lg bg-white-50 rounded-xl mb-4">
      <div className="relative flex justify-between items-center w-full">
        <button className="btn btn-xs btn-circle btn-ghost absolute top-0 right-0" onClick={handleToggle}>
          {selected ? (
            <FaTimesCircle className="h-6 w-6 text-red-500" />
          ) : (
            <FaPlusCircle className="h-6 w-6 text-green-500" />
          )}
        </button>
      </div>
      <div className="w-full justify-between items-center mt-1">
        <span className="font-bold text-sm break-words">
          {patentData.first_name} {patentData.last_name}
        </span>
        {patentData.title && <p className="text-sm break-words">{patentData.title}</p>}
        
        {patentData.publication_date && (
          <p className="text-sm break-words">
            <b>Publication Date:</b> {patentData.publication_date}
          </p>
        )}
        
        {patentData.publication_number && (
          <p className="text-sm break-words">
            <b>Publication Number:</b> {patentData.publication_number}
          </p>
        )}
        
        {patentData.family_number && (
          <p className="text-sm break-words">
            <b>Family Number:</b> {patentData.family_number}
          </p>
        )}
        
        {patentData.kind_code && (
          <p className="text-sm break-words">
            <b>Kind Code:</b> {patentData.kind_code}
          </p>
        )}
      </div>
    </div>
  );
};

export default PatentsEntry;
