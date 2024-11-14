import { CartesianGrid, LineChart, ResponsiveContainer, YAxis, XAxis, Tooltip, Legend, Line } from 'recharts';

export const LineGraph = ({ data, dataKey, lineColor }) => {
    return (
        <ResponsiveContainer width="80%" height="100%">
            <LineChart data={data}
            margin={{ left: 50 }}>
                
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                    dataKey="date" 
                    tickFormatter={(tick) => tick}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey={dataKey} stroke={lineColor} />
            </LineChart>
        </ResponsiveContainer>
    );
};
