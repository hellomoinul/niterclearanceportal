import { createFileRoute, Link } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const Route = createFileRoute('/_authenticated/admin/')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');
  },
  component: AdminDashboard,
});

interface NaRow {
  reviewId: string;
  fullName: string;
  userCode: string;
  program: string | null;
  deptName: string;
  appStatus: string;
  clearedAt: string | null;
}

type SortKey = 'fullName' | 'userCode' | 'deptName' | 'clearedAt';

function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, cleared: 0, pending: 0 });
  const [naRows, setNaRows] = useState<NaRow[]>([]);
  const [naLoading, setNaLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('clearedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

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

  useEffect(() => {
    async function loadNa() {
      const { data, error } = await supabase
        .from('department_reviews')
        .select(`
          id,
          status,
          departments(name),
          clearance_applications(
            status,
            cleared_at,
            profiles(full_name, user_code, program)
          )
        `)
        .eq('is_na', true);
      if (!error && data) {
        const raw = data as unknown as {
          id: string;
          status: string;
          departments: { name: string } | null;
          clearance_applications: {
            status: string;
            cleared_at: string | null;
            profiles: { full_name: string; user_code: string; program: string | null } | null;
          } | null;
        }[];
        const rows: NaRow[] = raw.map((r) => ({
          reviewId: r.id,
          fullName: r.clearance_applications?.profiles?.full_name ?? 'Unknown',
          userCode: r.clearance_applications?.profiles?.user_code ?? '—',
          program: r.clearance_applications?.profiles?.program ?? null,
          deptName: r.departments?.name ?? '—',
          appStatus: r.clearance_applications?.status ?? '—',
          clearedAt: r.clearance_applications?.cleared_at ?? null,
        }));
        setNaRows(rows);
      }
      setNaLoading(false);
    }
    loadNa();
  }, []);

  const deptOptions = useMemo(
    () => [...new Set(naRows.map((r) => r.deptName))].sort(),
    [naRows],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = naRows.filter((r) => {
      if (deptFilter !== 'all' && r.deptName !== deptFilter) return false;
      if (!q) return true;
      return r.fullName.toLowerCase().includes(q) || r.userCode.toLowerCase().includes(q);
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    return filtered.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'clearedAt') {
        const av = a.clearedAt ? new Date(a.clearedAt).getTime() : 0;
        const bv = b.clearedAt ? new Date(b.clearedAt).getTime() : 0;
        cmp = av - bv;
      } else {
        cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
      }
      return cmp * dir;
    });
  }, [naRows, search, deptFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function sortIndicator(key: SortKey) {
    if (key !== sortKey) return '';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  }

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {[
          { to: '/admin/users', label: 'User Management', desc: 'Create staff accounts, assign roles' },
          { to: '/admin/audit', label: 'Audit Log', desc: 'View approval/rejection history' },
          { to: '/admin/notices', label: 'Notices', desc: 'Manage public notices' },
          { to: '/admin/reports', label: 'Reports', desc: 'Academic year clearance statistics' },
          { to: '/admin/workflow', label: 'Workflow', desc: 'Configure deadlines and departments' },
        ].map((item) => (
          <Link key={item.to} to={item.to} className="block bg-white p-4 rounded shadow-sm border hover:bg-gray-50 transition">
            <p className="font-semibold">{item.label}</p>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded shadow-sm border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold">N/A declarations</h3>
            <p className="text-sm text-muted-foreground">
              Students who declared a department not applicable during application. Verify these
              claims before accepting certificates.
            </p>
          </div>
          <span className="text-sm font-semibold">{visible.length} record{visible.length === 1 ? '' : 's'}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Input
            placeholder="Search by student name or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {deptOptions.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {naLoading ? (
          <p className="text-sm text-muted-foreground py-4">Loading declarations…</p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No N/A declarations found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 cursor-pointer select-none" onClick={() => toggleSort('fullName')}>
                    Student{sortIndicator('fullName')}
                  </th>
                  <th className="py-2 pr-4 cursor-pointer select-none" onClick={() => toggleSort('userCode')}>
                    ID{sortIndicator('userCode')}
                  </th>
                  <th className="py-2 pr-4">Program</th>
                  <th className="py-2 pr-4 cursor-pointer select-none" onClick={() => toggleSort('deptName')}>
                    Declared N/A{sortIndicator('deptName')}
                  </th>
                  <th className="py-2 pr-4">Application</th>
                  <th className="py-2 cursor-pointer select-none" onClick={() => toggleSort('clearedAt')}>
                    Certificate issued{sortIndicator('clearedAt')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.reviewId} className="border-b last:border-b-0">
                    <td className="py-2 pr-4 font-medium">{r.fullName}</td>
                    <td className="py-2 pr-4">{r.userCode}</td>
                    <td className="py-2 pr-4">{r.program ?? '—'}</td>
                    <td className="py-2 pr-4">{r.deptName}</td>
                    <td className="py-2 pr-4">
                      {r.appStatus === 'cleared' ? (
                        <span className="text-green-600 font-medium">Cleared</span>
                      ) : (
                        <span className="text-orange-600 font-medium">In review</span>
                      )}
                    </td>
                    <td className="py-2">
                      {r.clearedAt ? new Date(r.clearedAt).toLocaleDateString('en-GB') : 'Not yet'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {visible.length > 0 && (
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const header = ['Student', 'ID', 'Program', 'Declared N/A', 'Application', 'Certificate issued'];
                const lines = visible.map((r) =>
                  [r.fullName, r.userCode, r.program ?? '', r.deptName, r.appStatus, r.clearedAt ?? 'Not yet'].join(','),
                );
                const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `na-declarations-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export CSV
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
