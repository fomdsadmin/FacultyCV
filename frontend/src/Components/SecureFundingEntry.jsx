import React from 'react';
import { FaPlusCircle, FaTimesCircle } from 'react-icons/fa';

const SecureFundingEntry = ({ secureFundingData, onSelect, selected }) => {
  const handleToggle = () => {
    onSelect(secureFundingData, !selected);
  };

  return (
    <div className="min-h-8 shadow-glow mx-4 my-2 max-w-3xl px-2 flex items-center justify-between">
      <div>
        <p className="font-bold text-sm break-words">{secureFundingData.first_name} {secureFundingData.last_name},</p>
        <p className="text-sm break-words">{secureFundingData.title},</p>
        <p className="text-sm break-words">${secureFundingData.amount},</p>
        <p className="text-sm break-words">{secureFundingData.dates}</p>
      </div>
      <div className="flex items-center">
        <button className="btn btn-xs btn-circle btn-ghost" onClick={handleToggle}>
          {selected ? <FaTimesCircle className="h-6 w-6 text-red-500" /> : <FaPlusCircle className="h-6 w-6 text-green-500" />}
        </button>
      </div>
    </div>
  );
};

export default SecureFundingEntry;
