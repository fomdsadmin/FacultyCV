import React from 'react';

const DropdownEntry = ({ attrsObj, attributes, formData, handleChange }) => {
  if (!attrsObj) return null;
  return Object.entries(attrsObj).map(([attrName, options]) => {
    const snakeKey = attributes && attributes[attrName] ? attributes[attrName] : attrName;
    const hasOther =
      Array.isArray(options) &&
      options.some(
        (option) => typeof option === "string" && option.trim().toLowerCase().includes("other")
      );
    const isOtherSelected =
    typeof formData[snakeKey] === "string" &&
    formData[snakeKey].trim().toLowerCase().includes("other");
    const otherKey = `${snakeKey}_other`;
    console.log(otherKey)

    const selectedValue = (() => {
      const v = formData[snakeKey] || "";
      // If value is like "Other (something)", just select the option containing "Other"
      if (typeof v === "string" && v.toLowerCase().includes("other (")) {
        // Find the first option that contains "other"
        const found = Array.isArray(options)
          ? options.find(opt => opt.toLowerCase().includes("other"))
          : "Other";
        return found || "Other";
      }
      return v;
    })();

    return (
      <div key={attrName} className="mb-1">
        <label className="block text-sm capitalize font-semibold mb-1">{attrName}</label>
        <select
          name={snakeKey}
          value={selectedValue}
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