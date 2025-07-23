import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BarChartComponent = ({ 
  data, 
  dataKey, 
  dataKeys, // NEW: array of data keys for multiple bars
  barColors, // NEW: array of colors for multiple bars
  xAxisKey, 
  barColor, 
  margin = { top: 20, right: 30, left: 20, bottom: 20 },
  minHeight = 500,
  formatTooltip,
  formatYAxis,
  formatXAxis,
  showLegend = true,
  showGrid = true,
  yAxisLabel,
  xAxisLabel
}) => {
  
  // Default tooltip formatter
  const defaultTooltipFormatter = (value, name) => {
    if (formatTooltip) {
      return formatTooltip(value, name);
    }
    
    // Format numbers with commas and currency for funding
    if (name === 'GrantFunding' || name === 'Grant Funding' || name === 'Grant Funding ($)') {
      return [`$${value.toLocaleString()}`, 'Grant Funding ($)'];
    }
    
    // Format regular numbers with commas
    if (typeof value === 'number') {
      return [value.toLocaleString(), name];
    }
    
    return [value, name];
  };

  // Default Y-axis formatter
  const defaultYAxisFormatter = (value) => {
    if (formatYAxis) {
      return formatYAxis(value);
    }
    
    // Format large numbers
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    
    return value.toLocaleString();
  };

  // Default X-axis formatter
  const defaultXAxisFormatter = (value) => {
    if (formatXAxis) {
      return formatXAxis(value);
    }
    return value;
  };

  return (
    <div className='w-full h-full'>
      <ResponsiveContainer width="100%" height="100%" minHeight={minHeight}>
        <BarChart
          data={data}
          margin={margin}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
          <XAxis 
            dataKey={xAxisKey} 
            tick={{ fontSize: 12, fill: '#666' }}
            tickFormatter={defaultXAxisFormatter}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
            label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fontSize: '14px', fontWeight: 'bold', fill: '#666' } } : undefined}
          />
          <YAxis 
            allowDecimals={false} 
            tick={{ fontSize: 12, fill: '#666' }}
            tickFormatter={defaultYAxisFormatter}
            width={80}
            label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '14px', fontWeight: 'bold', fill: '#666' } } : undefined}
          />
          <Tooltip 
            formatter={defaultTooltipFormatter}
            labelStyle={{ color: '#333', fontWeight: 'bold' }}
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #ccc', 
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          />
          {showLegend && <Legend />}
          {/* Render multiple bars if dataKeys is provided, otherwise render single bar */}
          {dataKeys && dataKeys.length > 0 ? (
            dataKeys.map((key, index) => (
              <Bar 
                key={key}
                dataKey={key} 
                fill={barColors && barColors[index] ? barColors[index] : barColor} 
                radius={[4, 4, 0, 0]}
                stroke={barColors && barColors[index] ? barColors[index] : barColor}
                strokeWidth={1}
              />
            ))
          ) : (
            <Bar 
              dataKey={dataKey} 
              fill={barColor} 
              radius={[4, 4, 0, 0]}
              stroke={barColor}
              strokeWidth={1}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
  
export default BarChartComponent;







