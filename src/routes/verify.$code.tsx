import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, XCircle } from "lucide-react";
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

function VerifyResult() {
  const { code } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["certificate", code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .eq("certificate_code", code)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <PortalShell className="max-w-2xl">
      <PageHeader
        title="Certificate verification"
        description={`Checking certificate code: ${code}`}
        breadcrumbs={[{ label: "Verify", to: "/verify" }]}
      />
      <div className="card-surface mt-4 p-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Checking certificate…</p>
        ) : data ? (
          <>
            <BadgeCheck className="size-7 text-status-approved" aria-hidden />
            <h1 className="mt-3 text-2xl font-semibold">Valid certificate</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This clearance certificate was issued by NITER and is genuine.
            </p>
            <dl className="mt-6 divide-y divide-border text-sm">
              {[
                ["Certificate code", data.certificate_code],
                ["Student name", data.student_name],
                ["Student ID", data.student_code],
                ["Program", data.program ?? "—"],
                ["Batch", data.batch ?? "—"],
                ["Issued on", new Date(data.issued_at).toLocaleDateString()],
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
            <h1 className="mt-3 text-2xl font-semibold">No certificate found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              No NITER clearance certificate matches the code{" "}
              <span className="font-mono">{code}</span>. Check for typing errors, or contact the
              admin office.
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
