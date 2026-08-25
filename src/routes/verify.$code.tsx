import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, XCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/verify/$code")({
  head: () => ({
    meta: [
      { title: "Certificate verification result — NITER" },
      {
        name: "description",
        content: "Verification result for a NITER final-year clearance certificate code.",
      },
      { property: "og:title", content: "Certificate verification result — NITER" },
      {
        property: "og:description",
        content: "Check whether a NITER clearance certificate code is genuine.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerifyResult,
});

interface VerifyResult {
  verified: boolean;
  reason?: string;
  total?: number;
  approved?: number;
  student_name?: string;
  program?: string;
  batch?: string;
  cleared_at?: string;
  user_code?: string;
}

function VerifyResult() {
  const { code } = Route.useParams();

  const { data: cert, isLoading: certLoading } = useQuery({
    queryKey: ["certificate-lookup", code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificates")
        .select("id, student_code, student_name, program, batch, issued_at")
        .eq("id", code)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: result, isLoading: verifyLoading } = useQuery({
    enabled: !!cert?.student_code,
    queryKey: ["verify-status", cert?.student_code],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("verify_clearance_status", {
        p_user_code: cert!.student_code,
      });
      if (error) throw error;
      return data as unknown as VerifyResult;
    },
  });

  const isLoading = certLoading || (cert && verifyLoading);
  const verified = result?.verified === true;

  return (
    <PortalShell className="max-w-2xl">
      <PageHeader
        title="Certificate verification"
        description={`Checking certificate ID: ${code}`}
        breadcrumbs={[{ label: "Verify", to: "/verify" }]}
      />
      <div className="card-surface mt-4 p-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Checking certificate…</p>
        ) : !cert ? (
          <>
            <XCircle className="size-7 text-status-rejected" aria-hidden />
            <h1 className="mt-3 text-2xl font-semibold">No certificate found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              No NITER clearance certificate matches the ID{" "}
              <span className="font-mono">{code}</span>. Check for typing errors, or contact the
              admin office.
            </p>
          </>
        ) : verified ? (
          <>
            <BadgeCheck className="size-7 text-status-approved" aria-hidden />
            <h1 className="mt-3 text-2xl font-semibold text-status-approved">
              Verified — Clear to sign off from NITER
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This clearance certificate is genuine and all departments have approved.
            </p>
            <dl className="mt-6 divide-y divide-border text-sm">
              {[
                ["Certificate ID", cert.id],
                ["Student name", result.student_name ?? cert.student_name],
                ["Student ID", result.user_code ?? cert.student_code],
                ["Program", result.program ?? cert.program ?? "—"],
                ["Batch", result.batch ?? cert.batch ?? "—"],
                [
                  "Departments approved",
                  result.approved != null && result.total != null
                    ? `${result.approved} / ${result.total}`
                    : "—",
                ],
                [
                  "Issued on",
                  cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : "—",
                ],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-3">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : (
          <>
            <XCircle className="size-7 text-status-rejected" aria-hidden />
            <h1 className="mt-3 text-2xl font-semibold text-status-rejected">
              Not verified — go to{" "}
              <Link to="/" className="underline hover:text-primary">
                NITER clearance portal
              </Link>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This certificate ID exists but the student has not yet received clearance from all
              departments ({result?.approved ?? 0} of {result?.total ?? 8} approved).
            </p>
          </>
        )}
        <Button asChild variant="outline" className="mt-6">
          <Link to="/verify">Check another code</Link>
        </Button>
      </div>
    </PortalShell>
  );
}
