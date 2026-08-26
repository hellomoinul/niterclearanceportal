import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const Route = createFileRoute('/_authenticated/admin/reports')({
  component: ClearanceReportsPage,
});

interface DepartmentStat {
  department: string;
  approved: number;
  pending: number;
  rejected: number;
}

interface StatusSummary {
  name: string;
  value: number;
  color: string;
}

const COLORS = ['#22c55e', '#eab308', '#ef4444', '#3b82f6'];

export default function ClearanceReportsPage() {
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [deptStats, setDeptStats] = useState<DepartmentStat[]>([]);
  const [statusStats, setStatusStats] = useState<StatusSummary[]>([]);
  const [totalApplications, setTotalApplications] = useState(0);

  useEffect(() => {
    fetchReportData();
  }, [selectedBatch]);

  const fetchReportData = async () => {
    setLoading(true);

    let query = supabase.from('clearance_applications').select('*');

    if (selectedBatch !== 'all') {
      query = (query as any).eq('batch', selectedBatch);
    }

    const { data: apps, error } = await query;

    if (!error && apps) {
      setTotalApplications(apps.length);

      let approvedCount = 0;
      let pendingCount = 0;
      let rejectedCount = 0;

      const deptMap: Record<string, { approved: number; pending: number; rejected: number }> = {};

      apps.forEach((app: any) => {
        const status = (app.status || 'pending').toLowerCase();
        const dept = app.department || 'General';

        if (!deptMap[dept]) {
          deptMap[dept] = { approved: 0, pending: 0, rejected: 0 };
        }

        if (status === 'approved' || status === 'cleared') {
          approvedCount++;
          deptMap[dept].approved++;
        } else if (status === 'rejected') {
          rejectedCount++;
          deptMap[dept].rejected++;
        } else {
          pendingCount++;
          deptMap[dept].pending++;
        }
      });

      setStatusStats([
        { name: 'Approved', value: approvedCount, color: '#22c55e' },
        { name: 'Pending', value: pendingCount, color: '#eab308' },
        { name: 'Rejected', value: rejectedCount, color: '#ef4444' },
      ]);

      const formattedDeptStats: DepartmentStat[] = Object.keys(deptMap).map((dept) => ({
        department: dept,
        approved: deptMap[dept]?.approved || 0,
        pending: deptMap[dept]?.pending || 0,
        rejected: deptMap[dept]?.rejected || 0,
      }));

      setDeptStats(formattedDeptStats);
    }

    setLoading(false);
  };

  const handleExportCSV = () => {
    if (deptStats.length === 0) return;

    const headers = ['Department', 'Approved', 'Pending', 'Rejected'];
    const rows = deptStats.map((d) => [d.department, d.approved, d.pending, d.rejected]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `clearance_report_${selectedBatch}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Batch Clearance Reports</h1>
          <p className="text-muted-foreground text-sm">
            Live metrics, clearance status distribution, and department progress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedBatch} onValueChange={setSelectedBatch}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              <SelectItem value="2020">Batch 2020</SelectItem>
              <SelectItem value="2021">Batch 2021</SelectItem>
              <SelectItem value="2022">Batch 2022</SelectItem>
              <SelectItem value="2023">Batch 2023</SelectItem>
              <SelectItem value="2024">Batch 2024</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleExportCSV} variant="outline">
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
          <span className="text-xs font-medium text-muted-foreground uppercase">
            Total Applications
          </span>
          <p className="text-2xl font-bold mt-2">{totalApplications}</p>
        </div>
        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
          <span className="text-xs font-medium text-muted-foreground uppercase">
            Approved Applications
          </span>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {statusStats.find((s) => s.name === 'Approved')?.value || 0}
          </p>
        </div>
        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
          <span className="text-xs font-medium text-muted-foreground uppercase">
            Pending Applications
          </span>
          <p className="text-2xl font-bold text-amber-500 mt-2">
            {statusStats.find((s) => s.name === 'Pending')?.value || 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 border rounded-lg bg-card shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">Overall Status Distribution</h2>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Loading chart data...
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="p-5 border rounded-lg bg-card shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">Department Progress Breakdown</h2>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Loading department statistics...
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="approved" fill="#22c55e" name="Approved" />
                  <Bar dataKey="pending" fill="#eab308" name="Pending" />
                  <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}