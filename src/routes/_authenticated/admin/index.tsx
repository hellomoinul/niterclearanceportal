import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/admin/')({
  component: AdminDashboard,
});

export default function AdminDashboard() {
  const modules = [
    {
      title: 'User Role Management',
      description: 'Update user roles and permission levels',
      path: '/admin/users',
      badge: 'users',
    },
    {
      title: 'Workflow & Deadline Config',
      description: 'Configure clearance stages and set deadlines',
      path: '/admin/workflow',
      badge: 'workflow',
    },
    {
      title: 'Batch Clearance Reports',
      description: 'View clearance progress and department charts',
      path: '/admin/reports',
      badge: 'reports',
    },
    {
      title: 'Notice Board Management',
      description: 'Publish, view, and delete system notices',
      path: '/admin/notices',
      badge: 'notices',
    },
    {
      title: 'System Audit Log Viewer',
      description: 'Track user activity and approval histories',
      path: '/admin/audit',
      badge: 'audit',
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Admin Control Panel</h1>
      <p className="text-gray-600 mb-8">
        Select a module below to manage clearance operations and system settings.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((item) => (
          <a
            key={item.path}
            href={item.path}
            className="block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-500 transition-all cursor-pointer"
          >
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">
              {item.badge}
            </span>
            <h3 className="text-xl font-bold mt-3 mb-2">{item.title}</h3>
            <p className="text-sm text-gray-600">{item.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
}