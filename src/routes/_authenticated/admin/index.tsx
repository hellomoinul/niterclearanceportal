import { createFileRoute, Link } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, ArrowRight, ShieldAlert, History, ExternalLink } from 'lucide-react';

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

interface AuditRow {
  id: string;
  action: string;
  created_at: string;
  user_code: string | null;
}

type SortKey = 'fullName' | 'userCode' | 'deptName' | 'clearedAt';

export function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, cleared: 0, pending: 0 });
  const [naRows, setNaRows] = useState<NaRow[]>([]);
  const [naLoading, setNaLoading] = useState(true);
  const [escalatedCount, setEscalatedCount] = useState(0);
  const [recentAudits, setRecentAudits] = useState<AuditRow[]>([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('clearedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    async function loadStatsAndAttention() {
      const [{ count: cleared }, { count: inReview }, { count: students }, { count: escalated }, { data: audits }] = await Promise.all([
        supabase.from('clearance_applications').select('*', { count: 'exact', head: true }).eq('status', 'cleared'),
        supabase.from('clearance_applications').select('*', { count: 'exact', head: true }).eq('status', 'in_review'),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('department_reviews').select('*', { count: 'exact', head: true }).eq('escalated', true),
        supabase.from('audit_log').select('id, action, created_at, user_code').order('created_at', { ascending: false }).limit(5),
      ]);

      setStats({ students: students ?? 0, cleared: cleared ?? 0, pending: inReview ?? 0 });
      setEscalatedCount(escalated ?? 0);
      if (audits) {
        setRecentAudits(audits as unknown as AuditRow[]);
      }
    }
    loadStatsAndAttention();
  }, []);

  useEffect(() => {
    loadNa();
  }, []);

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

  async function handleRevertNa(row: NaRow) {
    if (
      !window.confirm(
        `Revert ${row.fullName}'s N/A declaration for ${row.deptName} back to pending review? This reopens the office for a real document check.`,
      )
    ) {
      return;
    }
    const { error } = await supabase.rpc('reopen_na_review', { p_review_id: row.reviewId });
    if (error) {
      toast.error('Could not revert declaration', { description: error.message });
      return;
    }
    toast.success('N/A declaration reverted to pending');
    loadNa();
  }

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
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <p className="text-sm text-muted-foreground">Overview of portal clearance applications and administrative task queue.</p>
      </div>

      {/* S-v3.3: 4 Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border shadow-sm">
          <p className="text-sm text-muted-foreground">Registered students <span className="text-xs italic">(accounts)</span></p>
          <p className="text-2xl font-bold mt-1">{stats.students}</p>
        </div>

        <div className="bg-card p-4 rounded-lg border shadow-sm">
          <p className="text-sm text-muted-foreground">Cleared applications</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.cleared}</p>
        </div>

        <div className="bg-card p-4 rounded-lg border shadow-sm">
          <p className="text-sm text-muted-foreground">Pending applications</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.pending}</p>
        </div>

        {/* 4th Stat Card: Escalated with 'as any' to avoid TS error before S-v3.4 */}
        <Link 
          to={"/admin/escalations" as any} 
          className="bg-card p-4 rounded-lg border border-rose-200 dark:border-rose-900/50 shadow-sm hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition group block"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> Escalated Cases
            </p>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-rose-600 transition" />
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{escalatedCount}</p>
        </Link>
      </div>

      {/* Needs Attention Panel */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" /> Needs Attention
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border shadow-sm flex flex-col justify-between ${escalatedCount > 0 ? 'bg-rose-50/60 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900' : 'bg-card'}`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500" /> Escalated Cases
                </span>
                {escalatedCount > 0 && <Badge variant="destructive">{escalatedCount} Active</Badge>}
              </div>
              <p className="text-2xl font-bold mt-2">{escalatedCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Applications flagged by office staff requiring admin intervention.</p>
            </div>
            <Link 
              to={"/admin/escalations" as any} 
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline mt-4 flex items-center gap-1"
            >
              View Escalations <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-card p-4 rounded-lg border shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-500" /> Pending N/A Declarations
                </span>
                <Badge variant="secondary">{naRows.filter(r => r.appStatus !== 'cleared').length} Pending</Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{naRows.filter(r => r.appStatus !== 'cleared').length}</p>
              <p className="text-xs text-muted-foreground mt-1">Student-claimed unapplicable offices waiting for verification.</p>
            </div>
            <a href="#na-declarations" className="text-xs font-semibold text-primary hover:underline mt-4 flex items-center gap-1">
              Jump to Table <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          <div className="bg-card p-4 rounded-lg border shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold flex items-center gap-1.5">
                  <History className="w-4 h-4 text-blue-500" /> Recent Activity
                </span>
              </div>
              <div className="space-y-1.5">
                {recentAudits.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No recent activity.</p>
                ) : (
                  recentAudits.slice(0, 3).map((a) => (
                    <div key={a.id} className="text-xs flex items-center justify-between text-muted-foreground">
                      <span className="truncate max-w-[150px] font-medium text-foreground">{a.action}</span>
                      <span>{new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <Link to="/admin/audit" className="text-xs font-semibold text-primary hover:underline mt-4 flex items-center gap-1">
              Full Audit History <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      <div id="na-declarations" className="bg-card rounded-lg border shadow-sm p-4">
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
                  <th className="py-2 pl-4">Action</th>
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
                        <span className="text-emerald-600 font-medium">Cleared</span>
                      ) : (
                        <span className="text-amber-600 font-medium">In review</span>
                      )}
                    </td>
                    <td className="py-2">
                      {r.clearedAt ? new Date(r.clearedAt).toLocaleDateString('en-GB') : 'Not yet'}
                    </td>
                    <td className="py-2 pl-4">
                      {r.appStatus === 'cleared' ? (
                        <span className="text-xs text-muted-foreground">Issued</span>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleRevertNa(r)}>
                          Revert to pending
                        </Button>
                      )}
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