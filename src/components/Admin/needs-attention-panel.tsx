import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AlertCircle, Clock, ShieldAlert, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface AttentionItem {
  id: string;
  title: string;
  description: string;
  type: "escalation" | "pending_clearance" | "dispute";
  severity: "high" | "medium" | "low";
  link: string;
  count: number;
}

export function NeedsAttentionPanel() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-needs-attention"],
    queryFn: async () => {
      // Fetch open escalations count
      const { count: escalationsCount } = await supabase
        .from("escalations" as any)
        .select("id", { count: "exact", head: true })
        .eq("status", "open");

      // Fetch pending clearances older than 3 days
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const { count: delayedClearancesCount } = await supabase
        .from("clearance_requests" as any)
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .lt("created_at", threeDaysAgo);

      const list: AttentionItem[] = [];

      if (escalationsCount && escalationsCount > 0) {
        list.push({
          id: "open-escalations",
          title: "Unresolved Escalations",
          description: `${escalationsCount} escalation cases require immediate admin intervention.`,
          type: "escalation",
          severity: "high",
          link: "/admin/escalations",
          count: escalationsCount,
        });
      }

      if (delayedClearancesCount && delayedClearancesCount > 0) {
        list.push({
          id: "delayed-clearances",
          title: "Delayed Clearance Requests",
          description: `${delayedClearancesCount} requests pending for more than 3 days.`,
          type: "pending_clearance",
          severity: "medium",
          link: "/admin/clearances",
          count: delayedClearancesCount,
        });
      }

      return list;
    },
    refetchInterval: 15_000,
  });

  return (
    <Card className="border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            <CardTitle className="text-lg font-bold">Needs Attention</CardTitle>
          </div>
          <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-400">
            Live Action Required
          </Badge>
        </div>
        <CardDescription>
          Critical operational items that require administrative review or action.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
            <p className="text-sm font-medium text-foreground">All clear!</p>
            <p className="text-xs">No urgent operational issues require attention right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border bg-card p-3.5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  {item.type === "escalation" ? (
                    <ShieldAlert className="mt-0.5 h-5 w-5 text-destructive shrink-0" />
                  ) : (
                    <Clock className="mt-0.5 h-5 w-5 text-amber-500 shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <Badge
                        variant={item.severity === "high" ? "destructive" : "secondary"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {item.count} Pending
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                </div>

                <Button asChild size="sm" variant="ghost" className="gap-1 text-xs">
                  <Link to={item.link}>
                    Resolve <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}