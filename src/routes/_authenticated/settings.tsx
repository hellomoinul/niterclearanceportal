import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_authenticated/settings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Settings — NITER" },
      { name: "description", content: "Update your profile settings." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, refresh } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);

    const email = String(form.get("personalEmail") ?? "").trim();

    const { error } = await supabase
      .from("profiles")
      .update({ personal_email: email || null })
      .eq("id", profile.id);

    setBusy(false);
    if (error) {
      toast.error("Could not update settings", { description: error.message });
      return;
    }

    await refresh();
    await queryClient.invalidateQueries();
    toast.success("Settings updated", {
      description: email ? `Notifications will be sent to ${email}` : "Email removed",
    });
  }

  return (
    <PortalShell className="max-w-3xl">
      <PageHeader
        title="Settings"
        description="Manage your notification email and profile details."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }]}
      />

      <form className="card-surface mt-8 space-y-6 p-6" onSubmit={handleSubmit}>
        <section>
          <h2 className="text-base font-semibold">Notification email</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You'll receive email notifications for clearance events related to your role.
          </p>
          <div className="mt-4 max-w-md space-y-2">
            <Label htmlFor="personalEmail">Personal email</Label>
            <Input
              id="personalEmail"
              name="personalEmail"
              type="email"
              defaultValue={profile?.personal_email ?? ""}
              placeholder="you@example.com"
            />
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold">Account info</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={profile?.full_name ?? ""} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>User code</Label>
              <Input value={profile?.user_code ?? ""} readOnly className="bg-muted" />
            </div>
          </div>
        </section>

        <Button type="submit" size="sm" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </PortalShell>
  );
}
