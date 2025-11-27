import React from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const CollapsibleSection = ({ 
  id, 
  title, 
  isExpanded, 
  onToggle, 
  isRequired = false,
  children 
}) => {
  return (
    <div id={id}>
      <div 
        className="flex items-center justify-between cursor-pointer p-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-150"
        onClick={onToggle}
        role="button"
        aria-expanded={isExpanded}
        aria-controls={`${id}-content`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <h2 className="text-lg font-semibold">
          {title} {isRequired && <span className="text-red-500">*</span>}
        </h2>
        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
      </div>
      
      {isExpanded && (
        <div id={`${id}-content`} role="region" aria-labelledby={id}>
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;
