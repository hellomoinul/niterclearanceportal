import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/admin/notices')({
  component: NoticesStub,
});

function NoticesStub() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Notices Management</h2>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-sm text-yellow-800">
          <strong>Coming soon.</strong> This page will allow admins to create and manage
          notices shown on the public home page. The <code>notices</code> database table
          has not been created yet.
        </p>
      </div>
    </div>
  );
}
