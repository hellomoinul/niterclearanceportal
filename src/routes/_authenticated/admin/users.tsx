import { createFileRoute } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';

export const Route = createFileRoute('/_authenticated/admin/users')({
  component: workflowconfig,
});

function workflowconfig() {
  const [deadline, setdeadline] = useState('');
  const [batch, setbatch] = useState('');

  const workflowsteps = [
    'register',
    'department-head',
    'library',
    'lab',
    'director'
  ];

  const saveconfig = async (e: FormEvent) => {
    e.preventDefault();
    console.log("saving configuration:", { batch, deadline, workflowsteps });
    alert('workflow configured successfully!');
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">workflow & deadlines</h2>
      
      <div className="flex flex-col md:flex-row gap-8">

        <form onSubmit={saveconfig} className="space-y-4 flex-1">
          <div className="bg-white p-4 rounded shadow-sm border">
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">setup deadline</h3>
            <div className="mb-4">
              <label className="block font-medium mb-1">batch number</label>
              <input 
                type="text" 
                placeholder="e.g., batch 14"
                className="border p-2 w-full rounded" 
                value={batch} 
                onChange={(e) => setbatch(e.target.value)} 
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1">clearance deadline</label>
              <input 
                type="date" 
                className="border p-2 w-full rounded" 
                value={deadline} 
                onChange={(e) => setdeadline(e.target.value)} 
                required
              />
            </div>
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full">
            save configuration
          </button>
        </form>
        
        <div className="flex-1 bg-gray-50 p-4 rounded border">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">clearance serial</h3>
          <ul className="space-y-3">
            {workflowsteps.map((step, index) => (
              <li key={index} className="flex items-center gap-3 bg-white p-3 rounded shadow-sm border border-gray-200">
                <span className="bg-blue-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
                <span className="capitalize font-medium text-gray-700">
                  {step.replace('-', ' ')}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-gray-500 mt-4">
            * students must complete their clearance exactly in this order.
          </p>
        </div>

      </div>
    </div>
  );
}