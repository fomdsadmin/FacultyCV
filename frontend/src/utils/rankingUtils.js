export const rankFields = (entry) => {
    const importance = {
      dates: 1,
      year: 2,
      title: 3,
      'university/organization': 4,
      'university/organization/company': 5,
      course: 6,
      name: 7,
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
      .filter(([key, value]) => !key.toLowerCase().includes('id') && Object.keys(importance).some(importantKey => key.toLowerCase().includes(importantKey)))
      .sort((a, b) => {
        const aKey = Object.keys(importance).find(importantKey => a[0].toLowerCase().includes(importantKey));
        const bKey = Object.keys(importance).find(importantKey => b[0].toLowerCase().includes(importantKey));
        return importance[aKey] - importance[bKey];
      });
  
    if (rankedFields.length === 0) {
      return [];
    } else if (rankedFields.length === 1) {
      return [rankedFields[0][1]];
    } else {
      return rankedFields.slice(0, 2).map(([key, value]) => value);
    }
  };
  