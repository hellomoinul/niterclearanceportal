import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettingsPage,
});

interface SignatureRecord {
  id: string;
  storage_path: string;
  created_at: string;
  active: boolean;
}

interface DepartmentRecord {
  id: string;
  code: string;
  name: string;
  requirement: string | null;
  sort_order: number;
  is_final_signoff: boolean;
}

export default function AdminSettingsPage() {
  const { profile, refresh, user, isStudent, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: officeDepts } = useQuery({
    enabled: !!user && !isStudent,
    queryKey: ["office-departments", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("departments")
        .select("id, code, name, requirement, sort_order, is_final_signoff")
        .order("sort_order");
      if (error) throw error;
      return data as DepartmentRecord[];
    },
  });

  const [activeSignature, setActiveSignature] = useState<SignatureRecord | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [oldSignatures, setOldSignatures] = useState<SignatureRecord[]>([]);
  const [certRefCounts, setCertRefCounts] = useState<Record<string, number>>({});
  const [showActiveRemoveDialog, setShowActiveRemoveDialog] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<SignatureRecord | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveSignature();
    fetchOldSignatures();
  }, []);

  const fetchActiveSignature = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("signatures")
      .select("*")
      .eq("active", true)
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
  }, []);

  const fetchOldSignatures = useCallback(async () => {
    const [{ data: sigs, error }, { data: certs }] = await Promise.all([
      supabase
        .from("signatures")
        .select("*")
        .eq("active", false)
        .order("created_at", { ascending: false }),
      supabase.from("certificates").select("signature_id"),
    ]);

    if (error) {
      toast.error("Failed to load old signatures", { description: error.message });
      return;
    }

    setOldSignatures(sigs ?? []);

    const counts: Record<string, number> = {};
    for (const cert of certs ?? []) {
      if (cert.signature_id) {
        counts[cert.signature_id] = (counts[cert.signature_id] ?? 0) + 1;
      }
    }
    setCertRefCounts(counts);
  }, []);

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
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
  }

  async function handleUpload() {
    if (!selectedFile) {
      toast.error("Please select an image file first");
      return;
    }

    setUploading(true);
    const fileExt = selectedFile.name.split(".").pop();
    const filePath = `registrar_${Date.now()}.${fileExt}`;

    const { error: uploadErr } = await supabase.storage
      .from("signatures")
      .upload(filePath, selectedFile, { upsert: true });

    if (uploadErr) {
      toast.error("Upload failed", { description: uploadErr.message });
      setUploading(false);
      return;
    }

    if (activeSignature) {
      await supabase.from("signatures").update({ active: false }).eq("id", activeSignature.id);
    }

    const { error: dbErr } = await supabase.from("signatures").insert([
      {
        storage_path: filePath,
        active: true,
      },
    ]);

    setUploading(false);

    if (dbErr) {
      toast.error("Failed to save signature metadata", { description: dbErr.message });
    } else {
      toast.success("Registrar signature updated successfully!");
      setSelectedFile(null);
      setPreview(null);
      fetchActiveSignature();
      fetchOldSignatures();
    }
  }

  function handleDeleteClick() {
    setShowActiveRemoveDialog(true);
  }

  function handleUploadNewClick() {
    setShowActiveRemoveDialog(false);
    document.getElementById("signature-upload")?.click();
  }

  async function confirmRemoveOld() {
    const target = pendingRemove;
    if (!target) return;

    setRemovingId(target.id);

    const { error: rmErr } = await supabase.storage
      .from("signatures")
      .remove([target.storage_path]);

    if (rmErr) {
      setRemovingId(null);
      toast.error("Failed to remove signature image", { description: rmErr.message });
      return;
    }

    const { error: dbErr } = await supabase.from("signatures").delete().eq("id", target.id);

    setRemovingId(null);

    if (dbErr) {
      toast.error("Failed to remove signature record", { description: dbErr.message });
      return;
    }

    setPendingRemove(null);
    toast.success("Old signature removed");
    fetchOldSignatures();
  }

  function renderSignatureSection() {
    if (loading) {
      return (
        <div className="h-32 flex items-center justify-center text-muted-foreground border rounded-lg w-full max-w-xs mx-auto">
          Loading signature...
        </div>
      );
    }
    if (activeSignature) {
      return (
        <div className="relative h-32 w-full max-w-xs mx-auto border rounded-lg overflow-hidden bg-muted/30">
          <img
            src={previewUrl ?? ""}
            alt="Active signature preview"
            className="w-full h-full object-contain"
          />
        </div>
      );
    }
    return (
      <div className="h-32 flex items-center justify-center text-muted-foreground border rounded-lg border-dashed w-full max-w-xs mx-auto">
        No active signature uploaded yet.
      </div>
    );
  }

function renderUploadSection() {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Upload New Signature</h3>
        <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
          <div className="space-y-2">
            <Label htmlFor="signature-upload" className="font-medium">
              Select Image (JPG/PNG, max 2MB)
            </Label>
            <input
              id="signature-upload"
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileSelect}
              disabled={uploading}
              className="sr-only"
            />
            <Label
              htmlFor="signature-upload"
              className={cn(
                "flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors",
                selectedFile ? "bg-green-50 border-green-300" : "hover:bg-muted border-primary",
              )}
            >
              {selectedFile ? (
                <div>
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(selectedFile.size / 1024)} KB
                  </span>
                </div>
              ) : (
                <div>
                  <Upload className="w-6 h-6" />
                  <span>Click or drag to upload</span>
                </div>
              )}
            </Label>
          </div>
{preview && (
                      <div className="relative h-24 w-full max-w-xs mx-auto border rounded-lg overflow-hidden">
                        <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                      </div>
                    )}
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full gap-2"
          >
            {uploading ? (
              <div>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </div>
            ) : (
              <div>
                <Upload className="w-4 h-4" />
                Save & Activate Signature
              </div>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage registrar signature and system configuration.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registrar Signature</CardTitle>
          <CardDescription>
            Upload the registrar's signature image. This signature will be embedded on all issued
            certificates. The image is stored in Supabase Storage and a database record tracks the
            active version.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Current Active Signature</h3>
              {renderSignatureSection()}
              <div className="flex gap-2 pt-2">
                {activeSignature && (
                  <Button variant="destructive" onClick={handleDeleteClick} disabled={loading}>
                    Remove Signature
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Upload New Signature</h3>
              <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="signature-upload" className="font-medium">
                    Select Image (JPG/PNG, max 2MB)
                  </Label>
                  <input
                    id="signature-upload"
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="sr-only"
                  />
                  <Label
                    htmlFor="signature-upload"
                    className={cn(
                      "flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors",
                      selectedFile
                        ? "bg-green-50 border-green-300"
                        : "hover:bg-muted border-primary",
                    )}
                  >
                    {selectedFile ? (
                      <div>
                        <span className="text-sm font-medium">{selectedFile.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(selectedFile.size / 1024)} KB
                        </span>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-6 h-6" />
                        <span>Click or drag to upload</span>
                      </div>
                    )}
                  </Label>
                </div>
{preview && (
                    <div className="relative h-24 w-full max-w-xs mx-auto border rounded-lg overflow-hidden">
                      <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="w-full gap-2"
                >
                  {uploading ? (
                    <div>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-4 h-4" />
                      Save & Activate Signature
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Old Signatures</CardTitle>
          <CardDescription>
            Deactivated signatures from previous uploads. Signatures still used on issued
            certificates are kept for history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {oldSignatures.length === 0 ? (
            <div className="h-24 flex items-center justify-center text-muted-foreground border rounded-lg border-dashed">
              No old signatures.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {oldSignatures.map((sig) => {
                const refCount = certRefCounts[sig.id] ?? 0;
                const { data } = supabase.storage.from("signatures").getPublicUrl(sig.storage_path);
                return (
                  <div key={sig.id} className="border rounded-lg p-3 space-y-2 min-w-0">
                    <div className="h-20 border rounded bg-muted/30 overflow-hidden">
                      <img
                        src={data.publicUrl}
                        alt="Old signature"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      Uploaded {new Date(sig.created_at).toLocaleDateString()}
                    </p>
                    {refCount > 0 ? (
                      <span className="inline-block text-xs px-2 py-1 rounded bg-muted text-muted-foreground truncate">
                        Used by {refCount} certificate{refCount === 1 ? "" : "s"} — kept for history
                      </span>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        disabled={removingId === sig.id}
                        onClick={() => setPendingRemove(sig)}
                      >
                        {removingId === sig.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Removing...
                          </>
                        ) : (
                          "Remove"
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showActiveRemoveDialog} onOpenChange={setShowActiveRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Upload a new signature first</AlertDialogTitle>
            <AlertDialogDescription>
              The current active signature cannot be removed on its own. Upload a replacement
              signature — the current one will move to Old Signatures.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUploadNewClick}>
              Upload New Signature
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!pendingRemove}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove old signature?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the signature image from Storage and its database record.
              Issued certificates are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveOld}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
