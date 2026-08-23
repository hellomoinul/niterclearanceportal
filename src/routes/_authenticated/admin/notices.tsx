import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, type FormEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const route = createFileRoute('/_authenticated/admin/notices' as any)({
  component: NoticesManagement,
});

export default function NoticesManagement() {
  const [notices, setNotices] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchnotices();
  }, []);

  const fetchnotices = async () => {
    const { data, error } = await supabase
      .from('notices' as any)
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("error fetching notices:", error);
      return;
    }
    if (data) setNotices(data);
  };

  const addnotice = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('notices' as any).insert([{ title, content }]);
    
    if (error) {
      alert("failed to add notice");
      console.error(error);
      return;
    }
    
    setTitle('');
    setContent('');
    fetchnotices();
  };

  const deletenotice = async (id: string) => {
    const { error } = await supabase.from('notices' as any).delete().eq('id', id);
    if (error) {
      alert("failed to delete notice");
      console.error(error);
      return;
    }
    fetchnotices();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">notices management</h2>
      
      {/* create notice form */}
      <form onSubmit={addnotice} className="bg-gray-50 p-4 rounded shadow mb-8 max-w-2xl space-y-4">
        <div>
          <label className="block font-medium mb-1">title</label>
          <input 
            type="text" 
            required 
            className="border p-2 w-full rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium mb-1">content</label>
          <textarea 
            required 
            rows={3} 
            className="border p-2 w-full rounded"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          publish notice
        </button>
      </form>

      {/* notices list */}
      <div className="max-w-2xl space-y-4">
        {notices.map((notice: any) => (
          <div key={notice.id} className="border p-4 rounded flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">{notice.title}</h3>
              <p className="text-gray-600 mt-1">{notice.content}</p>
              <span className="text-xs text-gray-400 mt-2 block">
                {new Date(notice.created_at).toLocaleString()}
              </span>
            </div>
            <button 
              onClick={() => deletenotice(notice.id)}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              delete
            </button>
          </div>
        ))}
        {notices.length === 0 && (
          <p className="text-gray-500 text-center py-4 border rounded">no notices found.</p>
        )}
      </div>
    </div>
  );
}