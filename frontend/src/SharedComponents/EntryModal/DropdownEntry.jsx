import React from 'react';

const DropdownEntry = ({ attrsObj, attributes, formData, handleChange }) => {
  if (!attrsObj) return null;
  return Object.entries(attrsObj).map(([attrName, options]) => {
    // Get the snake_case key from attributes mapping
    const snakeKey = attributes && attributes[attrName] ? attributes[attrName] : attrName;
    return (
      <div key={attrName} className="mb-1">
        <label className="block text-sm capitalize font-semibold mb-1">
          {attrName}
        </label>
        <select
          name={snakeKey}
          value={formData[snakeKey] || ""}
          onChange={handleChange}
          className="w-full rounded text-sm px-3 py-2 border border-gray-300"
        >
          <option value="">Select {attrName}</option>
          {Array.isArray(options) &&
            options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
        </select>
      </div>
    );
  });
};

export default DropdownEntry;