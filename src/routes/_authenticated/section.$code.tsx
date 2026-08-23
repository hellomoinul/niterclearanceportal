import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/portal-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { DOCS_BUCKET, MAX_FILE_BYTES, validateUpload } from "@/lib/portal";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_authenticated/section/$code")({
  head: () => ({
    meta: [
      { title: "Clearance section — NITER" },
      {
        name: "description",
        content: "Upload and track the proof document required by this clearance office.",
      },
      { property: "og:title", content: "Clearance section — NITER" },
      {
        property: "og:description",
        content: "Upload the document this NITER clearance office requires.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SectionPage,
});

function SectionPage() {
  const { code } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data: review, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["section", code, user?.id],
    queryFn: async () => {
      const { data: app } = await supabase
        .from("clearance_applications")
        .select("id")
        .eq("student_id", user!.id)
        .maybeSingle();
      if (!app) return null;
      const { data: dept } = await supabase
        .from("departments")
        .select("id, code, name, requirement, document_hint")
        .eq("code", code)
        .maybeSingle();
      if (!dept) return null;
      const { data, error } = await supabase
        .from("department_reviews")
        .select("*")
        .eq("application_id", app.id)
        .eq("department_id", dept.id)
        .maybeSingle();
      if (error) throw error;
      return data ? { ...data, department: dept } : null;
    },
  });

  const { data: documents } = useQuery({
    enabled: !!review?.id,
    queryKey: ["documents", review?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("review_id", review!.id)
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: reviewerName } = useQuery({
    enabled: !!review?.id && !!review?.reviewed_by,
    queryKey: ["reviewer-name", review?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("reviewer_display_name", {
        _review_id: review!.id,
      });
      if (error) throw error;
      return data;
    },
  });

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!review || !user) return;
    const input = event.currentTarget.elements.namedItem("file") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const problem = validateUpload(file);
    if (problem) {
      toast.error("File rejected", { description: problem });
      return;
    }

    setBusy(true);
    const path = `${user.id}/${review.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from(DOCS_BUCKET).upload(path, file);
    if (uploadError) {
      setBusy(false);
      toast.error("Upload failed", { description: uploadError.message });
      return;
    }
    const { error } = await supabase.from("documents").insert({
      review_id: review.id,
      file_path: path,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      uploaded_by: user.id,
    });
    if (!error) {
      const { data: freshReview } = await supabase
        .from("department_reviews")
        .select("status")
        .eq("id", review.id)
        .single();
      if (freshReview?.status === "rejected") {
        const { error: flipError } = await supabase
          .from("department_reviews")
          .update({ status: "pending" })
          .eq("id", review.id);
        if (flipError) {
          toast.error("Document saved, but could not reopen review", {
            description: flipError.message,
          });
        }
      }
    }
    setBusy(false);
    if (error) {
      toast.error("Could not save document", { description: error.message });
      return;
    }
    input.value = "";
    await queryClient.invalidateQueries();
    toast.success("Document uploaded", { description: "The office will review it shortly." });
  }

  async function openDocument(path: string) {
    const { data, error } = await supabase.storage.from(DOCS_BUCKET).createSignedUrl(path, 60);
    if (error || !data) {
      toast.error("Could not open file");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  async function removeDocument(id: string, path: string) {
    await supabase.storage.from(DOCS_BUCKET).remove([path]);
    await supabase.from("documents").delete().eq("id", id);
    await queryClient.invalidateQueries();
  }

  return (
    <PortalShell className="max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/dashboard">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>
      </Button>

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading section…</p>
      ) : !review ? (
        <div className="card-surface mt-6 p-6">
          <h1 className="text-lg font-semibold">Section not available</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Submit your clearance application first, then this office will appear in your dashboard.
          </p>
        </div>
      ) : (
        <>
          <PageHeader
            title={review.department.name}
            description={review.department.requirement}
            breadcrumbs={[
              { label: "Dashboard", to: "/dashboard" },
              { label: "Section" },
            ]}
          />
          <div className="card-surface mt-2 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Review status</span>
              <StatusBadge status={review.status} />
            </div>

            {review.remarks ? (
              <div className="mt-5 rounded-md border border-border bg-secondary p-4">
                <p className="text-sm font-semibold">Office remark</p>
                <p className="mt-1 text-sm text-muted-foreground">{review.remarks}</p>
              </div>
            ) : null}

            {review.escalated ? (
              <p className="mt-4 text-sm font-medium text-status-rejected">
                This section has been escalated to the Department Head after repeated rejections.
              </p>
            ) : null}

            {review.status !== "approved" ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Re-upload attempts used: {review.attempts} of 3
              </p>
            ) : null}
          </div>

          {review.status !== "approved" ? (
            <form className="card-surface mt-6 space-y-4 p-6" onSubmit={handleUpload}>
              <h2 className="text-base font-semibold">Upload proof document</h2>
              <p className="text-sm text-muted-foreground">
                {review.department.document_hint ?? "Attach the document this office asked for."}{" "}
                JPG, PNG or PDF up to {Math.round(MAX_FILE_BYTES / (1024 * 1024))} MB.
              </p>
              <div className="space-y-2">
                <Label htmlFor="file">Document</Label>
                <Input id="file" name="file" type="file" accept=".jpg,.jpeg,.png,.pdf" required />
              </div>
              <Button type="submit" disabled={busy}>
                <Upload className="size-4" /> {busy ? "Uploading…" : "Upload document"}
              </Button>
            </form>
          ) : null}

          <div className="card-surface mt-6 p-6">
            <h2 className="text-base font-semibold">Uploaded documents</h2>
            {documents && documents.length > 0 ? (
              <ul className="mt-4 divide-y divide-border">
                {documents.map((doc) => {
                  const uploadedAfterApproval =
                    review.status === "approved" &&
                    review.reviewed_at != null &&
                    new Date(doc.uploaded_at) > new Date(review.reviewed_at);
                  const reviewedAt =
                    doc.reviewed_at ?? (uploadedAfterApproval ? null : review.reviewed_at);
                  return (
                    <li key={doc.id} className="py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => openDocument(doc.file_path)}
                            className="truncate text-sm font-medium text-primary underline-offset-4 hover:underline"
                          >
                            {doc.file_name}
                          </button>
                          <p className="text-xs text-muted-foreground">
                            {new Date(doc.uploaded_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={doc.status} />
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete document"
                            onClick={() => removeDocument(doc.id, doc.file_path)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                      {doc.status === "approved" && !uploadedAfterApproval ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Approved by {reviewerName ?? "the office"}
                          {reviewedAt ? ` · ${new Date(reviewedAt).toLocaleString()}` : ""}
                        </p>
                      ) : uploadedAfterApproval ? (
                        <p className="mt-1 text-xs italic text-muted-foreground">
                          Uploaded after approval — not included in the review.
                        </p>
                      ) : doc.status === "rejected" && doc.rejection_reason ? (
                        <p className="mt-1 text-xs text-status-rejected">
                          Rejected: {doc.rejection_reason}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Nothing uploaded yet.</p>
            )}
          </div>
        </>
      )}
    </PortalShell>
  );
}
