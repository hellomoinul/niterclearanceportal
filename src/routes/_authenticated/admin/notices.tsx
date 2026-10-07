import { useState, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, Megaphone, Edit2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/notices")({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
  },
  component: NoticeBoardPage,
});

type AudienceType = "all" | "students" | "office" | "batch";

interface Notice {
  id: string;
  title: string;
  content: string;
  created_at: string;
  target_audience?: string;
  audience_type?: "all" | "students" | "office" | "batch";
  audience_value?: string;
}

export default function NoticeBoardPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetAudience, setTargetAudience] = useState("All");

  // Edit state
  const [editing, setEditing] = useState<Notice | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editAudienceType, setEditAudienceType] = useState<"all" | "students" | "office" | "batch">(
    "all",
  );
  const [editAudienceValue, setEditAudienceValue] = useState("");

  // Structured audience for create
  const [audienceType, setAudienceType] = useState<"all" | "students" | "office" | "batch">("all");
  const [audienceValue, setAudienceValue] = useState("");

  // Offices and batches for dropdowns
  const [offices, setOffices] = useState<{ id: string; name: string }[]>([]);
  const [batches, setBatches] = useState<string[]>([]);

  useEffect(() => {
    fetchNotices();
    fetchOfficesAndBatches();
  }, []);

  const fetchOfficesAndBatches = async () => {
    const [depts, profiles] = await Promise.all([
      supabase.from("departments").select("id, name").order("sort_order"),
      supabase.from("profiles").select("batch").not("batch", "is", null),
    ]);
    if (!depts.error && depts.data) setOffices(depts.data);
    if (!profiles.error && profiles.data) {
      const uniqueBatches = [...new Set(profiles.data.map((p) => p.batch).filter(Boolean))].sort();
      setBatches(uniqueBatches as string[]);
    }
  };

  const fetchNotices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notices")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setNotices(data as Notice[]);
    }
    setLoading(false);
  };

  const buildAudienceString = (
    type: "all" | "students" | "office" | "batch",
    value: string,
  ): string => {
    switch (type) {
      case "all":
        return "All";
      case "students":
        return "Students";
      case "office": {
        const office = offices.find((o) => o.id === value);
        return office ? `Office: ${office.name}` : "Office";
      }
      case "batch":
        return `Batch: ${value}`;
      default:
        return "All";
    }
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);

    const { data: userData } = await supabase.auth.getUser();
    const audienceStr = buildAudienceString(audienceType, audienceValue);

    const { data: newNotice, error } = await supabase
      .from("notices")
      .insert({
        title: title.trim(),
        content: content.trim(),
        target_audience: audienceStr,
      })
      .select()
      .single();

    if (error) {
      console.error("Notice create error:", error);
      alert(`Failed to publish notice: ${error.message}`);
      setIsSubmitting(false);
      return;
    }

    // Insert into audit_log
    const createdNotice = newNotice as Notice | null;
    await supabase.from("audit_log").insert({
      action: "notice_created",
      entity: "notices",
      entity_id: createdNotice?.id ?? null,
      details: JSON.stringify({
        title: title.trim(),
        target_audience: audienceStr,
        created_by: userData?.user?.id,
      }),
    });

    setTitle("");
    setContent("");
    setAudienceType("all");
    setAudienceValue("");
    setOpen(false);
    setIsSubmitting(false);
    fetchNotices();
  };

  const handleDeleteNotice = async (id: string, noticeTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${noticeTitle}"?`)) return;

    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from("notices").delete().eq("id", id);

    if (!error) {
      // Insert into audit_log
      await supabase.from("audit_log").insert({
        action: "notice_deleted",
        entity: "notices",
        entity_id: id,
        details: JSON.stringify({
          title: noticeTitle,
          deleted_by: userData?.user?.id,
        }),
      });

      fetchNotices();
    } else {
      alert(`Failed to delete notice: ${error.message}`);
    }
  };

  // Edit handlers
  const openEditDialog = (notice: Notice) => {
    setEditing(notice);
    setEditTitle(notice.title);
    setEditContent(notice.content);
    if (notice.target_audience === "All" || !notice.target_audience) {
      setEditAudienceType("all");
      setEditAudienceValue("");
    } else if (notice.target_audience === "Students") {
      setEditAudienceType("students");
      setEditAudienceValue("");
    } else if (notice.target_audience?.startsWith("Office: ")) {
      setEditAudienceType("office");
      const officeName = notice.target_audience.replace("Office: ", "");
      const office = offices.find((o) => o.name === officeName);
      setEditAudienceValue(office?.id || "");
    } else if (notice.target_audience?.startsWith("Batch: ")) {
      setEditAudienceType("batch");
      setEditAudienceValue(notice.target_audience.replace("Batch: ", ""));
    } else {
      setEditAudienceType("all");
      setEditAudienceValue("");
    }
    setOpen(true);
  };

  const handleEditNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editTitle.trim() || !editContent.trim()) return;

    setIsSubmitting(true);

    const { data: userData } = await supabase.auth.getUser();
    const audienceStr = buildAudienceString(editAudienceType, editAudienceValue);

    const { error } = await supabase
      .from("notices")
      .update({
        title: editTitle.trim(),
        content: editContent.trim(),
        target_audience: audienceStr,
      })
      .eq("id", editing.id);

    if (error) {
      console.error("Notice update error:", error);
      alert(`Failed to update notice: ${error.message}`);
      setIsSubmitting(false);
      return;
    }

    // Insert into audit_log
    await supabase.from("audit_log").insert({
      action: "notice_updated",
      entity: "notices",
      entity_id: editing.id,
      details: JSON.stringify({
        title: editTitle.trim(),
        target_audience: audienceStr,
        updated_by: userData?.user?.id,
      }),
    });

    setEditing(null);
    setEditTitle("");
    setEditContent("");
    setEditAudienceType("all");
    setEditAudienceValue("");
    setOpen(false);
    setIsSubmitting(false);
    fetchNotices();
  };

  const closeDialog = () => {
    setEditing(null);
    setTitle("");
    setContent("");
    setAudienceType("all");
    setAudienceValue("");
    setEditTitle("");
    setEditContent("");
    setEditAudienceType("all");
    setEditAudienceValue("");
    setOpen(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notice Board Management</h1>
          <p className="text-muted-foreground text-sm">
            Create and manage official announcements for clearance batches.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add New Notice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Notice" : "Publish New Notice"}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={editing ? handleEditNotice : handleCreateNotice}
              className="space-y-4 mt-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium">Notice Title</label>
                <Input
                  placeholder="e.g. Final Clearance Deadline for Batch 2022"
                  value={editing ? editTitle : title}
                  onChange={(e) =>
                    editing ? setEditTitle(e.target.value) : setTitle(e.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Audience</label>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Audience Type</label>
                  <Select
                    value={editing ? editAudienceType : audienceType}
                    onValueChange={(v) =>
                      editing
                        ? setEditAudienceType(v as "all" | "students" | "office" | "batch")
                        : setAudienceType(v as "all" | "students" | "office" | "batch")
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select audience type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="students">Students Only</SelectItem>
                      <SelectItem value="office">Specific Office</SelectItem>
                      <SelectItem value="batch">Specific Batch</SelectItem>
                    </SelectContent>
                  </Select>
                  {(editing ? editAudienceType : audienceType) === "office" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Office</label>
                      <Select
                        value={editing ? editAudienceValue : audienceValue}
                        onValueChange={(v) =>
                          editing ? setEditAudienceValue(v) : setAudienceValue(v)
                        }
                        disabled={isSubmitting || offices.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select office" />
                        </SelectTrigger>
                        <SelectContent>
                          {offices.length === 0 ? (
                            <SelectItem value="" disabled>
                              No offices available
                            </SelectItem>
                          ) : (
                            offices.map((o) => (
                              <SelectItem key={o.id} value={o.id}>
                                {o.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {(editing ? editAudienceType : audienceType) === "batch" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Batch</label>
                      <Select
                        value={editing ? editAudienceValue : audienceValue}
                        onValueChange={(v) =>
                          editing ? setEditAudienceValue(v) : setAudienceValue(v)
                        }
                        disabled={isSubmitting || batches.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select batch" />
                        </SelectTrigger>
                        <SelectContent>
                          {batches.length === 0 ? (
                            <SelectItem value="" disabled>
                              No batches available
                            </SelectItem>
                          ) : (
                            batches.map((b) => (
                              <SelectItem key={b} value={b}>
                                {b}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {(editing ? editAudienceType : audienceType) === "all" ||
                  (editing ? editAudienceType : audienceType) === "students" ? (
                    <p className="text-xs text-muted-foreground">
                      {(editing ? editAudienceType : audienceType) === "all"
                        ? "Visible to all users"
                        : "Visible to all students (not staff/admin)"}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Content Details</label>
                <Textarea
                  placeholder="Write notice description..."
                  rows={4}
                  value={editing ? editContent : content}
                  onChange={(e) =>
                    editing ? setEditContent(e.target.value) : setContent(e.target.value)
                  }
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialog}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : editing ? "Save Changes" : "Publish Notice"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-[var(--surface)] rounded-[var(--radius-card)] shadow-[var(--shadow-raised)] border-none overflow-x-auto">
        <Table>
          <TableHeader className="[&_th]:bg-[var(--surface)]">
            <TableRow>
              <TableHead>Title & Content</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Published Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  Loading notices...
                </TableCell>
              </TableRow>
            ) : notices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  No notices published yet.
                </TableCell>
              </TableRow>
            ) : (
              notices.map((notice) => (
                <TableRow key={notice.id}>
                  <TableCell className="font-medium max-w-md">
                    <div className="flex items-start gap-3">
                      <Megaphone className="w-4 h-4 text-primary mt-1 shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">{notice.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {notice.content}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{notice.target_audience || "All"}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(notice.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(notice)}
                        className="text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteNotice(notice.id, notice.title)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
