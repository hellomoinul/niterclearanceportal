import { createFileRoute, redirect, Link, Outlet } from '@tanstack/react-router'
import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/admin')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw redirect({ to: '/auth' })
    }
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .maybeSingle()
    if (!data) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: AdminLayout,
})

const adminLinks: { to: string; label: string; exact?: boolean }[] = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/workflow", label: "Workflow" },
  { to: "/admin/notices", label: "Notices" },
  { to: "/admin/audit", label: "Audit Log" },
  { to: "/admin/reports", label: "Reports" },
  { to: "/admin/users", label: "Users" },
]

function AdminLayout() {
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
        {adminLinks.map((link) => (
          <Link
            key={link.label}
            to={link.to}
            activeOptions={{ exact: !!link.exact }}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors",
              "hover:bg-secondary hover:text-foreground",
              "data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
