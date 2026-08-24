import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { DEPARTMENTS, academicYears } from "@/lib/departments";
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
  const [program, setProgram] = useState(profile?.program ?? "");
  const [batch, setBatch] = useState(profile?.batch ?? "");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);

    const personalEmail = String(form.get("personalEmail") ?? "").trim();
    const fullName = String(form.get("fullName") ?? "").trim();
    const userCode = String(form.get("userCode") ?? "").trim();

    if (!fullName || !userCode) {
      setBusy(false);
      toast.error("Name and Student ID are required");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        user_code: userCode,
        phone: str(form.get("phone")) || null,
        guardian_name: str(form.get("guardianName")) || null,
        guardian_phone: str(form.get("guardianPhone")) || null,
        registration_no: str(form.get("registrationNo")) || null,
        present_address: str(form.get("presentAddress")) || null,
        permanent_address: str(form.get("permanentAddress")) || null,
        program: program || null,
        batch: batch || null,
        personal_email: personalEmail || null,
      })
      .eq("id", profile.id);

    setBusy(false);
    if (error) {
      if (error.code === "23505" || /duplicate|unique/i.test(error.message)) {
        toast.error("Student ID already taken", {
          description: "That ID belongs to another account. Use a different one.",
        });
      } else {
        toast.error("Could not update settings", { description: error.message });
      }
      return;
    }

    await refresh();
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    await queryClient.invalidateQueries({ queryKey: ["section"] });
    await queryClient.invalidateQueries({ queryKey: ["queue-reviews"] });
    toast.success("Profile updated");
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
        description="Manage your profile details and emails."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }]}
      />

      <div className="card-surface mt-8 space-y-6 p-6">
        <form onSubmit={handleSubmit}>
          <section>
            <h2 className="text-base font-semibold">Profile details</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Keep your information current — it appears on your clearance certificate.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  required
                  defaultValue={profile?.full_name ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userCode">Student ID *</Label>
                <Input id="userCode" name="userCode" required defaultValue={profile?.user_code ?? ""} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="personalEmail">Personal email</Label>
                <Input
                  id="personalEmail"
                  name="personalEmail"
                  type="email"
                  defaultValue={profile?.personal_email ?? ""}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" placeholder="01XXXXXXXXX" defaultValue={profile?.phone ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationNo">Registration no</Label>
                <Input
                  id="registrationNo"
                  name="registrationNo"
                  defaultValue={profile?.registration_no ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Program</Label>
                <Select name="program" value={program} onValueChange={setProgram}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Academic year</Label>
                <Select name="batch" value={batch} onValueChange={setBatch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears().map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardianName">Guardian name</Label>
                <Input
                  id="guardianName"
                  name="guardianName"
                  defaultValue={profile?.guardian_name ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardianPhone">Guardian phone</Label>
                <Input
                  id="guardianPhone"
                  name="guardianPhone"
                  placeholder="01XXXXXXXXX"
                  defaultValue={profile?.guardian_phone ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="presentAddress">Present address</Label>
                <Textarea
                  id="presentAddress"
                  name="presentAddress"
                  rows={2}
                  defaultValue={profile?.present_address ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="permanentAddress">Permanent address</Label>
                <Textarea
                  id="permanentAddress"
                  name="permanentAddress"
                  rows={2}
                  defaultValue={profile?.permanent_address ?? ""}
                />
              </div>
            </div>
            <Button type="submit" size="sm" disabled={busy} className="mt-4">
              {busy ? "Saving…" : "Save profile"}
            </Button>
          </section>
        </form>

        <section className="border-t border-border pt-6">
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
      </div>
    </PortalShell>
  );
}

function str(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}
