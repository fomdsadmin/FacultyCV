import { CartesianGrid, LineChart, ResponsiveContainer, YAxis, XAxis, Tooltip, Legend, Line} from 'recharts';

export const LineGraph = ({ data }) => {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Users" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>  
        </ResponsiveContainer>
    )
}