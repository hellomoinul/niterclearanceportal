// import { createFileRoute } from '@tanstack/react-router'

// export const Route = createFileRoute('/_authenticated/admin')({
//   component: RouteComponent,
// })

// function RouteComponent() {
//   return <div>Hello "/_authenticated/admin"!</div>
// }
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/admin')({
  component: AdminLayout,
});

export default function AdminLayout() {
  return (
    <div>
      <Outlet />
    </div>
  );
}