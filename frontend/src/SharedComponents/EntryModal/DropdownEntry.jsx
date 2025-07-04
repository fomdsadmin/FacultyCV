import React from 'react';

const DropdownEntry = ({ attrsObj, attributes, formData, handleChange }) => {
  if (!attrsObj) return null;
  return Object.entries(attrsObj).map(([attrName, options]) => {
    const snakeKey = attributes && attributes[attrName] ? attributes[attrName] : attrName;
    const hasOther = Array.isArray(options) && options.includes("Other");
    const isOtherSelected = formData[snakeKey] === "Other";
    const otherKey = `${snakeKey}_other`;

    return (
      <div key={attrName} className="mb-1">
        <label className="block text-sm capitalize font-semibold mb-1">{attrName}</label>
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
        {hasOther && (
          <input
            type="text"
            name={otherKey}
            value={formData[otherKey] || ""}
            onChange={handleChange}
            disabled={!isOtherSelected}
            placeholder="Please specify Other"
            className={`w-full rounded text-sm px-3 py-2 border mt-2 ${
              isOtherSelected ? "border-gray-300" : "border-gray-200 bg-gray-100"
            }`}
          />
        )}
      </div>
    );
  });
};

export default DropdownEntry;