import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ToOptions } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, CheckCircle2, Clock, History, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type RoutePath = NonNullable<ToOptions["to"]>;

interface AuditEntry {
  id: string;
  action: string;
  created_at: string;
  actor_name: string | null;
}

interface AttentionData {
  escalated: { count: number; oldest: string | null };
  pendingNa: { count: number; pending: number };
  oldestReview: { count: number; oldest: string | null };
  audits: AuditEntry[];
}

function daysSince(iso: string | null): string | null {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days <= 0 ? "today" : days === 1 ? "1 day" : `${days} days`;
}

export function NeedsAttentionPanel() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-needs-attention"],
    queryFn: async (): Promise<AttentionData> => {
      const [escalations, naReviews, inReview, audits] = await Promise.all([
        // Open escalations: count plus how long the oldest one has been waiting.
        supabase
          .from("department_reviews")
          .select("created_at", { count: "exact" })
          .eq("escalated", true)
          .order("created_at", { ascending: true })
          .limit(1),
        // N/A declarations still awaiting verification (application not yet cleared).
        supabase.from("department_reviews").select("id", { count: "exact" }).eq("is_na", true),
        // Oldest application still sitting in review.
        supabase
          .from("clearance_applications")
          .select("submitted_at", { count: "exact" })
          .eq("status", "in_review")
          .order("submitted_at", { ascending: true })
          .limit(1),
        supabase
          .from("audit_log")
          .select("id, action, created_at, actor_name")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      return {
        escalated: {
          count: escalations.count ?? 0,
          oldest: escalations.data?.[0]?.created_at ?? null,
        },
        pendingNa: { count: naReviews.count ?? 0, pending: naReviews.count ?? 0 },
        oldestReview: {
          count: inReview.count ?? 0,
          oldest: inReview.data?.[0]?.submitted_at ?? null,
        },
        audits: (audits.data ?? []) as AuditEntry[],
      };
    },
    refetchInterval: 30_000,
  });

  const escalatedAge = daysSince(data?.escalated.oldest ?? null);
  const reviewAge = daysSince(data?.oldestReview.oldest ?? null);
  const hasWork =
    (data?.escalated.count ?? 0) > 0 ||
    (data?.pendingNa.count ?? 0) > 0 ||
    (data?.oldestReview.count ?? 0) > 0;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            <CardTitle className="text-lg font-bold">Needs Attention</CardTitle>
          </div>
          <Badge
            variant="outline"
            className="border-amber-500/50 text-amber-700 dark:text-amber-400"
          >
            S-v3.2
          </Badge>
        </div>
        <CardDescription>
          Operational items that require administrative review or action.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : isError ? (
          <p className="py-6 text-center text-sm text-destructive">
            Could not load operational summary. Refresh to try again.
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <AttentionTile
                icon={<ShieldAlert className="h-4 w-4" />}
                tone={data?.escalated.count ? "destructive" : "muted"}
                label="Escalated Cases"
                count={data?.escalated.count ?? 0}
                detail={
                  data?.escalated.count
                    ? `Oldest waiting ${escalatedAge ?? "unknown"}`
                    : "None open"
                }
                to="/admin/escalations"
                cta="Review"
              />
              <AttentionTile
                icon={<AlertCircle className="h-4 w-4" />}
                tone={data?.pendingNa.count ? "warning" : "muted"}
                label="Pending N/A Declarations"
                count={data?.pendingNa.count ?? 0}
                detail={data?.pendingNa.count ? "Awaiting verification" : "None pending"}
                href="#na-declarations"
                cta="View table"
              />
              <AttentionTile
                icon={<Clock className="h-4 w-4" />}
                tone={data?.oldestReview.count ? "warning" : "muted"}
                label="Oldest Pending Review"
                count={data?.oldestReview.count ?? 0}
                detail={
                  data?.oldestReview.count
                    ? `Submitted ${reviewAge ?? "unknown"} ago`
                    : "Nothing in review"
                }
                to="/queue"
                cta="Open queue"
              />
            </div>

            <div className="rounded-lg border bg-card p-3.5 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <History className="h-4 w-4 text-blue-500" />
                  Recent Activity
                </span>
                <Link
                  to="/admin/audit"
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  Full audit log <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {data?.audits.length ? (
                <div className="space-y-1.5">
                  {data.audits.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between gap-3 text-xs text-muted-foreground"
                    >
                      <span className="truncate max-w-[60%] font-medium text-foreground">
                        {entry.action}
                      </span>
                      <span className="shrink-0">
                        {new Date(entry.created_at).toLocaleString("en-GB", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No recent activity.</p>
              )}
            </div>

            {!hasWork && (data?.audits.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-500" />
                <p className="text-sm font-medium text-foreground">All clear</p>
                <p className="text-xs text-muted-foreground">
                  No escalations, N/A declarations or pending reviews require action.
                </p>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

type TileTone = "destructive" | "warning" | "muted";

const toneClasses: Record<TileTone, string> = {
  destructive: "bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900",
  warning: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900",
  muted: "bg-card",
};

function AttentionTile({
  icon,
  tone,
  label,
  count,
  detail,
  to,
  href,
  cta,
}: {
  icon: React.ReactNode;
  tone: TileTone;
  label: string;
  count: number;
  detail: string;
  to?: RoutePath;
  href?: string;
  cta: string;
}) {
  const inner = (
    <>
      {cta} <ArrowRight className="h-3 w-3" />
    </>
  );
  const linkClass =
    "mt-4 flex items-center gap-1 text-xs font-semibold text-primary hover:underline";

  return (
    <div
      className={`flex flex-col justify-between rounded-lg border p-4 shadow-sm transition-colors ${toneClasses[tone]}`}
    >
      <div>
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          {icon}
          {label}
        </span>
        <p className="mt-2 text-2xl font-bold">{count}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </div>
      {to ? (
        <Link to={to} className={linkClass}>
          {inner}
        </Link>
      ) : (
        <a href={href} className={linkClass}>
          {inner}
        </a>
      )}
    </div>
  );
}
