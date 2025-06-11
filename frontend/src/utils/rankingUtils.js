export const rankFields = (entry) => {
  const importance = {
    title: 1,
    course: 2,
    "university/organization": 3,
    "university/organization/company": 4,
    year: 5,
    dates: 6,
    name: 7,
    type: 8,
    rank: 9,
    role: 10,
    department: 11,
    physician: 12,
    publisher: 13,
    journal: 14,
    other: 15,
    details: 16,
    description: 17,
    inventor: 18,
    supervisor: 19,
    note: 20,
  };

  const rankedFields = Object.entries(entry)
    .filter(([key]) => {
      const normalizedKey = key.toLowerCase().replace(/[_\s()]/g, ''); // Normalize keys
      return !normalizedKey.includes('id') && Object.keys(importance).some(importantKey => normalizedKey.includes(importantKey));
    })
    .sort((a, b) => {
      const aKey = Object.keys(importance).find(importantKey => a[0].toLowerCase().includes(importantKey));
      const bKey = Object.keys(importance).find(importantKey => b[0].toLowerCase().includes(importantKey));
      return importance[aKey] - importance[bKey];
    });

  if (rankedFields.length === 0) {
    const fallbackFields = Object.entries(entry)
      .filter(([key]) => !key.toLowerCase().includes('id'))
      .slice(0, 2); 

    return fallbackFields.map(([key, value]) => value);
  } else if (rankedFields.length === 1) {
    const fallbackField = Object.entries(entry)
      .filter(([key]) => !key.toLowerCase().includes('id') && key !== rankedFields[0][0])
      .slice(0, 1); 

    return [rankedFields[0][1], ...fallbackField.map(([key, value]) => value)];
  } else {
    return rankedFields.slice(0, 2).map(([key, value]) => value); 
  }
};
