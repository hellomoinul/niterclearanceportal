import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileText, Inbox } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/portal-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DOCS_BUCKET } from "@/lib/portal";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_authenticated/queue")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Department queue — NITER" },
      {
        name: "description",
        content:
          "Review pending clearance requests for your office: approve students or reject with remarks.",
      },
      { property: "og:title", content: "Department queue — NITER" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QueuePage,
});

type ReviewStatus = "pending" | "approved" | "rejected";

interface QueueDocument {
  id: string;
  review_id: string;
  file_name: string;
  file_path: string;
  status: ReviewStatus;
  rejection_reason: string | null;
  uploaded_at: string;
}

interface QueueStudent {
  full_name: string;
  user_code: string;
  program: string | null;
  batch: string | null;
}

interface QueueReview {
  id: string;
  status: ReviewStatus;
  remarks: string | null;
  attempts: number;
  escalated: boolean;
  departments: { code: string; name: string } | null;
  clearance_applications: {
    id: string;
    thesis_title: string | null;
    profiles: QueueStudent | null;
  } | null;
}

interface DepartmentInfo {
  id?: string;
  code: string;
  name: string;
}

function QueuePage() {
  const { user, isStaff, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"pending" | "rejected">("pending");
  const [deptCode, setDeptCode] = useState<string>("all");
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && !isStaff && !isAdmin) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, user, isStaff, isAdmin, navigate]);

  const { data: staffDepartments } = useQuery({
    enabled: !!user && !isAdmin,
    queryKey: ["staff-departments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_departments")
        .select("department_id, departments(code, name)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? [])
        .map((row) => ({
          id: row.department_id,
          code: row.departments?.code,
          name: row.departments?.name,
        }))
        .filter((d): d is DepartmentInfo & { id: string; code: string; name: string } =>
          Boolean(d.id && d.code && d.name),
        );
    },
  });

  const { data: allDepartments } = useQuery({
    enabled: isAdmin,
    queryKey: ["all-departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("id, code, name")
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const departments = isAdmin ? allDepartments : staffDepartments;

  const scopedDeptIds = useMemo(() => {
    const list = departments ?? [];
    if (isAdmin && deptCode !== "all") {
      return list.filter((d) => d.code === deptCode).map((d) => d.id!);
    }
    return list.map((d) => d.id!).filter(Boolean);
  }, [departments, deptCode, isAdmin]);

  const { data: reviews, isLoading } = useQuery({
    enabled: !!user && scopedDeptIds.length > 0,
    queryKey: ["queue-reviews", scopedDeptIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("department_reviews")
        .select("*, departments(code, name), clearance_applications(id, thesis_title, student_id)")
        .in("status", ["pending", "rejected"])
        .in("department_id", scopedDeptIds);
      if (error) throw error;

      const raw = (data ?? []) as unknown as {
        id: string;
        status: ReviewStatus;
        remarks: string | null;
        attempts: number;
        escalated: boolean;
        departments: { code: string; name: string } | null;
        clearance_applications: {
          id: string;
          thesis_title: string | null;
          student_id: string;
        } | null;
      }[];

      const studentIds = [
        ...new Set(
          raw.flatMap((r) =>
            r.clearance_applications ? [r.clearance_applications.student_id] : [],
          ),
        ),
      ];

      let studentsById: Record<string, QueueStudent> = {};
      if (studentIds.length > 0) {
        const { data: students, error: studentsError } = await supabase
          .from("profiles")
          .select("id, full_name, user_code, program, batch")
          .in("id", studentIds);
        if (studentsError) throw studentsError;
        studentsById = Object.fromEntries((students ?? []).map((s) => [s.id, s]));
      }

      return raw.map((r) => ({
        ...r,
        clearance_applications: r.clearance_applications
          ? {
              id: r.clearance_applications.id,
              thesis_title: r.clearance_applications.thesis_title,
              profiles: studentsById[r.clearance_applications.student_id] ?? null,
            }
          : null,
      }));
    },
  });

  const reviewIds = useMemo(() => (reviews ?? []).map((r) => r.id), [reviews]);

  const { data: documents } = useQuery({
    enabled: reviewIds.length > 0,
    queryKey: ["queue-documents", reviewIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .in("review_id", reviewIds)
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as QueueDocument[];
    },
  });

  const docsByReview = useMemo(() => {
    const map: Record<string, QueueDocument[]> = {};
    for (const doc of documents ?? []) {
      (map[doc.review_id] ??= []).push(doc);
    }
    return map;
  }, [documents]);

  const visible = useMemo(() => {
    const list = (reviews ?? []).filter((r) =>
      r.status === "pending"
        ? tab === "pending"
        : r.status === "rejected"
          ? tab === "rejected"
          : false,
    );
    return list.sort((a, b) =>
      (a.clearance_applications?.profiles?.user_code ?? "").localeCompare(
        b.clearance_applications?.profiles?.user_code ?? "",
      ),
    );
  }, [reviews, tab]);

  async function openDocument(path: string) {
    const { data, error } = await supabase.storage.from(DOCS_BUCKET).createSignedUrl(path, 300);
    if (error || !data) {
      toast.error("Could not open file");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  async function decide(review: QueueReview, decision: "approved" | "rejected") {
    if (!user) return;
    const note = (remarks[review.id] ?? "").trim();
    if (decision === "rejected" && !note) {
      toast.error("Remarks required", {
        description: "Tell the student what to fix before you can reject.",
      });
      return;
    }

    setBusyId(review.id);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("department_reviews")
      .update({
        status: decision,
        remarks: note || null,
        reviewed_by: user.id,
        reviewed_at: now,
      })
      .eq("id", review.id);

    if (!error) {
      if (decision === "approved") {
        const { error: docError } = await supabase
          .from("documents")
          .update({ status: "approved", reviewed_by: user.id, reviewed_at: now })
          .eq("review_id", review.id);
        if (docError) toast.error("Approved, but document status update failed");
      } else {
        const { data: latestDoc } = await supabase
          .from("documents")
          .select("id")
          .eq("review_id", review.id)
          .order("uploaded_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latestDoc) {
          const { error: docError } = await supabase
            .from("documents")
            .update({
              status: "rejected",
              rejection_reason: note,
              reviewed_by: user.id,
              reviewed_at: now,
            })
            .eq("id", latestDoc.id);
          if (docError) toast.error("Rejected, but document status update failed");
        }
      }
    }
    setBusyId(null);

    if (error) {
      toast.error("Could not save decision", { description: error.message });
      return;
    }
    setRemarks((prev) => ({ ...prev, [review.id]: "" }));
    await queryClient.invalidateQueries({ queryKey: ["queue-reviews"] });
    await queryClient.invalidateQueries({ queryKey: ["queue-documents"] });
    toast.success(decision === "approved" ? "Approved" : "Rejected with remarks");
  }

  async function bulkApprove() {
    if (!user || selectedIds.size === 0) return;
    setBulkBusy(true);
    const ids = [...selectedIds];
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("department_reviews")
      .update({ status: "approved", reviewed_by: user.id, reviewed_at: now })
      .in("id", ids);
    if (!error) {
      const { error: docError } = await supabase
        .from("documents")
        .update({ status: "approved", reviewed_by: user.id, reviewed_at: now })
        .in("review_id", ids);
      if (docError) toast.error("Approved, but document status update failed");
    }
    setBulkBusy(false);
    if (error) {
      toast.error("Bulk approve failed", { description: error.message });
      return;
    }
    setSelectedIds(new Set());
    await queryClient.invalidateQueries({ queryKey: ["queue-reviews"] });
    await queryClient.invalidateQueries({ queryKey: ["queue-documents"] });
    toast.success(`Approved ${ids.length} student${ids.length === 1 ? "" : "s"}`);
  }

  const deptsLoaded = isAdmin ? allDepartments !== undefined : staffDepartments !== undefined;

  if (loading || !deptsLoaded) {
    return (
      <PortalShell>
        <p className="mt-10 text-sm text-muted-foreground">Loading…</p>
      </PortalShell>
    );
  }

  if ((departments?.length ?? 0) === 0) {
    return (
      <PortalShell>
        <div className="card-surface mt-10 p-8 text-center">
          <h1 className="text-lg font-semibold">No office assigned</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Your account is staff but no department office has been linked to it yet. Ask the
            admin office to assign you under Admin → Users.
          </p>
        </div>
      </PortalShell>
    );
  }

  const pendingCount = (reviews ?? []).filter((r) => r.status === "pending").length;
  const rejectedCount = (reviews ?? []).filter((r) => r.status === "rejected").length;

  return (
    <PortalShell>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Department queue"
          description={`${isAdmin ? "All offices" : departments!.map((d) => d.name).join(", ")} · ${pendingCount} awaiting review`}
          breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }]}
        />
        {isAdmin && (
          <Select value={deptCode} onValueChange={setDeptCode}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Office" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All offices</SelectItem>
              {(allDepartments ?? []).map((d) => (
                <SelectItem key={d.code} value={d.code}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as typeof tab);
          setSelectedIds(new Set());
        }}
        className="mt-6"
      >
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading requests…</p>
      ) : visible.length === 0 ? (
        <div className="card-surface mt-6 p-8 text-center">
          <Inbox className="mx-auto size-7 text-primary" aria-hidden />
          <h2 className="mt-3 text-lg font-semibold">
            {tab === "pending" ? "Nothing awaiting review" : "No rejections outstanding"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {tab === "pending"
              ? "New clearance requests for your office will appear here."
              : "Students you rejected will reappear here while they prepare their fixes."}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {tab === "pending" && visible.length > 0 && (
            <div className="flex items-center gap-2 px-1">
              <Checkbox
                checked={selectedIds.size === visible.length}
                onCheckedChange={(checked) =>
                  setSelectedIds(checked ? new Set(visible.map((r) => r.id)) : new Set())
                }
              />
              <span className="text-sm text-muted-foreground">Select all ({visible.length})</span>
            </div>
          )}
          {visible.map((review) => {
            const student = review.clearance_applications?.profiles;
            const docs = docsByReview[review.id] ?? [];
            return (
              <article key={review.id} className="card-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {tab === "pending" && (
                      <Checkbox
                        className="mt-1"
                        checked={selectedIds.has(review.id)}
                        onCheckedChange={(checked) =>
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (checked) next.add(review.id);
                            else next.delete(review.id);
                            return next;
                          })
                        }
                      />
                    )}
                    <h2 className="text-base font-semibold">
                      {student?.full_name ?? "Unknown student"}
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ID {student?.user_code ?? "—"}
                      </span>
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[student?.program, student?.batch ? `Batch ${student.batch}` : null]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                      {review.clearance_applications?.thesis_title
                        ? ` · Thesis: ${review.clearance_applications.thesis_title}`
                        : ""}
                    </p>
                  </div>
                  <StatusBadge status={review.status} />
                </div>

                {review.status === "rejected" && (
                  <p className="mt-3 rounded-md bg-secondary px-3 py-2 text-sm">
                    <span className="font-medium">Your remark:</span> {review.remarks || "—"}
                    <span className="ml-2 text-xs text-muted-foreground">
                      attempts used {Math.min(review.attempts, 3)}/3
                      {review.escalated ? " · escalated to Department Head" : ""}
                    </span>
                  </p>
                )}

                <div className="mt-4">
                  <h3 className="text-sm font-semibold">Proof documents ({docs.length})</h3>
                  {docs.length === 0 ? (
                    <p className="mt-1 text-sm text-muted-foreground">None uploaded yet.</p>
                  ) : (
                    <ul className="mt-2 divide-y divide-border">
                      {docs.map((doc) => (
                        <li key={doc.id} className="flex items-center justify-between gap-3 py-2">
                          <button
                            type="button"
                            onClick={() => openDocument(doc.file_path)}
                            className="flex min-w-0 items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
                          >
                            <FileText className="size-4 shrink-0" aria-hidden />
                            <span className="truncate">{doc.file_name}</span>
                            <ExternalLink className="size-3 shrink-0 opacity-60" aria-hidden />
                          </button>
                          <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                            {new Date(doc.uploaded_at).toLocaleString()}
                            <StatusBadge status={doc.status} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {review.status !== "approved" && (
                  <div className="mt-4 border-t border-border pt-4">
                    <Textarea
                      rows={2}
                      placeholder={
                        review.status === "rejected"
                          ? "Update your remark, then reject again to send it"
                          : "Remark required only when rejecting — tell the student what to fix"
                      }
                      value={remarks[review.id] ?? ""}
                      onChange={(e) =>
                        setRemarks((prev) => ({ ...prev, [review.id]: e.target.value }))
                      }
                    />
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={busyId === review.id}
                        onClick={() => decide(review, "rejected")}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        disabled={busyId === review.id}
                        onClick={() => decide(review, "approved")}
                      >
                        {busyId === review.id ? "Saving…" : "Approve"}
                      </Button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-6 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
                Clear
              </Button>
              <Button size="sm" disabled={bulkBusy} onClick={bulkApprove}>
                {bulkBusy
                  ? "Approving…"
                  : `Approve ${selectedIds.size === 1 ? "student" : "students"}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PortalShell>
  );
}
