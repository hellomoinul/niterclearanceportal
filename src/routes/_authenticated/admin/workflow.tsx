import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowUp,
  ArrowDown,
  Loader2,
  Save,
  Workflow,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/workflow")({
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

  // Add office dialog state
  const [addOfficeOpen, setAddOfficeOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addCode, setAddCode] = useState("");
  const [addRequirement, setAddRequirement] = useState("");
  const [addSortOrder, setAddSortOrder] = useState(0);

  // Edit office dialog state
  const [editOfficeOpen, setEditOfficeOpen] = useState(false);
  const [editRow, setEditRow] = useState<DepartmentRow | null>(null);
  const [editRequirement, setEditRequirement] = useState("");
  const [editIsFinal, setEditIsFinal] = useState(false);

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchOffices();
  }, []);

  const fetchOffices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("departments")
      .select("id, code, name, requirement, sort_order, is_final_signoff")
      .order("sort_order", { ascending: true });
    if (!error && data) {
      setRows(data as DepartmentRow[]);
    } else if (error) {
      toast.error("Failed to load offices", { description: error.message });
    }
    setLoading(false);
  };

  const moveRow = (index: number, direction: "up" | "down") => {
    setRows((prev) => {
      const target = direction === "up" ? index - 1 : index + 1;
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
        toast.error("At least one office must be the final sign-off.");
        return;
      }
    }
    setRows((prev) =>
      prev.map((row) => {
        if (row.id === id) return { ...row, is_final_signoff: checked, sort_order: row.sort_order };
        if (checked) return { ...row, is_final_signoff: false, sort_order: row.sort_order };
        return row;
      }),
    );
  };

  // Add office via RPC
  const handleAddOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addCode.trim()) return;

    const rpcArgs: { name: string; code: string; sort_order: number; requirement?: string } = {
      name: addName.trim(),
      code: addCode.trim().toUpperCase(),
      sort_order: addSortOrder,
    };
    if (addRequirement.trim()) rpcArgs.requirement = addRequirement.trim();

    const { error } = await supabase.rpc("admin_add_office", rpcArgs);

    if (error) {
      toast.error("Failed to add office", { description: error.message });
      return;
    }

    toast.success("Office added successfully");
    setAddOfficeOpen(false);
    setAddName("");
    setAddCode("");
    setAddRequirement("");
    setAddSortOrder(0);
    fetchOffices();
  };

  // Edit office requirement + final sign-off toggle
  const openEditDialog = (row: DepartmentRow) => {
    setEditRow(row);
    setEditRequirement(row.requirement ?? "");
    setEditIsFinal(row.is_final_signoff);
    setEditOfficeOpen(true);
  };

  const handleEditOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRow) return;

    const { error } = await supabase
      .from("departments")
      .update({
        requirement: editRequirement.trim() || null,
        is_final_signoff: editIsFinal,
      })
      .eq("id", editRow.id);

    if (error) {
      toast.error("Failed to update office", { description: error.message });
      return;
    }

    toast.success("Office updated successfully");
    setEditOfficeOpen(false);
    setEditRow(null);
    fetchOffices();
  };

  // Delete office via RPC
  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleDeleteOffice = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);

    const { error } = await supabase.rpc("admin_remove_office", {
      p_dept_id: deleteId,
    });

    setDeleteLoading(false);
    if (error) {
      toast.error("Failed to remove office", { description: error.message });
      return;
    }

    toast.success("Office removed successfully");
    setDeleteId(null);
    fetchOffices();
  };

  const handleConfirmSave = async () => {
    setShowConfirmDialog(false);
    if (rows.filter((row) => row.is_final_signoff).length !== 1) {
      toast.error("Exactly one office must be marked as the final sign-off.");
      return;
    }
    setSaving(true);

    // Atomic batch save: all updates in a single transaction-like batch
    // Since Supabase doesn't support true client-side transactions, we use Promise.all
    // and rollback on failure by re-fetching (or we could do individual rollbacks)
    const updates = rows.map((row) =>
      supabase
        .from("departments")
        .update({ sort_order: row.sort_order, is_final_signoff: row.is_final_signoff })
        .eq("id", row.id),
    );

    const results = await Promise.all(updates);
    const hasError = results.some((r) => r.error);
    setSaving(false);

    if (hasError) {
      const firstError = results.find((r) => r.error)?.error;
      toast.error("Failed to save office order", { description: firstError?.message });
      // Rollback by re-fetching
      fetchOffices();
    } else {
      toast.success("Office workflow sequence saved successfully!");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Office Workflow Editor</h1>
          <p className="text-muted-foreground text-sm">
            Set the sequential order in which offices review clearance applications and designate
            the final sign-off authority.
          </p>
        </div>

        <Button
          onClick={() => setShowConfirmDialog(true)}
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Office Order
            </>
          )}
        </Button>
        <Button
          onClick={() => setAddOfficeOpen(true)}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Office
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
              <TableHead className="text-right">Actions</TableHead>
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
                    <Badge
                      variant="outline"
                      className="w-7 h-7 rounded-full flex items-center justify-center p-0 mx-auto"
                    >
                      {row.sort_order}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="flex items-center gap-2">
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
                      <span className="text-sm text-muted-foreground line-clamp-2">
                        {row.requirement}
                      </span>
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
                        onClick={() => openEditDialog(row)}
                        title="Edit office"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => confirmDelete(row.id)}
                        title="Remove office"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={index === 0}
                        onClick={() => moveRow(index, "up")}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={index === rows.length - 1}
                        onClick={() => moveRow(index, "down")}
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
          This order directly dictates the clearance flow: students progress sequentially from step
          1 to the final sign-off office. Only the designated final sign-off office approval
          triggers clearance completion and certificate issuance.
        </p>
      </div>

      {/* Add Office Dialog */}
      <Dialog open={addOfficeOpen} onOpenChange={setAddOfficeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Office</DialogTitle>
            <DialogDescription>
              Enter the details for the new office. The sort order determines its position in the
              workflow.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddOffice} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Office Name</label>
              <Input
                placeholder="e.g. Computer Science Engineering"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Office Code</label>
              <Input
                placeholder="e.g. CSE"
                value={addCode}
                onChange={(e) => setAddCode(e.target.value)}
                required
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort Order (0 = first)</label>
              <Input
                type="number"
                value={addSortOrder}
                onChange={(e) => setAddSortOrder(Number(e.target.value))}
                min={0}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Requirement (optional)</label>
              <Textarea
                placeholder="e.g. Original transcripts and NOC required"
                value={addRequirement}
                onChange={(e) => setAddRequirement(e.target.value)}
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOfficeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Adding..." : "Add Office"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Office Dialog */}
      <Dialog open={editOfficeOpen} onOpenChange={setEditOfficeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Office</DialogTitle>
            <DialogDescription>
              Update the requirement and final sign-off status for this office.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditOffice} className="space-y-4 mt-4">
            {editRow && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Office</label>
                <Input value={`${editRow.name} (${editRow.code})`} readOnly className="bg-muted" />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Requirement</label>
              <Textarea
                placeholder="e.g. Original transcripts and NOC required"
                value={editRequirement}
                onChange={(e) => setEditRequirement(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editIsFinal} onCheckedChange={setEditIsFinal} />
              <label className="text-sm font-medium">Final Sign-off Office</label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditOfficeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Office Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Office?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the office and its review data. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOffice} disabled={deleteLoading}>
              {deleteLoading ? "Removing..." : "Remove Office"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Workflow Sequence?</AlertDialogTitle>
            <AlertDialogDescription>
              Updating the office order will change the review sequence for all active and future
              clearance applications. Ensure that exactly one office is set as the final sign-off.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>Confirm & Save</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
