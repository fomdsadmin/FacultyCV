import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BarChartComponent = ({ 
  data, 
  dataKey, 
  xAxisKey, 
  barColor, 
  margin = { top: 20, right: 30, left: 20, bottom: 20 },
}) => {
  return (
    <div className=''>
      <ResponsiveContainer width="100%" height="100%" minHeight={350}>
        <BarChart
          data={data}
          margin={margin}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisKey} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey={dataKey} fill={barColor} barSize={85} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
  
export default BarChartComponent;







