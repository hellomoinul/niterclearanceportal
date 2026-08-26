import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const Route = createFileRoute('/_authenticated/admin/audit')({
  component: AuditLogPage,
});

interface AuditEntry {
  id: string;
  action: string;
  actor_id: string | null;
  actor_name: string | null;
  entity: string | null;
  entity_id: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

const PAGE_SIZE = 25;

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchAuditLogs();
  }, [page, actionFilter, search]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    let query = supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, end);

    if (actionFilter !== 'all') {
      query = query.eq('action', actionFilter);
    }

    if (search.trim()) {
      query = query.ilike('actor_name', `%${search.trim()}%`);
    }

    const { data, count, error } = await query;

    if (!error && data) {
      setLogs(data as AuditEntry[]);
      setTotalCount(count ?? 0);
    }
    setLoading(false);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Audit Log</h1>
          <p className="text-muted-foreground text-sm">
            Read-only record of all activity and operations performed across the system.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by actor name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-64"
          />

          <Select
            value={actionFilter}
            onValueChange={(val) => {
              setActionFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Action Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="escalated">Escalated</SelectItem>
              <SelectItem value="uploaded doc">Uploaded Doc</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg bg-card overflow-x-auto shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Entity</th>
              <th className="px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Loading audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No audit logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {log.actor_name || 'System / Unknown'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary border">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {log.entity || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
                    {log.details || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Page {page} of {totalPages} ({totalCount} total entries)
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}