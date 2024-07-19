export const rankFields = (entry) => {
    const importance = {
      dates: 1,
      title: 2,
      name: 3,
      rank: 4,
      role: 5,
      department: 6,
      type: 7,
      publisher: 8,
      journal: 9,
      details: 10,
      other: 11,
      description: 12,
      inventor: 13,
      supervisor: 14
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
  