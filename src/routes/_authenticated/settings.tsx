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
  const { profile, refresh, user } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [newEmail, setNewEmail] = useState("");

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

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim() || !profile) return;
    setEmailBusy(true);

    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });

    setEmailBusy(false);
    if (error) {
      toast.error("Could not update email", { description: error.message });
      return;
    }

    // Optimistically update personal_email so smart login resolves immediately
    await supabase
      .from("profiles")
      .update({ personal_email: newEmail.trim() })
      .eq("id", profile.id);

    toast.success("Confirmation link sent", {
      description: `Check ${newEmail.trim()} to confirm the change.`,
    });
    setNewEmail("");
    await refresh();
  }

  return (
    <PortalShell className="max-w-3xl">
      <PageHeader
        title="Settings"
        description="Manage your notification email and profile details."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }]}
      />

      <div className="card-surface mt-8 space-y-6 p-6">
        <form onSubmit={handleSubmit}>
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
            <Button type="submit" size="sm" disabled={busy} className="mt-4">
              {busy ? "Saving…" : "Save notification email"}
            </Button>
          </section>
        </form>

        <section>
          <h2 className="text-base font-semibold">Recovery email</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Used for password resets. You'll receive a confirmation link before the change takes effect.
          </p>
          <div className="mt-4 max-w-md space-y-2">
            <Label>Current email</Label>
            <Input value={user?.email ?? ""} readOnly className="bg-muted" />
            <Label htmlFor="newEmail">New recovery email</Label>
            <form className="flex gap-2" onSubmit={handleEmailChange}>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="you@niter.edu.bd"
                required
                className="flex-1"
              />
              <Button type="submit" size="sm" disabled={emailBusy}>
                {emailBusy ? "Sending…" : "Update"}
              </Button>
            </form>
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
      </div>
    </PortalShell>
  );
}
