export const rankFields = (entry) => {
  const importance = {
    title: 1,
    course: 2, 
    name: 3,
    dates: 4,
    year: 5,
    'university/organization': 6,
    'university/organization/company': 7,
    rank: 8,
    role: 9,
    department: 10,
    type: 11,
    publisher: 12,
    journal: 13,
    details: 14,
    other: 15,
    description: 16,
    inventor: 17,
    supervisor: 18
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
