import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/admin/workflow')({
  component: WorkflowStub,
});

function WorkflowStub() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Workflow Configuration</h2>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-sm text-yellow-800">
          <strong>Coming soon.</strong> This page will allow admins to configure departments
<<<<<<< HEAD
          per program and set batch clearance deadlines.
=======
          per program and set academic year clearance deadlines.
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
        </p>
      </div>
    </div>
  );
}
