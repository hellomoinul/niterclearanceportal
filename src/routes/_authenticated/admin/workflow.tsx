import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowUp, ArrowDown, Trash2, GitCommit, Save } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/admin/workflow')({
  component: WorkflowConfigPage,
});

interface WorkflowStep {
  id: string;
  step_name: string;
  department: string;
  step_order: number;
  is_required: boolean;
  auto_approve: boolean;
}

export default function WorkflowConfigPage() {
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newStepName, setNewStepName] = useState('');
  const [newDept, setNewDept] = useState('LIBRARY');

  useEffect(() => {
    fetchWorkflow();
  }, []);

  const fetchWorkflow = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('workflow_steps')
      .select('*')
      .order('step_order', { ascending: true });

    if (!error && data && data.length > 0) {
      setSteps(data as WorkflowStep[]);
    } else {
      setSteps([
        { id: crypto.randomUUID(), step_name: 'Library Dues Check', department: 'LIBRARY', step_order: 1, is_required: true, auto_approve: false },
        { id: crypto.randomUUID(), step_name: 'Accounts & Tuition Fee', department: 'ACCOUNTS', step_order: 2, is_required: true, auto_approve: false },
        { id: crypto.randomUUID(), step_name: 'Departmental Head Approval', department: 'CSE', step_order: 3, is_required: true, auto_approve: false },
        { id: crypto.randomUUID(), step_name: 'Central Registrar Sign-off', department: 'REGISTRAR', step_order: 4, is_required: true, auto_approve: false },
      ]);
    }
    setLoading(false);
  };

  const handleAddStep = () => {
    if (!newStepName.trim()) return;

    const newStep: WorkflowStep = {
      id: crypto.randomUUID(),
      step_name: newStepName,
      department: newDept,
      step_order: steps.length + 1,
      is_required: true,
      auto_approve: false,
    };

    setSteps([...steps, newStep]);
    setNewStepName('');
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const updated = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= updated.length) return;

    const currentItem = updated[index];
    const targetItem = updated[targetIndex];

    if (!currentItem || !targetItem) return;

    updated[index] = targetItem;
    updated[targetIndex] = currentItem;

    const reordered = updated.map((step, idx) => ({
      ...step,
      step_order: idx + 1,
    }));

    setSteps(reordered);
  };

  const handleToggleRequired = (id: string, checked: boolean) => {
    setSteps(
      steps.map((s) => (s.id === id ? { ...s, is_required: checked } : s))
    );
  };

  const handleDeleteStep = (id: string) => {
    const filtered = steps.filter((s) => s.id !== id);
    const reordered = filtered.map((step, idx) => ({
      ...step,
      step_order: idx + 1,
    }));
    setSteps(reordered);
  };

  const handleSaveWorkflow = async () => {
    setSaving(true);
    const { error } = await (supabase as any)
      .from('workflow_steps')
      .upsert(steps, { onConflict: 'id' });

    setSaving(false);
    if (!error) {
      alert('Workflow configuration saved successfully!');
    } else {
      alert('Failed to save workflow: ' + error.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clearance Workflow Configuration</h1>
          <p className="text-muted-foreground text-sm">
            Define approval stages, step execution sequence, and departmental responsibilities.
          </p>
        </div>

        <Button onClick={handleSaveWorkflow} disabled={saving} className="flex items-center gap-2">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>

      <div className="p-4 border rounded-lg bg-card shadow-sm space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <GitCommit className="w-5 h-5 text-blue-500" /> Add Workflow Stage
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Stage Title (e.g., Hall Clearance)"
            value={newStepName}
            onChange={(e) => setNewStepName(e.target.value)}
            className="flex-1"
          />
          <Select value={newDept} onValueChange={setNewDept}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LIBRARY">Library</SelectItem>
              <SelectItem value="ACCOUNTS">Accounts</SelectItem>
              <SelectItem value="CSE">CSE Dept</SelectItem>
              <SelectItem value="EEE">EEE Dept</SelectItem>
              <SelectItem value="HALL">Hall / Hostel</SelectItem>
              <SelectItem value="REGISTRAR">Registrar</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAddStep} variant="secondary" className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Stage
          </Button>
        </div>
      </div>

      <div className="border rounded-lg bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Order</TableHead>
              <TableHead>Stage Name</TableHead>
              <TableHead>Assigned Department</TableHead>
              <TableHead>Mandatory</TableHead>
              <TableHead className="text-right">Reorder / Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  Loading workflow configuration...
                </TableCell>
              </TableRow>
            ) : steps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  No workflow steps configured yet.
                </TableCell>
              </TableRow>
            ) : (
              steps.map((step, index) => (
                <TableRow key={step.id}>
                  <TableCell className="font-bold text-center">
                    <Badge variant="outline" className="w-7 h-7 rounded-full flex items-center justify-center p-0">
                      {step.step_order}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">{step.step_name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{step.department}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={step.is_required}
                        onCheckedChange={(checked) => handleToggleRequired(step.id, checked)}
                      />
                      <span className="text-xs text-muted-foreground">
                        {step.is_required ? 'Required' : 'Optional'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={index === 0}
                        onClick={() => handleMoveStep(index, 'up')}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={index === steps.length - 1}
                        onClick={() => handleMoveStep(index, 'down')}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteStep(step.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}