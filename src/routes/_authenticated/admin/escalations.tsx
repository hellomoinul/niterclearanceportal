import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ShieldAlert, CheckCircle2, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/escalations")({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
  },
  component: EscalationsPage,
});

interface EscalatedItem {
  reviewId: string;
  appId: string;
  studentName: string;
  userCode: string;
  program: string | null;
  deptName: string;
  escalatedAt: string;
  escalatedBy: string;
  attempts: number;
  status: string;
}

export function EscalationsPage() {
  const [items, setItems] = useState<EscalatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionNotes, setActionNotes] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadEscalations();
  }, []);

  async function loadEscalations() {
    setLoading(true);
    const { data, error } = await supabase
      .from("department_reviews")
      .select(
        `
        id,
        application_id,
        status,
        created_at,
        attempts,
        remarks,
        departments(name),
        clearance_applications(
          profiles(full_name, user_code, program)
        )
      `,
      )
      .eq("escalated", true)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load escalations", { description: error.message });
    } else if (data) {
      const raw = data as unknown as {
        id: string;
        application_id: string;
        status: string;
        created_at: string;
        attempts: number;
        remarks: string | null;
        departments: { name: string } | null;
        clearance_applications: {
          profiles: { full_name: string; user_code: string; program: string | null } | null;
        } | null;
      }[];

      const mapped: EscalatedItem[] = raw.map((r) => ({
        reviewId: r.id,
        appId: r.application_id,
        studentName: r.clearance_applications?.profiles?.full_name ?? "Unknown",
        userCode: r.clearance_applications?.profiles?.user_code ?? "—",
        program: r.clearance_applications?.profiles?.program ?? null,
        deptName: r.departments?.name ?? "—",
        escalatedAt: r.created_at,
        escalatedBy: "Office Staff",
        attempts: r.attempts,
        status: r.status,
      }));
      setItems(mapped);
    }
    setLoading(false);
  }

  async function handleResolve(reviewId: string, action: "approve" | "reject" | "unescalate") {
    setProcessingId(reviewId);
    const note = actionNotes[reviewId] ?? "";

    let updateStatus: "approved" | "rejected" | undefined = undefined;
    let remarksNote = "";

    if (action === "approve") {
      updateStatus = "approved";
      remarksNote = note ? `Admin Approved: ${note}` : "Approved by Admin after escalation";
    } else if (action === "reject") {
      updateStatus = "rejected";
      remarksNote = note ? `Admin Rejected: ${note}` : "Rejected by Admin after escalation";
    } else {
      remarksNote = note
        ? `De-escalated by Admin: ${note}`
        : "De-escalated back to department review";
    }

    const { error } = await supabase
      .from("department_reviews")
      .update({
        escalated: false,
        ...(updateStatus ? { status: updateStatus } : {}),
        remarks: remarksNote,
      })
      .eq("id", reviewId);

    if (error) {
      toast.error("Failed to process escalation", { description: error.message });
    } else {
      toast.success(
        action === "approve"
          ? "Review approved successfully"
          : action === "reject"
            ? "Review rejected"
            : "Case de-escalated back to department",
      );
      loadEscalations();
    }
    setProcessingId(null);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin" className="p-2 border rounded-md hover:bg-accent transition">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-500" /> Escalated Cases Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Review and resolve clearance requests flagged by departmental staff.
          </p>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold text-sm">
            Total Flagged Cases: <Badge variant="secondary">{items.length}</Badge>
          </span>
          <Button size="sm" variant="outline" onClick={loadEscalations} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading escalated cases…</p>
        ) : items.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="font-semibold text-lg">No Active Escalations</h3>
            <p className="text-sm text-muted-foreground">
              All flagged issues have been reviewed and resolved.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.reviewId} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-base">{item.studentName}</h4>
                    <p className="text-xs text-muted-foreground">
                      ID: <span className="font-medium text-foreground">{item.userCode}</span> |
                      Program: {item.program ?? "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className="border-rose-300 text-rose-600 dark:border-rose-800 dark:text-rose-400"
                    >
                      Office: {item.deptName}
                    </Badge>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Flagged:{" "}
                      {new Date(item.escalatedAt).toLocaleString("en-GB", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>

                <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 p-3 rounded-md text-xs flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    Reason for Escalation:
                  </span>
                  <span className="text-foreground/90">
                    Rejected and resubmitted {item.attempts}{" "}
                    {item.attempts === 1 ? "time" : "times"} by office staff without resolution.
                  </span>
                  {item.status !== "pending" && (
                    <Badge variant="outline" className="text-[10px]">
                      {item.status}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <Textarea
                    placeholder="Admin decision note / remarks (optional)…"
                    className="text-xs min-h-[60px]"
                    value={actionNotes[item.reviewId] || ""}
                    onChange={(e) =>
                      setActionNotes({ ...actionNotes, [item.reviewId]: e.target.value })
                    }
                  />

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                      disabled={processingId === item.reviewId}
                      onClick={() => handleResolve(item.reviewId, "unescalate")}
                    >
                      Return to Staff
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="text-xs"
                      disabled={processingId === item.reviewId}
                      onClick={() => handleResolve(item.reviewId, "reject")}
                    >
                      Reject Application
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={processingId === item.reviewId}
                      onClick={() => handleResolve(item.reviewId, "approve")}
                    >
                      Overrule & Approve
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
