import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { ArrowRight, FileCheck2, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/portal-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { formatCertificateId } from "@/lib/portal";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";
import QRCode from "qrcode";

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
  const { user, profile, isOffice, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const [isDownloading, setIsDownloading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const certRef = useRef<HTMLDivElement>(null);

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
        .select("id, issued_at")
        .eq("application_id", application!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!certificate?.id) return;
    const formattedCode = formatCertificateId(certificate.id);
    const verifyUrl = `${window.location.origin}/verify?id=${encodeURIComponent(formattedCode)}`;
    QRCode.toDataURL(verifyUrl, { width: 100, margin: 0 })
      .then(setQrCodeUrl)
      .catch((err) => console.error("Failed to generate QR code", err));
  }, [certificate?.id]);

  useEffect(() => {
    if (!loading && (isOffice || isAdmin)) {
      navigate({ to: "/queue", replace: true });
    }
  }, [loading, isOffice, isAdmin, navigate]);

  const handleDownloadCertificate = async () => {
    if (!certRef.current) return;
    setIsDownloading(true);

    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasRatio = canvas.width / canvas.height;

      let finalWidth = pdfWidth;
      let finalHeight = pdfWidth / canvasRatio;

      if (finalHeight > pdfHeight) {
        finalHeight = pdfHeight;
        finalWidth = pdfHeight * canvasRatio;
      }

      const xOffset = (pdfWidth - finalWidth) / 2;
      const yOffset = (pdfHeight - finalHeight) / 2;

      pdf.addImage(imgData, "PNG", xOffset, yOffset, finalWidth, finalHeight);
      pdf.save(`Clearance_Certificate_${profile?.user_code || "NITER"}.pdf`);
    } catch (error: any) {
      console.error("Error generating document:", error);
      alert(`Download Failed: ${error.message || "Please try again."}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const approved = (reviews ?? []).filter((r) => r.status === "approved").length;
  const total = reviews?.length ?? 0;
  const percent = total ? Math.round((approved / total) * 100) : 0;

  return (
    <PortalShell>
      <PageHeader
        title={profile?.full_name ? `Hello, ${profile.full_name.split(" ")[0]}` : "My clearance"}
        description={
          profile?.user_code
            ? `${profile.user_code}${profile?.program ? ` · ${profile.program}` : ""}${profile?.batch ? ` · Academic year ${profile.batch}` : ""}`
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
        {(isOffice || isAdmin) && (
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
            Submit once and offices unlock in strict order — the first one opens the moment you apply.
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
                <Button onClick={handleDownloadCertificate} disabled={isDownloading}>
                  {isDownloading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download certificate
                    </>
                  )}
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
                      Waiting for prior offices
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
                    Escalated to Administration
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Hidden Off-screen Certificate for Direct PDF Capture */}
      {certificate && profile && (
        <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
          <div
            ref={certRef}
            className="w-[950px] min-w-[950px] aspect-[1.414] bg-[#ffffff] p-8 flex flex-col shadow-md rounded-lg border border-slate-100"
          >
            <div className="border-[6px] border-double border-[#cbd5e1] rounded-2xl p-10 flex-1 flex flex-col justify-between bg-[#ffffff]">
              <div className="text-center space-y-2 mt-2">
                <h2 className="text-3xl font-serif font-bold uppercase tracking-wider text-[#0f172a]">
                  National Institute of Textile Engineering and Research
                </h2>
                <p className="text-[#64748b] uppercase tracking-widest text-sm">Nayarhat, Savar, Dhaka</p>
              </div>

              <div className="text-center">
                <h3 className="text-2xl font-serif font-semibold text-[#1e293b] italic">
                  Digital Clearance Certificate
                </h3>
              </div>

              <div className="text-lg leading-loose text-[#1e293b] text-center max-w-3xl mx-auto font-serif">
                This is to certify that{" "}
                <span className="relative inline-block font-bold px-2 mx-1 pb-1">
                  {profile.full_name}
                  <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#94a3b8]"></span>
                </span>
                , Student ID{" "}
                <span className="relative inline-block font-bold px-2 mx-1 pb-1">
                  {profile.user_code}
                  <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#94a3b8]"></span>
                </span>{" "}
                of the{" "}
                <span className="relative inline-block font-bold px-2 mx-1 pb-1">
                  {profile.program}
                  <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#94a3b8]"></span>
                </span>{" "}
                department, Academic year{" "}
                <span className="relative inline-block font-bold px-2 mx-1 pb-1">
                  {profile.batch}
                  <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#94a3b8]"></span>
                </span>
                , has successfully completed all necessary departmental and administrative clearance procedures.
              </div>

              <div className="flex justify-between items-end px-8 mb-2">
                <div className="flex flex-col items-center justify-end">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="Verification QR Code" className="w-12 h-12 mb-1.5" />
                  ) : (
                    <div className="w-12 h-12 mb-1.5 border border-dashed border-[#e2e8f0] flex items-center justify-center text-[8px] text-[#64748b] text-center p-0.5">
                      QR
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-[10px] font-semibold text-[#334155] uppercase tracking-wider">Date Issued</p>
                    <p className="text-xs font-medium text-[#0f172a] mt-0.5">
                      {certificate.issued_at
                        ? new Date(certificate.issued_at).toLocaleDateString("en-GB")
                        : new Date().toLocaleDateString("en-GB")}
                    </p>
                    {certificate.id && (
                      <>
                        <p className="text-[10px] font-semibold text-[#334155] uppercase tracking-wider mt-1.5">Certificate ID</p>
                        <p className="text-xs font-bold font-mono text-[#0f172a] mt-0.5 tracking-wide">{formatCertificateId(certificate.id)}</p>
                        <p className="text-[8px] font-mono text-[#94a3b8] mt-0.5 break-all">{certificate.id}</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-center flex flex-col items-center justify-end">
                  <img
                    src="/signature.png"
                    alt="Administration Signature"
                    className="h-16 object-contain mb-2 opacity-80"
                  />
                  <div className="border-t-[1.5px] border-[#1e293b] w-48 mb-1 mx-auto"></div>
                  <p className="text-xs font-bold text-[#1e293b] uppercase tracking-wider">Administration</p>
                  <p className="text-[10px] text-[#64748b] tracking-widest mt-0.5">NITER</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PortalShell>
  );
}