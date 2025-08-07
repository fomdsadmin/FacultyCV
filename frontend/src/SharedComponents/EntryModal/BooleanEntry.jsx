import React from 'react';

const BooleanEntry = ({ attrsObj, formData, handleChange }) => {
  if (!attrsObj) return null;
  return Object.entries(attrsObj).map(([attrName, value]) => {
    if (attrName) {
      return (
        <div key={attrName} className="flex items-center">
          <input
            type="checkbox"
            name={attrName}
            checked={!!formData[attrName]}
            onChange={e => handleChange({
              target: {
                name: attrName,
                value: e.target.checked
              }
            })}
            className="mr-2"
          />
          <label className="text-sm capitalize">{attrName}</label>
        </div>
      );
    }
    return null;
  });
};

export default BooleanEntry;