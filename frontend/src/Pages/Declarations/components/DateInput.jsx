import React from "react";
import { FaRegCalendarAlt } from "react-icons/fa";

const DateInput = ({ 
  label, 
  value, 
  onChange, 
  error, 
  required = true,
  placeholder = "Select submission date"
}) => {
  return (
    <div className="mt-4 flex items-center">
      <label className="block text-base font-semibold">
        <span className="text-gray-700 mr-4">
          {label} {required && <span className="text-red-500">*</span>}
        </span>
      </label>
      <div className="relative w-56">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true">
          <FaRegCalendarAlt />
        </span>
        <input
          type="date"
          className={`
            pl-10 pr-4 py-2 rounded-lg border transition-colors duration-150 w-full
            text-base bg-white shadow-sm
            border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200
            ${error ? "border-red-500 ring-2 ring-red-200" : ""}
          `}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
        />
      </div>
      {error && (
        <div className="text-red-500 text-sm mt-2 ml-4">{error}</div>
      )}
    </div>
  );
};

export default DateInput;
