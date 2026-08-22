import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/apply")({
  head: () => ({
    meta: [
      { title: "Start a clearance application — NITER" },
      {
        name: "description",
        content:
          "Submit your NITER final-year clearance application once and every office receives it for parallel review.",
      },
      { property: "og:title", content: "Start a clearance application — NITER" },
      {
        property: "og:description",
        content: "One form, sent to every clearance office at the same time.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ApplyPage,
});

function ApplyPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);

    await supabase
      .from("profiles")
      .update({
        guardian_name: String(form.get("guardianName") ?? ""),
        guardian_phone: String(form.get("guardianPhone") ?? ""),
        present_address: String(form.get("presentAddress") ?? ""),
        permanent_address: String(form.get("permanentAddress") ?? ""),
        registration_no: String(form.get("registrationNo") ?? ""),
        personal_email: String(form.get("personalEmail") ?? ""),
      })
      .eq("id", user.id);

    const { data, error } = await supabase
      .from("clearance_applications")
      .insert({
        student_id: user.id,
        thesis_title: String(form.get("thesisTitle") ?? ""),
        supervisor_name: String(form.get("supervisorName") ?? ""),
        expected_graduation: String(form.get("expectedGraduation") ?? ""),
      })
      .select("id")
      .single();

    setBusy(false);
    if (error || !data) {
      toast.error("Could not submit application", { description: error?.message });
      return;
    }
    await queryClient.invalidateQueries();
    toast.success("Application submitted", {
      description: "All offices have been notified and can review in parallel.",
    });
    navigate({ to: "/dashboard" });
  }

  return (
    <PortalShell className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Clearance application</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Confirm your details below. Once submitted, each office will request its own document in your
        dashboard.
      </p>

      <form className="card-surface mt-8 space-y-8 p-6" onSubmit={handleSubmit}>
        <section>
          <h2 className="text-base font-semibold">Student details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={profile?.full_name ?? ""} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Student ID</Label>
              <Input value={profile?.user_code ?? ""} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationNo">Registration number</Label>
              <Input id="registrationNo" name="registrationNo" defaultValue={profile?.registration_no ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="personalEmail">Personal email</Label>
              <Input id="personalEmail" name="personalEmail" type="email" defaultValue={profile?.personal_email ?? ""} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold">Guardian and address</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="guardianName">Guardian name</Label>
              <Input id="guardianName" name="guardianName" defaultValue={profile?.guardian_name ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guardianPhone">Guardian phone</Label>
              <Input id="guardianPhone" name="guardianPhone" defaultValue={profile?.guardian_phone ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="presentAddress">Present address</Label>
              <Textarea id="presentAddress" name="presentAddress" defaultValue={profile?.present_address ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="permanentAddress">Permanent address</Label>
              <Textarea id="permanentAddress" name="permanentAddress" defaultValue={profile?.permanent_address ?? ""} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold">Academic closing details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="thesisTitle">Thesis / project title</Label>
              <Input id="thesisTitle" name="thesisTitle" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supervisorName">Supervisor name</Label>
              <Input id="supervisorName" name="supervisorName" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedGraduation">Expected graduation</Label>
              <Input id="expectedGraduation" name="expectedGraduation" placeholder="December 2025" />
            </div>
          </div>
        </section>

        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Submitting…" : "Submit application"}
        </Button>
      </form>
    </PortalShell>
  );
}
