import { createFileRoute, Link } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/_authenticated/admin/')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, cleared: 0, pending: 0 });

  useEffect(() => {
    async function load() {
      const [{ count: cleared }, { count: inReview }, { data: profiles }] = await Promise.all([
        supabase.from('clearance_applications').select('*', { count: 'exact', head: true }).eq('status', 'cleared'),
        supabase.from('clearance_applications').select('*', { count: 'exact', head: true }).eq('status', 'in_review'),
        supabase.from('profiles').select('role'),
      ]);
      const students = profiles?.filter((p: any) => p.role === 'student').length ?? 0;
      setStats({ students: students ?? 0, cleared: cleared ?? 0, pending: inReview ?? 0 });
    }
    load();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow-sm border">
          <p className="text-sm text-muted-foreground">Total Students</p>
          <p className="text-2xl font-bold">{stats.students}</p>
        </div>
        <div className="bg-white p-4 rounded shadow-sm border">
          <p className="text-sm text-muted-foreground">Cleared</p>
          <p className="text-2xl font-bold text-green-600">{stats.cleared}</p>
        </div>
        <div className="bg-white p-4 rounded shadow-sm border">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { to: '/admin/users', label: 'User Management', desc: 'Create staff accounts, assign roles' },
          { to: '/admin/audit', label: 'Audit Log', desc: 'View approval/rejection history' },
          { to: '/admin/notices', label: 'Notices', desc: 'Manage public notices' },
          { to: '/admin/reports', label: 'Reports', desc: 'Batch clearance statistics' },
          { to: '/admin/workflow', label: 'Workflow', desc: 'Configure deadlines and departments' },
        ].map((item) => (
          <Link key={item.to} to={item.to} className="block bg-white p-4 rounded shadow-sm border hover:bg-gray-50 transition">
            <p className="font-semibold">{item.label}</p>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
