import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  ArrowUp,
  ArrowDown,
  Loader2,
  Save,
  Workflow,
} from 'lucide-react';

export const Route = createFileRoute('/_authenticated/admin/workflow')({
  component: OfficeEditorPage,
});

interface DepartmentRow {
  id: string;
  code: string;
  name: string;
  requirement: string | null;
  sort_order: number;
  is_final_signoff: boolean;
}

export default function OfficeEditorPage() {
  const [rows, setRows] = useState<DepartmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOffices();
  }, []);

  const fetchOffices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('departments')
      .select('id, code, name, requirement, sort_order, is_final_signoff')
      .order('sort_order', { ascending: true });
    if (!error && data) {
      setRows(data as DepartmentRow[]);
    }
    setLoading(false);
  };

  const moveRow = (index: number, direction: 'up' | 'down') => {
    setRows((prev) => {
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      if (!item) return prev;
      next.splice(target, 0, item);
      return next.map((row, i) => ({ ...row, sort_order: i + 1 }));
    });
  };

  const toggleFinalSignoff = (id: string, checked: boolean) => {
    if (!checked) {
      // Keep exactly one final sign-off office at all times.
      const target = rows.find((row) => row.id === id);
      if (target?.is_final_signoff && rows.filter((row) => row.is_final_signoff).length === 1) {
        return;
      }
    }
    setRows((prev) =>
      prev.map((row) => {
        if (row.id === id) return { ...row, is_final_signoff: checked, sort_order: row.sort_order };
        // Exactly one final sign-off office: enabling one clears the others.
        if (checked) return { ...row, is_final_signoff: false, sort_order: row.sort_order };
        return row;
      })
    );
  };

  const handleSave = async () => {
    if (rows.filter((row) => row.is_final_signoff).length !== 1) {
      alert('Exactly one office must be marked as the final sign-off.');
      return;
    }
    setSaving(true);
    let error: unknown = null;
    for (const row of rows) {
      const { error: e } = await supabase
        .from('departments')
        .update({ sort_order: row.sort_order, is_final_signoff: row.is_final_signoff })
        .eq('id', row.id);
      if (e) {
        error = e;
        break;
      }
    }
    setSaving(false);
    if (error) {
      alert('Failed to save office order: ' + (error as Error).message);
    } else {
      alert('Office order saved successfully!');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Office Editor</h1>
          <p className="text-muted-foreground text-sm">
            Set the order in which offices review every clearance application, and mark the
            final sign-off office (fires certificate issuance).
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4" /> Save Office Order</>
          )}
        </Button>
      </div>

      <div className="border rounded-lg bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Step</TableHead>
              <TableHead>Office</TableHead>
              <TableHead>Requirement</TableHead>
              <TableHead>Final sign-off</TableHead>
              <TableHead className="text-right">Reorder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  Loading offices...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  No offices configured yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell className="font-bold text-center">
                    <Badge variant="outline" className="w-7 h-7 rounded-full flex items-center justify-center p-0">
                      {row.sort_order}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{row.name}</span>
                      <Badge variant="secondary">{row.code}</Badge>
                      {row.is_final_signoff && (
                        <Badge className="bg-emerald-100 text-emerald-700">Final sign-off</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    {row.requirement ? (
                      <span className="text-sm text-muted-foreground line-clamp-2">{row.requirement}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={row.is_final_signoff}
                      onCheckedChange={(checked) => toggleFinalSignoff(row.id, checked)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={index === 0}
                        onClick={() => moveRow(index, 'up')}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={index === rows.length - 1}
                        onClick={() => moveRow(index, 'down')}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <Workflow className="w-4 h-4 mt-0.5" />
        <p>
          This order is what actually drives every clearance: a student cannot move to the
          next office until the current one approves. Exactly one office should be the final
          sign-off — it is the one whose approval issues the certificate.
        </p>
      </div>
    </div>
  );
}