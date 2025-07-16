import React from 'react'

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Helper: convert month name to number (for comparison)
const monthToNum = (month) => months.indexOf(month);

function validateDateFields(formData, attrsObj) {
  // Check for "dates" field (start/end month/year)
  if (Object.keys(attrsObj).some(k => k.toLowerCase().includes("dates"))) {
    const { startDateMonth, startDateYear, endDateMonth, endDateYear } = formData;
    if (!startDateMonth || !startDateYear) {
      return "Please select a start date (month and year).";
    }
    if (!endDateMonth || !endDateYear) {
      return "Please select an end date (month and year) or 'Current'.";
    }
    // Allow "None" as a valid option for end dates
    if ((endDateMonth === "None" && endDateYear !== "None") || 
        (endDateMonth !== "None" && endDateYear === "None")) {
      return "Please select a valid end date (month and year) or 'Current'.";
    }
    if (endDateMonth !== "Current" && endDateYear !== "Current" && 
        endDateMonth !== "None" && endDateYear !== "None") {
      // Compare start and end
      const start = new Date(Number(startDateYear), monthToNum(startDateMonth));
      const end = new Date(Number(endDateYear), monthToNum(endDateMonth));
      if (end < start) {
        return "End date must be after the start date.";
      }
    }
  }

  // Check for single start_date or end_date fields
  for (const attrName of Object.keys(attrsObj)) {
    const lower = attrName.toLowerCase();
    if (lower.includes("start date")) {
      if (!formData.startDateMonth || !formData.startDateYear) {
        return "Please select a start date (month and year).";
      }
    }
    if (lower.includes("end date")) {
      if (!formData.endDateMonth || !formData.endDateYear) {
        return "Please select an end date (month and year) or 'Current'.";
      }
      // Allow "None" as a valid option for end dates
      if ((formData.endDateMonth === "None" && formData.endDateYear !== "None") || 
          (formData.endDateMonth !== "None" && formData.endDateYear === "None")) {
        return "Please select a valid end date (month and year) or 'Current'.";
      }
      if (
        formData.startDateMonth &&
        formData.startDateYear &&
        formData.endDateMonth !== "Current" &&
        formData.endDateYear !== "Current" &&
        formData.endDateMonth !== "None" &&
        formData.endDateYear !== "None"
      ) {
        const start = new Date(Number(formData.startDateYear), monthToNum(formData.startDateMonth));
        const end = new Date(Number(formData.endDateYear), monthToNum(formData.endDateMonth));
        if (end < start) {
          return "End date must be after the start date.";
        }
      }
    }
    }
    
    for (const attrName of Object.keys(attrsObj)) {
        const lower = attrName.toLowerCase();
        console.log("Validating attribute:", lower);
      if (lower.includes("year")) {
        // Instead of checking only formData.year, check the actual field name
        if (!formData.year) {
          return "Please select a year.";
        }
        }
    }
  return null;
}

const DateEntry = ({ attrsObj, attributes, formData, handleChange, years }) => {
  if (!attrsObj) return null;
  return Object.entries(attrsObj).map(([attrName, value]) => {
    // Get the snake_case key from attributes mapping
    const snakeKey = attributes && attributes[attrName] ? attributes[attrName] : attrName;

    if (attrName && attrName.toLowerCase().includes("dates")) {
      // Render Start/End Month/Year dropdowns for "dates" field
      return (
        <div key={attrName} className="mb-1 col-span-1 w-full">
          <label className="block text-sm capitalize font-semibold mb-1">
            Start Date
          </label>
          <div className="flex space-x-2">
            <select
              name="startDateMonth"
              value={formData.startDateMonth || ""}
              onChange={handleChange}
              className="w-full rounded text-sm px-3 py-2 border border-gray-300"
            >
              <option value="">Month</option>
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
            <select
              name="startDateYear"
              value={formData.startDateYear || ""}
              onChange={handleChange}
              className="w-full rounded text-sm px-3 py-2 border border-gray-300"
            >
              <option value="">Year</option>
              {years &&
                years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
            </select>
          </div>
          <label className="block text-sm capitalize mt-3 mb-1 font-semibold">
            End Date
          </label>
          <div className="flex space-x-2">
            <select
              name="endDateMonth"
              value={formData.endDateMonth || ""}
              onChange={handleChange}
              className="w-full rounded text-sm px-3 py-2 border border-gray-300"
            >
              <option value="">Month</option>
              <option value="Current">Current</option>
              <option value="None">None</option>
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
            <select
              name="endDateYear"
              value={formData.endDateYear || ""}
              onChange={handleChange}
              className="w-full rounded text-sm px-3 py-2 border border-gray-300"
            >
              <option value="">Year</option>
              <option value="Current">Current</option>
              <option value="None">None</option>
              {years &&
                years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
            </select>
          </div>
        </div>
      );
    } else if (
      attrName &&
      (attrName.toLowerCase().includes("year") ||
        attrName.toLowerCase().includes("Year Published"))
    ) {
        // Handle year fields using snakeKey for name/value
        return (
        <div key={attrName} className="mb-1">
          <label className="block text-sm capitalize font-semibold mb-1 ">
            {attrName}
          </label>
          <select
            name={snakeKey}
            value={formData[snakeKey] || ""}
            onChange={handleChange}
            className="w-full rounded text-sm px-3 py-2 border border-gray-300"
          >
            <option value="">Select Year</option>
            {years &&
              years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
          </select>
        </div>
      );
    } else if (
      attrName &&
      (attrName.toLowerCase().includes("start date") ||
        attrName.toLowerCase().includes("end date"))
    ) {
      // Handle single start_date or end_date fields (month/year selector)
      const prefix = attrName.toLowerCase().includes("start") ? "start" : "end";
      return (
        <div key={attrName} className="mb-1 col-span-2">
          <label className="block text-sm capitalize font-semibold mb-1">
            {attrName.replace(/_/g, " ")}
          </label>
          <div className="flex space-x-2">
            <select
              name={`${prefix}DateMonth`}
              value={formData[`${prefix}DateMonth`] || ""}
              onChange={handleChange}
              className="w-full rounded text-sm px-3 py-2 border border-gray-300"
            >
              <option value="">Month</option>
              {prefix === "end" && (
                <>
                  <option value="Current">Current</option>
                  <option value="None">None</option>
                </>
              )}
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
            <select
              name={`${prefix}DateYear`}
              value={formData[`${prefix}DateYear`] || ""}
              onChange={handleChange}
              className="w-full rounded text-sm px-3 py-2 border border-gray-300"
            >
              <option value="">Year</option>
              {prefix === "end" && (
                <>
                  <option value="Current">Current</option>
                  <option value="None">None</option>
                </>
              )}
              {years &&
                years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
            </select>
          </div>
        </div>
      );
    }
    return null;
  });
}

export default DateEntry;
export { validateDateFields };