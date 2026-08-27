import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowRight, FileCheck2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/portal-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My clearance dashboard — NITER" },
      {
        name: "description",
        content:
          "Track each department's clearance decision, upload documents and download your certificate.",
      },
      { property: "og:title", content: "My clearance dashboard — NITER" },
      {
        property: "og:description",
        content: "Your live NITER clearance status across every office.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, profile, isRegistrar, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const { data: application, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["application", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clearance_applications")
        .select("*")
        .eq("student_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: reviews } = useQuery({
    enabled: !!application?.id,
    queryKey: ["reviews", application?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("department_reviews")
        .select("*, departments(code, name, requirement, sort_order, is_final_signoff)")
        .eq("application_id", application!.id);
      if (error) throw error;
      return (data ?? []).sort(
        (a, b) => (a.departments?.sort_order ?? 0) - (b.departments?.sort_order ?? 0),
      );
    },
  });

  const { data: certificate } = useQuery({
    enabled: !!application?.id,
    queryKey: ["my-certificate", application?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificates")
        .select("id")
        .eq("application_id", application!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!loading && (isRegistrar || isAdmin)) {
      navigate({ to: "/queue", replace: true });
    }
  }, [loading, isRegistrar, isAdmin, navigate]);

  const approved = (reviews ?? []).filter((r) => r.status === "approved").length;
  const total = reviews?.length ?? 0;
  const percent = total ? Math.round((approved / total) * 100) : 0;

  return (
    <PortalShell>
      <PageHeader
        title={profile?.full_name ? `Hello, ${profile.full_name.split(" ")[0]}` : "My clearance"}
        description={
          profile?.user_code
            ? `${profile.user_code}${profile?.program ? ` · ${profile.program}` : ""}${profile?.batch ? ` · Batch ${profile.batch}` : ""}`
            : "Student"
        }
      />
      <div className="flex flex-wrap items-center justify-end gap-3">
        {approved === total && total > 0 ? (
          <Button asChild variant="default">
            <Link to="/certificate">View Certificate</Link>
          </Button>
        ) : (
          <Button disabled variant="default">
            View Certificate
          </Button>
        )}
        {(isRegistrar || isAdmin) && (
          <Button asChild variant="outline">
            <Link to="/queue">Go to department queue</Link>
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading your application…</p>
      ) : !application ? (
        <div className="card-surface mt-8 p-8 text-center">
          <FileCheck2 className="mx-auto size-7 text-primary" aria-hidden />
          <h2 className="mt-3 text-lg font-semibold">No clearance application yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Submit one application and every office receives it at the same time.
          </p>
          <Button asChild className="mt-6">
            <Link to="/apply">
              Start my application <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="card-surface mt-8 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Overall progress</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {approved} of {total} offices approved
                </p>
              </div>
              {certificate ? (
                <Button asChild>
                  <a href="/certificate">Download certificate</a>
                </Button>
              ) : (
                <StatusBadge status={application.status === "cleared" ? "approved" : "pending"} />
              )}
            </div>
            <Progress value={percent} className="mt-4" />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {(reviews ?? []).map((review) => (
              <Link
                key={review.id}
                to="/section/$code"
                params={{ code: review.departments?.code ?? "" }}
                className="card-surface block p-5 transition-shadow hover:shadow-raised"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">{review.departments?.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {review.departments?.is_final_signoff
                        ? "Final sign-off — no document required."
                        : `Office verifies: ${review.departments?.requirement?.toLowerCase().replace(/\.$/, "")} or not.`}
                    </p>
                  </div>
                  {review.departments?.is_final_signoff &&
                  review.status === "pending" &&
                  !review.triggered ? (
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                      Waiting for 7/8 approval
                    </span>
                  ) : (
                    <StatusBadge status={review.is_na ? "na" : review.status} />
                  )}
                </div>
                {review.remarks ? (
                  <p className="mt-3 rounded-md bg-secondary px-3 py-2 text-sm">{review.remarks}</p>
                ) : null}
                {review.escalated ? (
                  <p className="mt-3 text-sm font-medium text-status-rejected">
                    Escalated to Department Head
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        </>
      )}
    </PortalShell>
  );
}