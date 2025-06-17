import React from 'react';

const TextEntry = ({ attrsObj, attributes, formData, handleChange }) => {
  if (!attrsObj) return null;
  return Object.entries(attrsObj).map(([attrName, value]) => {
    // Get the snake_case key from attributes mapping
    const snakeKey = attributes && attributes[attrName] ? attributes[attrName] : attrName;
    const lower = attrName.toLowerCase();
    if (["title"].some((key) => lower.includes(key))) {
      // Span two columns and use textarea with minRows=2
      return (
        <div key={attrName} className="col-span-2">
          <label className="block text-sm font-semibold capitalize mb-1">
            {attrName}
          </label>
          <input
            type="text"
            name={snakeKey}
            value={formData[snakeKey]}
            onChange={handleChange}
            maxLength={500}
            className="w-full rounded text-sm px-3 py-2 border border-gray-300"
          />
        </div>
      );
    }
    if (["details", "description", "note"].some(key => lower.includes(key))) {
      // Span two columns and use textarea with minRows=2
      return (
        <div key={attrName} className="col-span-2 mt-1">
          <label className="block text-sm font-semibold capitalize mb-1">
            {attrName}
          </label>
          <textarea
            name={snakeKey}
            value={formData[snakeKey]}
            onChange={handleChange}
            minRows={2}
            className="w-full rounded text-sm px-3 py-1 border border-gray-300"
          />
        </div>
      );
    }
    // Default: single column text input
    return (
      <div key={attrName} className="">
        <label className="block text-sm capitalize mb-1 font-semibold">{attrName}</label>
        <input
          type="text"
          name={snakeKey}
          value={formData[snakeKey]}
          onChange={handleChange}
          maxLength={500}
          className="w-full rounded text-sm px-3 py-2 border border-gray-300"
        />
      </div>
    );
  });
};

export default TextEntry;