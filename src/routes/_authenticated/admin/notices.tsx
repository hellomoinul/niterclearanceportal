import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, Plus, Megaphone } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/admin/notices')({
  component: NoticeBoardPage,
});

interface Notice {
  id: string;
  title: string;
  content: string;
  created_at: string;
  target_audience?: string;
}

export default function NoticeBoardPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('All');

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setNotices(data as Notice[]);
    }
    setLoading(false);
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);

    const { data: userData } = await supabase.auth.getUser();

    const { data: newNotice, error } = await supabase
      .from('notices')
      .insert({
        title: title.trim(),
        content: content.trim(),
        target_audience: targetAudience.trim() || 'All',
      })
      .select()
      .single();

    if (error) {
      console.error('Notice create error:', error);
      alert(`Failed to publish notice: ${error.message}`);
      setIsSubmitting(false);
      return;
    }

    // Insert into audit_log
    await supabase.from('audit_log').insert({
      action: 'notice_created',
      entity: 'notices',
      entity_id: newNotice?.id,
      details: JSON.stringify({
        title: title.trim(),
        target_audience: targetAudience,
        created_by: userData?.user?.id,
      }),
    });

    setTitle('');
    setContent('');
    setTargetAudience('All');
    setOpen(false);
    setIsSubmitting(false);
    fetchNotices();
  };

  const handleDeleteNotice = async (id: string, noticeTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${noticeTitle}"?`)) return;

    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from('notices').delete().eq('id', id);

    if (!error) {
      // Insert into audit_log
      await supabase.from('audit_log').insert({
        action: 'notice_deleted',
        entity: 'notices',
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
              <DialogTitle>Publish New Notice</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateNotice} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Notice Title</label>
                <Input
                  placeholder="e.g. Final Clearance Deadline for Batch 2022"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Audience</label>
                <Input
                  placeholder="e.g. Batch 2022 or All"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Content Details</label>
                <Textarea
                  placeholder="Write notice description..."
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Publishing...' : 'Publish Notice'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg bg-card shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
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
                    <Badge variant="outline">{notice.target_audience || 'All'}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(notice.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteNotice(notice.id, notice.title)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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