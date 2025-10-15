import React from "react";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Helper: convert month name to number (for comparison)
const monthToNum = (month) => months.indexOf(month);

function validateDateFields(formData, attrsObj) {
  // Check for "dates" field (start/end day/month/year)
  if (Object.keys(attrsObj).some((k) => k.toLowerCase().includes("dates"))) {
    const { startDateDay, startDateMonth, startDateYear, endDateDay, endDateMonth, endDateYear } = formData;
    // If neither start nor end is filled, require at least one
    if (!startDateMonth && !startDateYear && !endDateMonth && !endDateYear) {
      return "Please select at least a start or end date.";
    }
    // If only start is filled, validate start
    if ((startDateMonth && startDateYear) && (!endDateMonth && !endDateYear)) {
      // Valid, do not block
      return null;
    }
    // If only end is filled, validate end
    if ((!startDateMonth && !startDateYear) && (endDateMonth && endDateYear)) {
      // Valid, do not block
      return null;
    }
    // If start is partially filled
    if ((startDateMonth || startDateYear) && (!startDateMonth || !startDateYear)) {
      return "Please select a start date (month and year).";
    }
    // If end is partially filled
    if ((endDateMonth || endDateYear) && (!endDateMonth || !endDateYear)) {
      return "Please select an end date (month and year) or 'Current'.";
    }
    // Allow "None" as a valid option for end dates
    if ((endDateMonth === "None" && endDateYear !== "None") || (endDateMonth !== "None" && endDateYear === "None")) {
      return "Please select a valid end date (month and year) or 'Current'.";
    }
    // If both are filled, compare
    if (
      startDateMonth && startDateYear &&
      endDateMonth && endDateYear &&
      endDateMonth !== "Current" && endDateYear !== "Current" &&
      endDateMonth !== "None" && endDateYear !== "None"
    ) {
      const startDay = startDateDay && !isNaN(parseInt(startDateDay)) ? parseInt(startDateDay) : 1;
      const endDay = endDateDay && !isNaN(parseInt(endDateDay)) ? parseInt(endDateDay) : 1;
      const start = new Date(Number(startDateYear), monthToNum(startDateMonth), startDay);
      const end = new Date(Number(endDateYear), monthToNum(endDateMonth), endDay);
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
      if (
        (formData.endDateMonth === "None" && formData.endDateYear !== "None") ||
        (formData.endDateMonth !== "None" && formData.endDateYear === "None")
      ) {
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
        // Compare start and end - use day 1 if no day is specified or if day is not a valid number
        const startDay = formData.startDateDay && !isNaN(parseInt(formData.startDateDay)) ? parseInt(formData.startDateDay) : 1;
        const endDay = formData.endDateDay && !isNaN(parseInt(formData.endDateDay)) ? parseInt(formData.endDateDay) : 1;
        const start = new Date(Number(formData.startDateYear), monthToNum(formData.startDateMonth), startDay);
        const end = new Date(Number(formData.endDateYear), monthToNum(formData.endDateMonth), endDay);
        if (end < start) {
          return "End date must be after the start date.";
        }
      }
    }
  }

  for (const attrName of Object.keys(attrsObj)) {
    const lower = attrName.toLowerCase();
    if (lower.includes("year")) {
      // Instead of checking only formData.year, check the actual field name
      if (!formData.year) {
        return "Please select a year.";
      }
    }
  }
  return null;
}

const DateEntry = ({ attrsObj, attributes, formData, handleChange, years, sectionName }) => {
  if (!attrsObj) return null;
  
  // Helper to check if section needs day options
  const lowerSection = sectionName ? sectionName.toLowerCase() : "";
  const needsDayOptions = lowerSection.includes("employment record") || lowerSection.includes("leaves of absence");
  
  // Generate days array (01-31 with leading zeros)
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  
  return Object.entries(attrsObj).map(([attrName, value]) => {
    // Get the snake_case key from attributes mapping
    const snakeKey = attributes && attributes[attrName] ? attributes[attrName] : attrName;

    // Helper to check if section is publications/other publications
    const isPublicationSection =
      sectionName && ["journal publications", "other publications"].includes(sectionName.toLowerCase());

    if (attrName && attrName.toLowerCase().includes("dates")) {
      // Render Start/End Month/Year dropdowns for "dates" field
      return (
        <div key={attrName} className="mb-1 col-span-1 w-full">
          <label className="block text-sm capitalize font-semibold mb-1">Start Date</label>
          <div className="flex space-x-2">
            {needsDayOptions && (
              <select
                name="startDateDay"
                value={formData.startDateDay || ""}
                onChange={handleChange}
                className="w-full rounded text-sm px-3 py-2 border border-gray-300"
              >
                <option value="">Day</option>
                <option value="Current">Current</option>
                <option value="None">None</option>
                {days.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            )}
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
            {isPublicationSection ? "Year Published" : "End Date"}
          </label>
          <div className="flex space-x-2">
            {needsDayOptions && (
              <select
                name="endDateDay"
                value={formData.endDateDay || ""}
                onChange={handleChange}
                className="w-full rounded text-sm px-3 py-2 border border-gray-300"
              >
                <option value="">Day</option>
                <option value="Current">Current</option>
                <option value="None">None</option>
                {days.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            )}
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
      (attrName.toLowerCase().includes("year") || attrName.toLowerCase().includes("Year Published"))
    ) {
      // Handle year fields using snakeKey for name/value
      return (
        <div key={attrName} className="mb-1">
          <label className="block text-sm capitalize font-semibold mb-1 ">{attrName}</label>
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
      (attrName.toLowerCase().includes("start date") || attrName.toLowerCase().includes("end date"))
    ) {
      // Handle single start_date or end_date fields (month/year selector)
      const prefix = attrName.toLowerCase().includes("start") ? "start" : "end";
      return (
        <div key={attrName} className="mb-1 col-span-2">
          <label className="block text-sm capitalize font-semibold mb-1">
            {isPublicationSection ? "Year Published" : "End Date"}
          </label>
          <div className="flex space-x-2">
            {needsDayOptions && (
              <select
                name={`${prefix}DateDay`}
                value={formData[`${prefix}DateDay`] || ""}
                onChange={handleChange}
                className="w-full rounded text-sm px-3 py-2 border border-gray-300"
              >
                <option value="">Day</option>
                {prefix === "end" && (
                  <>
                    <option value="Current">Current</option>
                    <option value="None">None</option>
                  </>
                )}
                {days.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            )}
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
};

export default DateEntry;
export { validateDateFields };
