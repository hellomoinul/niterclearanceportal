import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/admin/audit')({
  component: AuditStub,
});

function AuditStub() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Audit Log</h2>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-sm text-yellow-800">
          <strong>Coming soon.</strong> This page will display a read-only table of the
          <code>audit_log</code> showing all approval, rejection, and status change events.
          Currently queries wrong columns — needs rebuild.
        </p>
      </div>
    </div>
  );
}
