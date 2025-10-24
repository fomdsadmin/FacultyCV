export const rankFields = (entry) => {
  const importance = {
    title: 1,
    course: 1,
    course_title: 2,
    session: 3,
    "university/organization": 4,
    "university/organization/company": 5,
    year: 6,
    dates: 6,
    Dates: 6,
    end: 7,
    end_date: 8,
    end_year: 8,   
    start: 9,
    start_date: 9,
    start_year: 9,
    degree: 10,
    type: 10,
    name: 11,
    rank: 12,
    role: 13,
    department: 14,
    program: 14,
    'program/department': 14,
    'department/program': 14,
    'category-levelofstudent': 14,
    'typeofteaching': 1,
    physician: 15,
    publisher: 16,
    journal: 17,
    scale: 17,
    other: 18,
    inventor: 21,
    supervisor: 22,
    details: 23,
  };

  const rankedFields = Object.entries(entry)
    .filter(([key]) => {
      const normalizedKey = key.toLowerCase().replace(/[_\s()]/g, ''); // Normalize keys
      return !normalizedKey.includes('id');
    })
    .sort((a, b) => {
      const aKey = Object.keys(importance).find(importantKey => a[0].toLowerCase().includes(importantKey));
      const bKey = Object.keys(importance).find(importantKey => b[0].toLowerCase().includes(importantKey));
      const aPriority = aKey ? importance[aKey] : 999; // If not found, assign very low priority
      const bPriority = bKey ? importance[bKey] : 999; // If not found, assign very low priority
      return aPriority - bPriority;
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
