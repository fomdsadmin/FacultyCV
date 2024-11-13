import { CartesianGrid, LineChart, ResponsiveContainer, YAxis, XAxis, Tooltip, Legend, Line } from 'recharts';

export const LineGraph = ({ data, dataKey, lineColor }) => {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}
            margin={{ left: 50 }}>
                
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                    dataKey="date" 
                    tickFormatter={(tick) => tick} // Directly use the string provided in the `date` field
                />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey={dataKey} stroke={lineColor || "#8884d8"} activeDot={{ r: 8 }} />
            </LineChart>  
        </ResponsiveContainer>
    );
};
