import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const route = createFileRoute('/_authenticated/admin/audit' as any)({
  component: auditlogviewer,
});

export default function auditlogviewer() {
  const [logs, setlogs] = useState<any[]>([]);
  const [loading, setloading] = useState(true);

  useEffect(() => {
    fetchauditlogs();
  }, []);

  const fetchauditlogs = async () => {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);
      
    if (error) {
      console.error('error fetching audit logs:', error);
      setloading(false);
      return;
    }

    if (data) setlogs(data);
    setloading(false);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">system audit log</h2>
      <p className="text-gray-500 mb-4">showing the 100 most recent system actions.</p>
      
      <div className="overflow-x-auto bg-white rounded shadow border">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left text-sm uppercase tracking-wider">
              <th className="border-b p-3">timestamp</th>
              <th className="border-b p-3">actor (user/registrar id)</th>
              <th className="border-b p-3">action</th>
              <th className="border-b p-3">target / remarks</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-4 text-center">loading logs...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-center">no audit logs found.</td></tr>
            ) : (
              logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50 text-sm">
                  <td className="border-b p-3 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="border-b p-3 font-medium">{log.actor}</td>
                  <td className="border-b p-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      log.action === 'APPROVE' ? 'bg-green-100 text-green-800' :
                      log.action === 'REJECT' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="border-b p-3 text-gray-600">{log.remarks || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}