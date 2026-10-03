import { useState, useEffect, useCallback } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader2, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CardDescription } from '@/components/ui/card';

export const Route = createFileRoute('/_authenticated/admin/settings')({
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

interface OfficeDepartmentBinding {
  user_id: string;
  department_id: string;
}

interface StaffMember {
  id: string;
  user_code: string;
  full_name: string;
  role: string;
  officeIds: string[];
  officeNames: string[];
  created_at: string;
  is_active: boolean;
}

export default function AdminSettingsPage() {
  const { profile, refresh, user, isStudent, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [program, setProgram] = useState(profile?.program ?? "");
  const [batch, setBatch] = useState(profile?.batch ?? "");

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

  // Signature section state
  const [activeSignature, setActiveSignature] = useState<SignatureRecord | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

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

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveSignature();
  }, [fetchActiveSignature]);

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
        .from("signatures")
        .update({ active: false })
        .eq("id", activeSignature.id);
    }

    // 3. Insert new active signature record
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
    }
  }

  function handleDeleteClick() {
    toast.error("Cannot delete the active signature", {
      description:
        "At least one registrar signature must remain active. Upload a replacement image to update.",
    });
  }

  // Program/Batch update
  async function handleProgramBatchUpdate() {
    if (!user?.id) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ program: program.trim(), batch: batch.trim() })
      .eq("id", user.id);
    setBusy(false);
    if (error) {
      toast.error("Failed to update", { description: error.message });
    } else {
      toast.success("Profile updated");
      refresh();
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage registrar signature, program details, and system configuration.
        </p>
      </div>

      <Tabs defaultValue="signature" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signature">Registrar Signature</TabsTrigger>
          <TabsTrigger value="profile">Program & Batch</TabsTrigger>
        </TabsList>

        <TabsContent value="signature">
          <Card>
            <CardHeader>
              <CardTitle>Registrar Signature</CardTitle>
              <CardDescription>
                Upload the registrar's signature image. This signature will be embedded on all issued certificates.
                The image is stored in Supabase Storage and a database record tracks the active version.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Current Active Signature</h3>
                  {loading ? (
                    <div className="h-32 flex items-center justify-center text-muted-foreground border rounded-lg">
                      Loading signature...
                    </div>
                  ) : activeSignature ? (
                    <div className="relative h-32 w-64 border rounded-lg overflow-hidden bg-muted/30">
                      <img src={previewUrl ?? ""} alt="Active signature preview" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="h-32 flex items-center justify-center text-muted-foreground border rounded-lg border-dashed">
                      No active signature uploaded yet.
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    {activeSignature && (
                      <Button
                        variant="destructive"
                        onClick={handleDeleteClick}
                        disabled={loading}
                      >
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
                      <Input
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
                          selectedFile ? "bg-green-50 border-green-300" : "hover:bg-muted border-primary"
                        )}
                      >
                        {selectedFile ? (
                          <>
                            <span className="text-sm font-medium">{selectedFile.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(selectedFile.size / 1024)} KB
                            </span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-6 h-6" />
                            <span>Click or drag to upload</span>
                          </>
                        )}
                      </Label>
                    </div>
                    {preview && (
                      <div className="relative h-24 w-48 border rounded-lg overflow-hidden">
                        <img src={preview} alt="Preview" className="w-full h-full object-contain" />
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Program & Batch</CardTitle>
              <CardDescription>
                Update your program and batch information. This information appears on your certificate.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="program">Program</Label>
                  <Input
                    id="program"
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    placeholder="e.g. B.Sc. in Textile Engineering"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch">Batch</Label>
                  <Input
                    id="batch"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    placeholder="e.g. 2023-24"
                  />
                </div>
              </div>
              <Button onClick={handleProgramBatchUpdate} disabled={busy}>
                {busy ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}