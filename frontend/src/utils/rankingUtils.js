export const rankFields = (entry) => {
  const importance = {
    title: 1,
    course: 2,
    "university/organization": 3,
    "university/organization/company": 4,
    year: 5,
    dates: 5,
    end: 6,
    end_date: 7,
    end_year: 7,   
    start: 8,
    start_date: 8,
    start_year: 8,
    degree: 9,
    type: 9,
    name: 10,
    rank: 11,
    role: 12,
    department: 13,
    physician: 14,
    publisher: 15,
    journal: 16,
    scale: 16,
    other: 17,
    description: 19,
    inventor: 20,
    supervisor: 21,
    details: 22,
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
