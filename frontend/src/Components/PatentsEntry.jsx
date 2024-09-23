import React, { useState } from 'react';
import { FaPlusCircle, FaTimesCircle } from 'react-icons/fa';

const PatentsEntry = ({ patentData, onSelect }) => {
  const [isAdded, setIsAdded] = useState(true);

  const handleToggle = () => {
    setIsAdded(!isAdded);
    onSelect(patentData, !isAdded);
  };

  return (
    <div className="min-h-8 shadow-glow mx-4 my-2 max-w-3xl px-2 flex items-center justify-between">
      <div>
        <p className="font-bold text-sm break-words">{patentData.first_name} {patentData.last_name},</p>
        <p className="text-sm break-words">{patentData.title},</p>
        <p className="text-sm break-words">{patentData.publication_date}</p>
      </div>
      <div className="flex items-center">
        <button className="btn btn-xs btn-circle btn-ghost" onClick={handleToggle}>
          {isAdded ? <FaTimesCircle className="h-6 w-6 text-red-500" /> : <FaPlusCircle className="h-6 w-6 text-green-500" />}
        </button>
      </div>
    </div>
  );
};

export default PatentsEntry;
