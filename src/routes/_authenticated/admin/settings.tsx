import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { DEPARTMENTS, academicYears } from "@/lib/departments";
import { phoneInputHandler, normalizeCode } from "@/lib/portal";
import { PageHeader } from "@/components/page-header";
import { FileCheck, Upload, Trash2, Loader2, Image as ImageIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Settings — NITER" },
      { name: "description", content: "Manage admin settings and system preferences." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSettingsPage,
});

interface DepartmentQueryResult {
  departments: {
    name: string | null;
  } | null;
}

interface SignatureRecord {
  id: string;
  storage_path: string;
  created_at: string;
  is_active: boolean;
}

function AdminSettingsPage() {
  const { profile, refresh, user, isStudent, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [program, setProgram] = useState(profile?.program ?? "");
  const [batch, setBatch] = useState(profile?.batch ?? "");

  const { data: officeDepts } = useQuery({
    enabled: !!user && !isStudent,
    queryKey: ["office-departments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("office_departments")
        .select("departments(name)")
        .eq("user_id", user!.id);

      if (error) throw error;
      
      const typedData = (data as unknown as DepartmentQueryResult[]) ?? [];
      return typedData
        .map((row) => row.departments?.name)
        .filter(Boolean) as string[];
    },
  });

  const roleLabel = isAdmin ? "Admin" : "Office";
  const roleOffice = isAdmin ? "Admin" : officeDepts?.join(", ") || "Office";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const targetId = user?.id ?? profile?.id;
    if (!targetId) return;

    const form = new FormData(event.currentTarget);
    setBusy(true);

    const personalEmail = String(form.get("personalEmail") ?? "").trim();
    const fullName = String(form.get("fullName") ?? "").trim();
    const userCode = normalizeCode(String(form.get("userCode") ?? ""));

    if (!fullName || !userCode) {
      setBusy(false);
      toast.error(`Name and ${roleLabel} ID are required`);
      return;
    }

    const base = {
      full_name: fullName,
      user_code: userCode,
      phone: str(form.get("phone")) || null,
      personal_email: personalEmail || null,
    };

    const update = isStudent
      ? {
          ...base,
          guardian_name: str(form.get("guardianName")) || null,
          guardian_phone: str(form.get("guardianPhone")) || null,
          registration_no: str(form.get("registrationNo")) || null,
          present_address: str(form.get("presentAddress")) || null,
          permanent_address: str(form.get("permanentAddress")) || null,
          program: program || null,
          batch: batch || null,
        }
      : base;

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: targetId, ...update }, { onConflict: "id" });

    setBusy(false);

    if (error) {
      if (error.code === "23505" || /duplicate|unique/i.test(error.message)) {
        toast.error(`${roleLabel} ID already taken`, {
          description: "That ID belongs to another account. Use a different one.",
        });
      } else {
        toast.error("Could not update settings", { description: error.message });
      }
      return;
    }

    await refresh();
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    await queryClient.invalidateQueries({ queryKey: ["section"] });
    await queryClient.invalidateQueries({ queryKey: ["queue-reviews"] });
    toast.success("Settings saved successfully");
  }

  return (
    <PortalShell className="max-w-4xl">
      <PageHeader
        title="Admin Settings"
        description="Manage system preferences and admin profile details."
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Admin", to: "/admin" },
        ]}
      />

      <div className="space-y-8 mt-8">
        {/* Section 1: Profile Settings */}
        <div className="card-surface p-6 space-y-6">
          <form onSubmit={handleSubmit}>
            <section>
              <h2 className="text-base font-semibold">Admin Profile Details</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Keep your administrator profile and contact details up to date.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name *</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    required
                    defaultValue={profile?.full_name ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userCode">{roleLabel} ID *</Label>
                  <Input
                    id="userCode"
                    name="userCode"
                    required
                    defaultValue={profile?.user_code ?? ""}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="personalEmail">Personal email</Label>
                  <Input
                    id="personalEmail"
                    name="personalEmail"
                    type="email"
                    defaultValue={profile?.personal_email ?? ""}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="01XXXXXXXXX"
                    inputMode="numeric"
                    pattern="[0-9]{11}"
                    maxLength={11}
                    onInput={phoneInputHandler}
                    defaultValue={profile?.phone ?? ""}
                  />
                </div>

                {isStudent ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="registrationNo">Registration no</Label>
                      <Input
                        id="registrationNo"
                        name="registrationNo"
                        defaultValue={profile?.registration_no ?? ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Program</Label>
                      <Select name="program" value={program} onValueChange={setProgram}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map((d) => (
                            <SelectItem key={d.value} value={d.value}>
                              {d.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Academic year</Label>
                      <Select name="batch" value={batch} onValueChange={setBatch}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                        <SelectContent>
                          {academicYears().map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
                        placeholder="01XXXXXXXXX"
                        inputMode="numeric"
                        pattern="[0-9]{11}"
                        maxLength={11}
                        onInput={phoneInputHandler}
                        defaultValue={profile?.guardian_phone ?? ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="presentAddress">Present address</Label>
                      <Textarea
                        id="presentAddress"
                        name="presentAddress"
                        rows={2}
                        defaultValue={profile?.present_address ?? ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="permanentAddress">Permanent address</Label>
                      <Textarea
                        id="permanentAddress"
                        name="permanentAddress"
                        rows={2}
                        defaultValue={profile?.permanent_address ?? ""}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Role / Office</Label>
                    <Input value={roleOffice} readOnly className="bg-muted" />
                  </div>
                )}
              </div>
              <Button type="submit" size="sm" disabled={busy} className="mt-4">
                {busy ? "Saving…" : "Save settings"}
              </Button>
            </section>
          </form>
        </div>

        {/* Section 2: Registrar Signature Management (Admin Only) */}
        {isAdmin && (
          <div className="card-surface p-6">
            <RegistrarSignatureSection />
          </div>
        )}
      </div>
    </PortalShell>
  );
}

function RegistrarSignatureSection() {
  const [activeSignature, setActiveSignature] = useState<SignatureRecord | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchActiveSignature();
  }, []);

  async function fetchActiveSignature() {
    setLoading(true);
    const { data, error } = await supabase
      .from("signatures" as any)
      .select("*")
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      toast.error("Failed to load active signature", { description: error.message });
    } else if (data) {
      const record = data as unknown as SignatureRecord;
      setActiveSignature(record);
      
      const { data: publicData } = supabase.storage
        .from("signatures")
        .getPublicUrl(record.storage_path);
      
      setPreviewUrl(publicData.publicUrl);
    } else {
      setActiveSignature(null);
      setPreviewUrl(null);
    }
    setLoading(false);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Invalid file format", {
        description: "Only JPG and PNG images are allowed for official signatures.",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size too large", {
        description: "Maximum file size allowed is 2MB.",
      });
      return;
    }

    setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile) {
      toast.error("Please select an image file first");
      return;
    }

    setUploading(true);
    const fileExt = selectedFile.name.split(".").pop();
    const filePath = `registrar_${Date.now()}.${fileExt}`;

    // 1. Upload image to Supabase storage bucket
    const { error: uploadErr } = await supabase.storage
      .from("signatures")
      .upload(filePath, selectedFile, { upsert: true });

    if (uploadErr) {
      toast.error("Upload failed", { description: uploadErr.message });
      setUploading(false);
      return;
    }

    // 2. Deactivate previous signature
    if (activeSignature) {
      await supabase
        .from("signatures" as any)
        .update({ is_active: false })
        .eq("id", activeSignature.id);
    }

    // 3. Insert new active signature record
    const { error: dbErr } = await supabase.from("signatures" as any).insert([
      {
        storage_path: filePath,
        is_active: true,
      },
    ]);

    setUploading(false);

    if (dbErr) {
      toast.error("Failed to save signature metadata", { description: dbErr.message });
    } else {
      toast.success("Registrar signature updated successfully!");
      setSelectedFile(null);
      fetchActiveSignature();
    }
  }

  function handleDeleteClick() {
    toast.error("Cannot delete the active signature", {
      description:
        "At least one registrar signature must remain active. Upload a replacement image to update.",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Registrar Signature</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the official registrar signature rendered on all issued clearance certificates.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Signature Preview */}
        <div className="border rounded-lg bg-card p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" /> Current Active Signature
            </h3>
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Active
            </Badge>
          </div>

          <div className="border rounded-md bg-muted/30 p-4 flex items-center justify-center min-h-[150px]">
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : previewUrl ? (
              <div className="space-y-2 text-center">
                <img
                  src={previewUrl}
                  alt="Registrar Signature"
                  className="max-h-24 mx-auto object-contain bg-white dark:bg-slate-900 p-2 rounded border shadow-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Updated: {new Date(activeSignature!.created_at).toLocaleDateString("en-GB")}
                </p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground space-y-1">
                <ImageIcon className="w-8 h-8 mx-auto stroke-1" />
                <p className="text-sm">No active signature configured.</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-muted-foreground">
              Single active rule enforced for certificate validity.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteClick}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          </div>
        </div>

        {/* Upload Replacement Signature */}
        <div className="border rounded-lg bg-card p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" /> Upload New Signature
          </h3>
          <p className="text-xs text-muted-foreground">
            Upload a transparent PNG or high-contrast JPG image of the new registrar's official signature.
          </p>

          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label htmlFor="signatureFile" className="text-xs">Signature Image (PNG / JPG, max 2MB)</Label>
              <Input
                id="signatureFile"
                type="file"
                accept="image/png, image/jpeg"
                onChange={handleFileSelect}
              />
            </div>

            {selectedFile && (
              <div className="p-3 bg-primary/5 rounded border text-xs space-y-1">
                <p className="font-semibold text-foreground">Selected File:</p>
                <p className="text-muted-foreground">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</p>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full gap-2"
            >
              {uploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
              ) : (
                <><Upload className="w-4 h-4" /> Save & Activate Signature</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function str(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}