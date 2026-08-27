import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
<<<<<<< HEAD
import { Bell } from "lucide-react";
=======
import { Bell, Check, Trash2 } from "lucide-react";
import { useState } from "react";
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
<<<<<<< HEAD
=======
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c

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
<<<<<<< HEAD
=======
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmAll, setConfirmAll] = useState(false);
  const [confirmSelected, setConfirmSelected] = useState(false);
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c

  const { data } = useQuery({
    enabled: !!user,
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
<<<<<<< HEAD
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

=======
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .is("deleted_at", null)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data;
      } catch {
        return [];
      }
    },
    retry: false,
  });

  const allVisibleIds = data?.map((n) => n.id) ?? [];
  const selectAllChecked = allVisibleIds.length > 0 && allVisibleIds.every((id) => selected.has(id));

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectAllChecked) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allVisibleIds));
    }
  }

>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
  async function markAllRead() {
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

<<<<<<< HEAD
=======
  async function deleteOne(id: string) {
    await supabase.from("notifications").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function deleteSelected() {
    const ids = [...selected];
    if (ids.length === 0) return;
    await supabase.from("notifications").update({ deleted_at: new Date().toISOString() }).in("id", ids);
    setSelected(new Set());
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function deleteAll() {
    await supabase.from("notifications").update({ deleted_at: new Date().toISOString() }).is("deleted_at", null);
    setSelected(new Set());
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
  return (
    <PortalShell className="max-w-3xl">
      <PageHeader
        title="Notifications"
        description="Every clearance decision and remark sent to your account."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }]}
      />
<<<<<<< HEAD
      <div className="mb-6 flex justify-end">
        <Button variant="outline" size="sm" onClick={markAllRead}>
          Mark all read
        </Button>
=======

      <div className="mb-6 flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={markAllRead}>
          Mark all read
        </Button>
        <Button variant="outline" size="sm" onClick={() => setConfirmAll(true)}>
          Delete all
        </Button>
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
      </div>

      <div className="card-surface mt-6 p-6">
        {data && data.length > 0 ? (
<<<<<<< HEAD
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
=======
          <>
            <div className="mb-3 flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSelectAll}
                className={`flex size-5 items-center justify-center rounded border transition-colors ${
                  selectAllChecked
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary"
                }`}
                aria-label="Select all"
              >
                {selectAllChecked && <Check className="size-3" />}
              </button>
              <span className="text-xs text-muted-foreground">
                {selected.size > 0 ? `${selected.size} selected` : `${allVisibleIds.length} notifications`}
              </span>
            </div>

            <ul className="divide-y divide-border">
              {data.map((item) => (
                <li key={item.id} className="py-4">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleSelect(item.id)}
                      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-colors ${
                        selected.has(item.id)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:border-primary"
                      }`}
                      aria-label={`Select notification: ${item.title}`}
                    >
                      {selected.has(item.id) && <Check className="size-3" />}
                    </button>
                    <Bell
                      className={`mt-0.5 size-4 ${item.is_read ? "text-muted-foreground" : "text-primary"}`}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{item.title}</p>
                      {item.body ? (
                        <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => deleteOne(item.id)}
                      aria-label="Delete notification"
                    >
                      <Trash2 className="size-4 text-muted-foreground hover:text-red-500" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>

            {selected.size > 0 && (
              <div className="mt-4 flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmSelected(true)}
                >
                  Delete selected ({selected.size})
                </Button>
              </div>
            )}
          </>
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
        ) : (
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        )}
      </div>
<<<<<<< HEAD
=======

      <AlertDialog open={confirmAll} onOpenChange={setConfirmAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide all notifications from your view. They can still be accessed by the admin for audit purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteAll} className="bg-red-600 hover:bg-red-700 text-white">
              Delete all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmSelected} onOpenChange={setConfirmSelected}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} notification{selected.size === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide the selected notifications from your view. They can still be accessed by the admin for audit purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSelected} className="bg-red-600 hover:bg-red-700 text-white">
              Delete selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
    </PortalShell>
  );
}
