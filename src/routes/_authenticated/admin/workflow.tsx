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
          per program and set batch clearance deadlines.
        </p>
      </div>
    </div>
  );
}
