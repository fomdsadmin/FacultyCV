import React from "react";

const CHECKBOX_CLASS = "w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2";

const YesNoCheckbox = ({ 
  id, 
  checked, 
  onChange, 
  label,
  className = "mt-6 space-y-4"
}) => {
  return (
    <div className={className}>
      <div className="flex items-center">
        <input
          id={id}
          type="checkbox"
          className={CHECKBOX_CLASS}
          checked={checked}
          onChange={onChange}
        />
        <label htmlFor={id} className="ml-3 text-gray-700 font-medium">
          {label}
        </label>
      </div>
    </div>
  );
};

export default YesNoCheckbox;
