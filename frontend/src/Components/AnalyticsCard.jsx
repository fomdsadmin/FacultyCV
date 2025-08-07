import React from 'react';

const AnalyticsCard = ({ title, value }) => {
  return (
    <div className="py-4 px-4 bg-white shadow rounded-lg hover:shadow-lg transition-shadow duration-200">
      <h2 className="text-sm font-medium text-gray-700">{title}</h2>
      <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export default AnalyticsCard;
