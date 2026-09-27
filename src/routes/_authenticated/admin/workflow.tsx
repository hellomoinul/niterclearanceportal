import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowUp,
  ArrowDown,
  Loader2,
  Save,
  Workflow,
  CheckCircle2,
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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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
    } else if (error) {
      toast.error('Failed to load offices', { description: error.message });
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
      const target = rows.find((row) => row.id === id);
      if (target?.is_final_signoff && rows.filter((row) => row.is_final_signoff).length === 1) {
        toast.error('At least one office must be the final sign-off.');
        return;
      }
    }
    setRows((prev) =>
      prev.map((row) => {
        if (row.id === id) return { ...row, is_final_signoff: checked, sort_order: row.sort_order };
        if (checked) return { ...row, is_final_signoff: false, sort_order: row.sort_order };
        return row;
      })
    );
  };

  const handleConfirmSave = async () => {
    setShowConfirmDialog(false);
    if (rows.filter((row) => row.is_final_signoff).length !== 1) {
      toast.error('Exactly one office must be marked as the final sign-off.');
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
      toast.error('Failed to save office order', { description: (error as Error).message });
    } else {
      toast.success('Office workflow sequence saved successfully!');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Office Workflow Editor</h1>
          <p className="text-muted-foreground text-sm">
            Set the sequential order in which offices review clearance applications and designate the final sign-off authority.
          </p>
        </div>

        <Button onClick={() => setShowConfirmDialog(true)} disabled={saving} className="flex items-center gap-2">
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4" /> Save Office Order</>
          )}
        </Button>
      </div>

      <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">Step</TableHead>
              <TableHead>Office</TableHead>
              <TableHead>Requirement</TableHead>
              <TableHead>Final Sign-off</TableHead>
              <TableHead className="text-right">Reorder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Loading workflow sequence...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No offices configured yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell className="font-bold text-center">
                    <Badge variant="outline" className="w-7 h-7 rounded-full flex items-center justify-center p-0 mx-auto">
                      {row.sort_order}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{row.name}</span>
                      <Badge variant="secondary">{row.code}</Badge>
                      {row.is_final_signoff && (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Final Sign-off
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    {row.requirement ? (
                      <span className="text-sm text-muted-foreground line-clamp-2">{row.requirement}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">— None —</span>
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

      <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg border">
        <Workflow className="w-5 h-5 mt-0.5 text-primary shrink-0" />
        <p>
          This order directly dictates the clearance flow: students progress sequentially from step 1 to the final sign-off office. Only the designated final sign-off office approval triggers clearance completion and certificate issuance.
        </p>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Workflow Sequence?</AlertDialogTitle>
            <AlertDialogDescription>
              Updating the office order will change the review sequence for all active and future clearance applications. Ensure that exactly one office is set as the final sign-off.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>Confirm & Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}