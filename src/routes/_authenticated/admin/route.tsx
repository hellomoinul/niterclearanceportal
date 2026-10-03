import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { supabase } from '@/integrations/supabase/client'
import { AdminSidebar } from '@/components/portal-shell'

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

function AdminLayout() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1">
      <AdminSidebar />
      <main className="flex-1 px-6 py-8 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  )
}
