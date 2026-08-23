import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — NITER Clearance Portal" },
      { name: "description", content: "Every clearance decision and remark sent to your account." },
      { property: "og:title", content: "Notifications — NITER Clearance Portal" },
      { property: "og:description", content: "Clearance updates from each NITER office." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    enabled: !!user,
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function markAllRead() {
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <PortalShell className="max-w-3xl">
      <PageHeader
        title="Notifications"
        description="Every clearance decision and remark sent to your account."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }]}
      />
      <div className="mb-6 flex justify-end">
        <Button variant="outline" size="sm" onClick={markAllRead}>
          Mark all read
        </Button>
      </div>

      <div className="card-surface mt-6 p-6">
        {data && data.length > 0 ? (
          <ul className="divide-y divide-border">
            {data.map((item) => (
              <li key={item.id} className="py-4">
                <div className="flex items-start gap-3">
                  <Bell
                    className={`mt-0.5 size-4 ${item.is_read ? "text-muted-foreground" : "text-primary"}`}
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    {item.body ? (
                      <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        )}
      </div>
    </PortalShell>
  );
}
