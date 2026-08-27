import { createFileRoute } from "@tanstack/react-router";
<<<<<<< HEAD
import { useQueryClient } from "@tanstack/react-query";
=======
import { useQueryClient, useQuery } from "@tanstack/react-query";
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
<<<<<<< HEAD
import { useAuth } from "@/lib/auth";
=======
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
import { phoneInputHandler } from "@/lib/portal";

>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
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
<<<<<<< HEAD
  const { profile, refresh, user } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [newEmail, setNewEmail] = useState("");
=======
  const { profile, refresh, user, isStudent, isRegistrar, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [program, setProgram] = useState(profile?.program ?? "");
  const [batch, setBatch] = useState(profile?.batch ?? "");

  const { data: registrarDepts } = useQuery({
    enabled: !!user && !isStudent,
    queryKey: ["registrar-departments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registrar_departments")
        .select("departments(name)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? [])
        .map((row) => row.departments?.name)
        .filter(Boolean) as string[];
    },
  });

  const roleLabel = isAdmin ? "Admin" : "Registrar";
  const roleOffice = isAdmin ? "Admin" : registrarDepts?.join(", ") || "Registrar";
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);

<<<<<<< HEAD
    const email = String(form.get("personalEmail") ?? "").trim();

    const { error } = await supabase
      .from("profiles")
      .update({ personal_email: email || null })
=======
    const personalEmail = String(form.get("personalEmail") ?? "").trim();
    const fullName = String(form.get("fullName") ?? "").trim();
    const userCode = String(form.get("userCode") ?? "").trim();

    if (!fullName || !userCode) {
      setBusy(false);
      toast.error(`Name and ${roleLabel} ID are required`);
      return;
    }

    const base = {
      full_name: fullName,
      user_code: userCode,
      phone: str(form.get("phone")) || null,
      personal_email: personalEmail || null,
    };

    const update = isStudent
      ? {
          ...base,
          guardian_name: str(form.get("guardianName")) || null,
          guardian_phone: str(form.get("guardianPhone")) || null,
          registration_no: str(form.get("registrationNo")) || null,
          present_address: str(form.get("presentAddress")) || null,
          permanent_address: str(form.get("permanentAddress")) || null,
          program: program || null,
          batch: batch || null,
        }
      : base;

    const { error } = await supabase
      .from("profiles")
      .update(update)
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
      .eq("id", profile.id);

    setBusy(false);
    if (error) {
<<<<<<< HEAD
      toast.error("Could not update settings", { description: error.message });
=======
      if (error.code === "23505" || /duplicate|unique/i.test(error.message)) {
        toast.error(`${roleLabel} ID already taken`, {
          description: "That ID belongs to another account. Use a different one.",
        });
      } else {
        toast.error("Could not update settings", { description: error.message });
      }
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
      return;
    }

    await refresh();
<<<<<<< HEAD
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
=======
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    await queryClient.invalidateQueries({ queryKey: ["section"] });
    await queryClient.invalidateQueries({ queryKey: ["queue-reviews"] });
    toast.success("Profile updated");
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
  }

  return (
    <PortalShell className="max-w-3xl">
      <PageHeader
        title="Settings"
<<<<<<< HEAD
        description="Manage your notification email and profile details."
=======
        description="Manage your profile details."
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }]}
      />

      <div className="card-surface mt-8 space-y-6 p-6">
        <form onSubmit={handleSubmit}>
          <section>
<<<<<<< HEAD
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
=======
            <h2 className="text-base font-semibold">Profile details</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isStudent
                ? "Keep your information current — it appears on your clearance certificate."
                : "Keep your information current."}
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
                <Label htmlFor="userCode">{roleLabel} ID *</Label>
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
                <Input
                  id="phone"
                  name="phone"
                  placeholder="01XXXXXXXXX"
                  inputMode="numeric"
                  pattern="[0-9]{11}"
                  maxLength={11}
                  onInput={phoneInputHandler}
                  defaultValue={profile?.phone ?? ""}
                />
              </div>

              {isStudent ? (
                <>
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
                      inputMode="numeric"
                      pattern="[0-9]{11}"
                      maxLength={11}
                      onInput={phoneInputHandler}
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
                </>
              ) : (
                <div className="space-y-2">
                  <Label>Role / Office</Label>
                  <Input value={roleOffice} readOnly className="bg-muted" />
                </div>
              )}
            </div>
            <Button type="submit" size="sm" disabled={busy} className="mt-4">
              {busy ? "Saving…" : "Save profile"}
            </Button>
          </section>
        </form>
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
      </div>
    </PortalShell>
  );
}
<<<<<<< HEAD
=======

function str(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
