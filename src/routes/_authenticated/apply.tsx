import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";

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
  const [naCodes, setNaCodes] = useState<Set<string>>(new Set());

  // Departments a student may declare N/A. Accounts (tuition) and Head (final sign-off)
  // are always required and are excluded from the list by design.
  const { data: allDepartments } = useQuery({
    queryKey: ["apply-departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("code, name, requirement")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
  const naEligible = (allDepartments ?? []).filter(
    (d) => d.code !== "accounts" && d.code !== "head",
  );

  function toggleNa(code: string, checked: boolean) {
    setNaCodes((prev) => {
      const next = new Set(prev);
      if (checked) next.add(code);
      else next.delete(code);
      return next;
    });
  }

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

    if (error || !data) {
      setBusy(false);
      toast.error("Could not submit application", { description: error?.message });
      return;
    }

    // Auto-approve departments the student declared not applicable.
    // Runs after the fan-out trigger has created all review rows; the RPC enforces
    // ownership and refuses accounts/head or reviews that already have documents.
    let naCount = 0;
    let naFailed = false;
    if (naCodes.size > 0) {
      const { data: updated, error: naError } = await supabase.rpc("declare_departments_na", {
        p_application_id: data.id,
        p_department_codes: [...naCodes],
      });
      if (naError) naFailed = true;
      else naCount = typeof updated === "number" ? updated : 0;
    }

    setBusy(false);
    await queryClient.invalidateQueries();
    if (naFailed) {
      toast.warning("Application submitted", {
        description:
          "Some not-applicable declarations could not be saved — ask the registrar office to mark them manually.",
      });
    } else {
      toast.success("Application submitted", {
        description:
          naCount > 0
            ? `${naCount} department${naCount === 1 ? "" : "s"} marked not applicable. All offices can review in parallel.`
            : "All offices have been notified and can review in parallel.",
      });
    }
    navigate({ to: "/dashboard" });
  }

  return (
    <PortalShell className="max-w-3xl">
      <PageHeader
        title="Clearance application"
        description="Confirm your details below. Once submitted, each office will request its own document in your dashboard."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }]}
      />

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
              <Input
                id="registrationNo"
                name="registrationNo"
                defaultValue={profile?.registration_no ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="personalEmail">Personal email</Label>
              <Input
                id="personalEmail"
                name="personalEmail"
                type="email"
                defaultValue={profile?.personal_email ?? ""}
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold">Guardian and address</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                defaultValue={profile?.guardian_phone ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="presentAddress">Present address</Label>
              <Textarea
                id="presentAddress"
                name="presentAddress"
                defaultValue={profile?.present_address ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="permanentAddress">Permanent address</Label>
              <Textarea
                id="permanentAddress"
                name="permanentAddress"
                defaultValue={profile?.permanent_address ?? ""}
              />
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
              <Input
                id="expectedGraduation"
                name="expectedGraduation"
                placeholder="December 2025"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold">Departments not applicable to you</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Check a department only if it genuinely does not apply to you — for example, you never
            stayed in the hostel or never borrowed a library book. Checked offices are marked
            &ldquo;Not applicable&rdquo; and reported to the admin office for verification. Accounts
            and Department Head always apply to every student.
          </p>
          <ul className="mt-4 divide-y divide-border rounded-md border border-border">
            {(naEligible ?? []).map((dept) => (
              <li key={dept.code} className="flex items-start gap-3 px-3 py-2.5">
                <Checkbox
                  id={`na-${dept.code}`}
                  className="mt-0.5"
                  checked={naCodes.has(dept.code)}
                  onCheckedChange={(checked) => toggleNa(dept.code, checked === true)}
                />
                <Label htmlFor={`na-${dept.code}`} className="cursor-pointer">
                  <span className="block text-sm font-medium">
                    I have no record at {dept.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">{dept.requirement}</span>
                </Label>
              </li>
            ))}
          </ul>
        </section>

        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Submitting…" : "Submit application"}
        </Button>
      </form>
    </PortalShell>
  );
}
