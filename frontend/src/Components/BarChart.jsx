// // BarChartComponent.jsx
// import React from 'react';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// const BarChartComponent = ({ data, dataKey, xAxisKey, title, barColor }) => {
//   return (
//     <div className="h-[350px] w-full"> {/* Adjusted height for uniformity */}
//       <ResponsiveContainer width="100%" height="90%"> {/* Consistent height */}
//         <BarChart data={data}>
//           <CartesianGrid strokeDasharray="3 3" />
//           <XAxis dataKey={xAxisKey} interval={0} /> {/* Ensures all labels are shown */}
//           <YAxis />
//           <Tooltip />
//           <Legend />
//           <Bar dataKey={dataKey} fill={barColor || "#8884d8"} />
//         </BarChart>
//       </ResponsiveContainer>
//     </div>
//   );
// };

// export default BarChartComponent;
// BarChartComponent.jsx
// BarChartComponent.jsx
// BarChartComponent.jsx
// BarChartComponent.jsx
// BarChartComponent.jsx
// BarChartComponent.jsx
// BarChartComponent.jsx
// import React from 'react';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// const BarChartComponent = ({ data, dataKey, xAxisKey, title, barColor }) => {
//   return (
//     <div style={{ overflowX: 'auto', width: '80%' }}> {/* Set width same as LineGraph and add scroll */}
//       <div style={{ width: '2000px' }}> {/* Wider width for better spacing of labels */}
//         <ResponsiveContainer width="100%" height={350}> {/* Adjust height as needed */}
//           <BarChart data={data}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis dataKey={xAxisKey} interval={0} angle={-45} textAnchor="end" /> {/* Avoid overlapping with angled labels */}
//             <YAxis />
//             <Tooltip />
//             <Legend />
//             <Bar dataKey={dataKey} fill={barColor} />
//           </BarChart>
//         </ResponsiveContainer>
//       </div>
//     </div>
//   );
// };

// export default BarChartComponent;
// BarChartComponent.jsx
// BarChartComponent.jsx
// BarChartComponent.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BarChartComponent = ({ data, dataKey, xAxisKey, title, barColor }) => {
  return (
    <div style={{ overflowX: 'auto', width: '80%', marginLeft: '3%' }}> {/* Adjusted margin for alignment */}
      <div style={{ width: '2000px' }}> {/* Wider width for better spacing of labels */}
        <ResponsiveContainer width="100%" height={350}> {/* Adjust height as needed */}
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} interval={0} /> {/* Removed angle and textAnchor for straight labels */}
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={dataKey} fill={barColor} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BarChartComponent;






