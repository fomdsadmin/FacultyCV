import React from 'react';

const AnalyticsCard = ({ title, value }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 w-auto">
      <h2 className="text-sm font-medium text-gray-700">{title}</h2>
      <p className="mt-1 text-md font-bold text-gray-900">{value}</p>
    </div>
  );
}

export default AnalyticsCard;
