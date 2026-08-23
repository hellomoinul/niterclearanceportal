import { createFileRoute } from '@tanstack/react-router';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const Route = createFileRoute('/_authenticated/admin/reports')({
  component: BatchReports,
});

const data = [
  { name: 'CSE', cleared: 120, pending: 40 },
  { name: 'EEE', cleared: 98, pending: 62 },
  { name: 'Tex', cleared: 150, pending: 20 },
];

export default function BatchReports() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Batch Clearance Reports</h2>
      <div className="bg-white p-6 shadow-sm border rounded-lg max-w-4xl">
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip cursor={{ fill: '#f3f4f6' }} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="cleared" fill="#22c55e" name="Cleared Students" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" fill="#eab308" name="Pending Students" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}