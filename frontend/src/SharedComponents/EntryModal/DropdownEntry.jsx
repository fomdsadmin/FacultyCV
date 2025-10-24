import React from 'react';

// Helper: format option display labels for frontend-only display.
// - Strip leading letter bullets like "a. " or "1. "
// - If the remaining text contains trailing digits (e.g. option1), separate them and convert small digits to words
//   (1 -> one, 2 -> two, 3 -> three) for nicer display.
const formatOptionLabel = (label) => {
  if (typeof label !== 'string') return label;
  let s = label.trim();

  // Remove common leading bullets like 'a. ', 'a) ', '1. ', 'i. '
  s = s.replace(/^\s*[a-zA-Z0-9]+[\.)]\s*/, '');

  // Separate trailing digits from a word, e.g. 'option1' -> ['option','1']
  const m = s.match(/^(.*?)(\d+)$/);
  if (m) {
    const base = m[1].trim();
    const num = m[2];
    const numWords = { '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five' };
    const numWord = numWords[num] || num;
    return `${base} ${numWord}`.trim();
  }

  return s;
};

const DropdownEntry = ({ attrsObj, attributes, formData, handleChange, section }) => {
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

    // Autofill publication type with 'Journal' if in journal publications section
    let selectedValue;
    if (
      attrName.toLowerCase() === "publication type" &&
      (section.title === "Journal Publications")
    ) {
      selectedValue = "Journal";
    } else {
      selectedValue = (() => {
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
    }

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
                {formatOptionLabel(option)}
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