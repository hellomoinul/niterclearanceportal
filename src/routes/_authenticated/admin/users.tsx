import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { idToEmail, normalizeCode } from '@/lib/portal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const Route = createFileRoute('/_authenticated/admin/users')({
  component: UsersPage,
});

interface AccountRow {
  id: string;
  user_code: string | null;
  full_name: string | null;
  role: string;
  officeIds: string[];
  officeNames: string[];
  created_at: string | null;
}

interface Department {
  id: string;
  code: string;
  name: string;
}

const roleBadgeVariant = (role: string) =>
  role === 'admin' ? 'default' : role === 'office' ? 'secondary' : 'outline';

function UsersPage() {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    userCode: '',
    password: '',
    role: 'office',
    departmentId: '',
  });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const { data, refetch, isLoading } = useQuery({
    queryKey: ['admin-accounts'],
    queryFn: async () => {
      const [profiles, roles, bindings, departments] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, user_code, full_name, created_at')
          .order('created_at', { ascending: false }),
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('office_departments').select('user_id, department_id'),
        supabase.from('departments').select('id, code, name').order('sort_order'),
      ]);
      if (profiles.error) throw profiles.error;
      return {
        profiles: (profiles.data ?? []) as unknown as {
          id: string;
          user_code: string | null;
          full_name: string | null;
          created_at: string | null;
        }[],
        roles: (roles.data ?? []) as unknown as { user_id: string; role: string }[],
        bindings: (bindings.data ?? []) as unknown as { user_id: string; department_id: string }[],
        departments: (departments.data ?? []) as unknown as Department[],
      };
    },
  });

  const rows = useMemo<AccountRow[]>(() => {
    if (!data) return [];
    const roleMap = new Map<string, string>();
    for (const r of data.roles) {
      if (!roleMap.has(r.user_id)) roleMap.set(r.user_id, r.role);
    }
    const bindingMap = new Map<string, string[]>();
    for (const b of data.bindings) {
      const list = bindingMap.get(b.user_id) ?? [];
      list.push(b.department_id);
      bindingMap.set(b.user_id, list);
    }
    const deptName = (id: string) => data.departments.find((d) => d.id === id)?.name ?? id;
    return data.profiles.map((p) => ({
      id: p.id,
      user_code: p.user_code,
      full_name: p.full_name,
      role: roleMap.get(p.id) ?? 'student',
      officeIds: bindingMap.get(p.id) ?? [],
      officeNames: (bindingMap.get(p.id) ?? []).map(deptName),
      created_at: p.created_at,
    }));
  }, [data]);

  const portalEmail = useMemo(() => idToEmail(form.userCode), [form.userCode]);

  const visible = useMemo(() => {
    const q = normalizeCode(search);
    return rows.filter((r) => {
      if (roleFilter !== 'all' && r.role !== roleFilter) return false;
      if (!q) return true;
      return (
        (r.full_name ?? '').toLowerCase().includes(q) ||
        normalizeCode(r.user_code ?? '').includes(q)
      );
    });
  }, [rows, search, roleFilter]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.fullName.trim() || !form.userCode.trim()) {
      toast.error('Name and user code are required');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (form.role === 'office' && !form.departmentId) {
      toast.error('Select an office for this role');
      return;
    }
    setCreating(true);
    const { data: uid, error } = await (supabase as any).rpc('admin_create_account', {
      p_full_name: form.fullName.trim(),
      p_user_code: form.userCode.trim(),
      p_email: portalEmail,
      p_password: form.password,
      p_role: form.role,
      p_department_id: form.role === 'office' ? form.departmentId : null,
    });
    setCreating(false);
    if (error) {
      toast.error('Could not create account', { description: error.message });
      return;
    }
    toast.success('Account created', {
      description: `${form.fullName.trim()} can sign in with ${portalEmail}`,
    });
    setForm({ fullName: '', userCode: '', password: '', role: 'office', departmentId: '' });
    refetch();
  }

  async function changeRole(row: AccountRow, nextRole: string) {
    if (nextRole === row.role) return;
    if (row.id === user?.id) {
      toast.error('You cannot change your own role');
      return;
    }
    if (!window.confirm(`Change ${row.full_name ?? row.user_code}'s account to ${nextRole}?`)) return;
    const { error } = await supabase.from('user_roles').update({ role: nextRole as any }).eq('user_id', row.id);
    if (error) {
      toast.error('Could not change role', { description: error.message });
      return;
    }
    if (nextRole === 'admin') {
      await supabase.from('office_departments').delete().eq('user_id', row.id);
    }
    toast.success('Role updated');
    refetch();
  }

  async function changeOffice(row: AccountRow, departmentId: string) {
    if ((row.officeIds[0] ?? '') === departmentId) return;
    if (departmentId && !window.confirm(`Assign ${row.full_name ?? row.user_code} to the selected office?`)) return;
    const deleteRes = await supabase.from('office_departments').delete().eq('user_id', row.id);
    if (deleteRes.error) {
      toast.error('Could not update office', { description: deleteRes.error.message });
      return;
    }
    if (departmentId) {
      const insRes = await supabase.from('office_departments').insert({
        user_id: row.id,
        department_id: departmentId,
      });
      if (insRes.error) {
        toast.error('Could not assign office', { description: insRes.error.message });
        return;
      }
    }
    toast.success(departmentId ? 'Office assigned' : 'Office assignment removed');
    refetch();
  }

  async function resetPassword(row: AccountRow) {
    const pwd = window.prompt(
      `Set a new password for ${row.full_name ?? row.user_code} (min 6 characters):`,
    );
    if (pwd === null) return;
    if (pwd.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    const { error } = await (supabase as any).rpc('admin_reset_password', {
      p_user_id: row.id,
      p_password: pwd,
    });
    if (error) {
      toast.error('Could not reset password', { description: error.message });
      return;
    }
    toast.success('Password updated');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-sm text-muted-foreground">
          Create staff and administrator accounts, assign their office and manage roles.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create a staff account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                placeholder="e.g. Md. Kamal Hossain"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userCode">User code</Label>
              <Input
                id="userCode"
                placeholder="e.g. exam.office"
                value={form.userCode}
                onChange={(e) => setForm({ ...form, userCode: e.target.value })}
                required
              />
              {form.userCode.trim() && (
                <p className="text-xs text-muted-foreground">Sign-in email: {portalEmail}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v, departmentId: v === 'admin' ? '' : form.departmentId })}
              >
                <SelectTrigger id="role" className="w-full">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="office">Office staff</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.role === 'office' && (
              <div className="space-y-2">
                <Label htmlFor="office">Office</Label>
                <Select value={form.departmentId} onValueChange={(v) => setForm({ ...form, departmentId: v })}>
                  <SelectTrigger id="office" className="w-full">
                    <SelectValue placeholder="Select an office" />
                  </SelectTrigger>
                  <SelectContent>
                    {(data?.departments ?? []).map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-end">
              <Button type="submit" disabled={creating} className="w-full">
                {creating ? 'Creating…' : 'Create account'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search by name or user code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Role filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="office">Office staff</SelectItem>
                <SelectItem value="admin">Administrators</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <p className="py-4 text-sm text-muted-foreground">Loading accounts…</p>
          ) : visible.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              No accounts match your filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">User code</th>
                    <th className="py-2 pr-4">Portal ID</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2 pr-4">Office</th>
                    <th className="py-2 pr-4">Created</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <tr key={row.id} className="border-b last:border-b-0 align-middle">
                      <td className="py-2 pr-4 font-medium">{row.full_name ?? '—'}</td>
                      <td className="py-2 pr-4">{row.user_code ?? '—'}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {row.id === user?.id ? 'you' : row.user_code ? idToEmail(row.user_code) : '—'}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge variant={roleBadgeVariant(row.role) as any}>{row.role}</Badge>
                      </td>
                      <td className="py-2 pr-4">
                        {row.role === 'office' ? (
                          <Select
                            value={row.officeIds[0] ?? ''}
                            onValueChange={(v) => changeOffice(row, v)}
                          >
                            <SelectTrigger className="w-44">
                              <SelectValue
                                placeholder={row.officeNames[0] ?? 'Unassigned'}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Unassigned</SelectItem>
                              {(data?.departments ?? []).map((d) => (
                                <SelectItem key={d.id} value={d.id}>
                                  {d.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          {row.role !== 'student' && row.id !== user?.id && (
                            <Select value={row.role} onValueChange={(v) => changeRole(row, v)}>
                              <SelectTrigger className="h-8 w-24 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="office">office</SelectItem>
                                <SelectItem value="admin">admin</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          <Button size="sm" variant="outline" onClick={() => resetPassword(row)}>
                            Reset password
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}