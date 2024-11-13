export function formatDateToLongString(date) {
  // Array of month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Extract day, month, and year from the Date object
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  // Construct the formatted string
  return `${day} ${month} ${year}`;
}

export const formatDateToMonthString = (date) => {
  const options = { year: 'numeric', month: 'short' };
  return date.toLocaleDateString('en-US', options);
};

export function getMonthYearString(date) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${year}`;
}
