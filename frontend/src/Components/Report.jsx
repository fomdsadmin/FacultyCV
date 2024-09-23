import React from 'react';

const Report = ({ title, onClick, isSelected }) => {
  return (
    <div 
      onClick={onClick}
      className={`min-h-8 shadow-glow ml-2 my-2 max-w-xs px-2 flex rounded-lg items-center cursor-pointer 
        ${isSelected ? 'bg-accent text-white' : 'bg-white text-black'} 
        hover:bg-blue-200`}
    >
      <p className="font-bold text-sm">{title}</p>
    </div>
  );
}

export default Report;
