import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BarChartComponent = ({ data, dataKey, xAxisKey, title, barColor }) => {
    return (
      <div style={{ width: '80%', marginLeft: '3%' }}> 
        <ResponsiveContainer width="100%" height={350}> 
          <BarChart data={data} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} interval={0} />
            <YAxis width={80} allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey={dataKey} fill={barColor} barSize={85} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  export default BarChartComponent;
  






