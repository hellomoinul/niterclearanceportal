import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/_authenticated/admin/users')({
  component: usermanagement, 
});

function usermanagement() {
  const [users, setusers] = useState<any[]>([]);
  const [editinguserid, seteditinguserid] = useState<string | null>(null);

  useEffect(() => {
    fetchusers();
  }, []);

  const fetchusers = async () => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (data) setusers(data);
    if (error) console.error("error fetching users:", error);
  };

  const updateuserrole = async (userid: string, newrole: string) => {
    await supabase.from('profiles').update({ role: newrole } as any).eq('id', userid);
    seteditinguserid(null);
    fetchusers();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">user management</h2>
      <table className="min-w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">name / code</th>
            <th className="border p-2">email</th>
            <th className="border p-2">role</th>
            <th className="border p-2">department</th>
            <th className="border p-2">actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user: any) => (
            <tr key={user.id}>
              <td className="border p-2">{user.name} ({user.user_code})</td>
              <td className="border p-2">{user.personal_email}</td>
              <td className="border p-2">
                {editinguserid === user.id ? (
                  <select 
                    defaultValue={user.role} 
                    onChange={(e) => updateuserrole(user.id, e.target.value as 'admin' | 'staff' | 'student')}
                    className="border rounded p-1"
                  >
                    <option value="student">student</option>
                    <option value="staff">staff</option>
                    <option value="admin">admin</option>
                  </select>
                ) : (
                  user.role
                )}
              </td>
              <td className="border p-2">{user.department || 'n/a'}</td>
              <td className="border p-2 space-x-2">
                <button 
                  onClick={() => seteditinguserid(editinguserid === user.id ? null : user.id)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                >
                  {editinguserid === user.id ? 'cancel' : 'edit'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}