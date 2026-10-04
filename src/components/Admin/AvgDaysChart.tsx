import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DepartmentStat {
  department: string;
  approved: number;
  pending: number;
  rejected: number;
  avgDaysToApprove: number | null;
}

interface AvgDaysChartProps {
  deptStats: DepartmentStat[];
  loading: boolean;
}

export function AvgDaysChart({ deptStats, loading }: AvgDaysChartProps) {
  const filteredStats = deptStats
    .filter((d) => d.avgDaysToApprove !== null)
    .sort((a, b) => (b.avgDaysToApprove || 0) - (a.avgDaysToApprove || 0));

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Loading chart data...
      </div>
    );
  }

  if (filteredStats.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={filteredStats}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="department" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="avgDaysToApprove"
            fill="#3b82f6"
            name="Avg Days to Approve"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
