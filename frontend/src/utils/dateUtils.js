/**
 * Utility functions for parsing and sorting date fields in CV data
 */

const monthNameToNumber = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11
};

/**
 * Parse various date formats and return a sortable value
 * @param {string} dateStr - Date string to parse
 * @returns {number} - Sortable value (timestamp for dates, year for years)
 */
export const parseDateForSorting = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return 0;
  
  const lowerStr = dateStr.toLowerCase().trim();
  
  // For date ranges, extract the start date (earliest date for sorting)
  // This handles cases like "April 2019 - Current" by extracting "April 2019"
  if (lowerStr.includes(" - ")) {
    const parts = lowerStr.split(" - ");
    const startDate = parts[0].trim();
    return parseDateForSorting(startDate);
  }
  
  // Extract year (4 digits)
  const yearMatch = dateStr.match(/\b(\d{4})\b/);
  if (!yearMatch) return 0;
  
  const year = parseInt(yearMatch[1]);
  
  // Extract month if present
  const monthMatch = lowerStr.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b/);
  
  if (monthMatch) {
    const monthName = monthMatch[1];
    const monthIndex = monthNameToNumber[monthName];
    // Create a date object for more precise sorting
    return new Date(year, monthIndex, 1).getTime();
  }
  
  // If only year, return year * 10000000000 to make it comparable with timestamps
  // but ensure years without months come before specific months in the same year
  return year * 10000000000;
};

/**
 * Extract date value from an entry object for sorting
 * @param {Object} entry - The entry object containing data_details
 * @returns {number} - Sortable date value
 */
export const extractDateValue = (entry) => {
  if (!entry || !entry.data_details) return 0;
  
  const details = entry.data_details;
  
  // Priority order for date fields - start_date comes before end_date for sorting
  const dateFields = [
    'dates', 'start_date', 'end_date', 'year', 'year_published',
    'publication_year', 'date', 'completion_date', 'award_date'
  ];
  
  // Look for date fields in order of priority
  for (const field of dateFields) {
    const value = details[field];
    if (value) {
      const parsedDate = parseDateForSorting(value);
      if (parsedDate > 0) return parsedDate;
    }
  }
  
  // If no specific date fields, look for any field containing "date" or "year"
  for (const [key, value] of Object.entries(details)) {
    const lowerKey = key.toLowerCase();
    if ((lowerKey.includes('date') || lowerKey.includes('year')) && value) {
      const parsedDate = parseDateForSorting(value);
      if (parsedDate > 0) return parsedDate;
    }
  }
  
  return 0;
};

/**
 * Sort entries by date with specified order
 * @param {Array} entries - Array of entry objects
 * @param {boolean} ascending - true for ascending order, false for descending
 * @returns {Array} - Sorted array
 */
export const sortEntriesByDate = (entries, ascending = false) => {
  return [...entries].sort((a, b) => {
    const dateA = extractDateValue(a);
    const dateB = extractDateValue(b);
    
    // Handle entries with no dates (put them at the end)
    if (dateA === 0 && dateB === 0) return 0;
    if (dateA === 0) return 1;
    if (dateB === 0) return -1;
    
    const result = dateB - dateA; // Default descending (most recent first)
    return ascending ? -result : result;
  });
};