import React from 'react';

const AnalyticsCard = ({ title, value }) => {
  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <h2 className="text-sm font-medium text-gray-700">{title}</h2>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export default AnalyticsCard;
