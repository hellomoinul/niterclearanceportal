import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/admin/users')({
  component: UsersStub,
});

function UsersStub() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">User Management</h2>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-sm text-yellow-800">
          <strong>Coming soon.</strong> This page will allow admins to create staff/registrar
          accounts, assign roles, and link department offices. Currently contains a
          placeholder workflow config form — needs full rebuild.
        </p>
      </div>
    </div>
  );
}
