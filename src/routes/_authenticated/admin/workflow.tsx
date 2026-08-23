import { createFileRoute } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'

export const Route = createFileRoute('/_authenticated/admin/workflow')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/admin/workflow"!</div>
}

export default function WorkflowConfig() {
  const [deadline, setDeadline] = useState('');
  const [batch, setBatch] = useState('');

  const saveBatchConfig = (e: FormEvent) => {
    e.preventDefault();
    localStorage.setItem(
      `batch_config_${batch}`,
      JSON.stringify({ batch_id: batch, deadline }),
    );
    alert('Workflow updated!');
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Workflow & Deadlines</h2>
      <form onSubmit={saveBatchConfig} className="space-y-4 max-w-md">
        <div>
          <label className="block font-medium">Batch Number</label>
          <input 
            type="text" 
            className="border p-2 w-full rounded" 
            value={batch} 
            onChange={(e) => setBatch(e.target.value)} 
          />
        </div>
        <div>
          <label className="block font-medium">Clearance Deadline</label>
          <input 
            type="date" 
            className="border p-2 w-full rounded" 
            value={deadline} 
            onChange={(e) => setDeadline(e.target.value)} 
          />
        </div>
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
          Save Configuration
        </button>
      </form>
    </div>
  );
}