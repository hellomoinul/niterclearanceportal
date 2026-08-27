import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { Search, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/portal-shell";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/registrar/queue")({
  component: RegistrarQueuePage,
});

type SortKey = "name" | "id" | "status" | "date";
type SortOrder = "asc" | "desc";

// Added type definition to fix TypeScript errors
type QueueApplication = {
  id: string;
  status: string;
  cleared_at: string | null;
  thesis_title: string | null;
  profiles: {
    full_name: string | null;
    user_code: string | null;
    program: string | null;
    batch: string | null;
  } | null;
};

function RegistrarQueuePage() {
  const { isRegistrar, loading } = useAuth();
  const navigate = useNavigate();

  // Guard: Kick out non-registrars
  useEffect(() => {
    if (!loading && !isRegistrar) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, isRegistrar, navigate]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "issued" | "pending">("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const rowsPerPage = 25;

  // Fetch all applications joined with profiles
  const { data: applications, isLoading } = useQuery({
    enabled: !!isRegistrar,
    queryKey: ["registrar-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clearance_applications")
        .select(`
          id, 
          status, 
          cleared_at, 
          thesis_title,
          profiles!inner(full_name, user_code, program, batch)
        `)
        .order("cleared_at", { ascending: false });
        
      if (error) throw error;
      // Cast the data to fix the red squiggles
      return data as unknown as QueueApplication[];
    },
  });

  // Client-side Filter, Sort, and Paginate
  const processedData = useMemo(() => {
    if (!applications) return [];

    let filtered = applications.filter((app) => {
      // 1. Search Filter with null-safety
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        (app.profiles?.full_name?.toLowerCase() || "").includes(searchLower) ||
        (app.profiles?.user_code?.toLowerCase() || "").includes(searchLower);

      // 2. Status Filter
      const isIssued = app.status === "cleared";
      const matchesStatus = 
        statusFilter === "all" ? true :
        statusFilter === "issued" ? isIssued : !isIssued;

      return matchesSearch && matchesStatus;
    });

    // 3. Sorting
    filtered.sort((a, b) => {
      let valA, valB;
      if (sortKey === "name") {
        valA = a.profiles?.full_name || "";
        valB = b.profiles?.full_name || "";
      } else if (sortKey === "id") {
        valA = a.profiles?.user_code || "";
        valB = b.profiles?.user_code || "";
      } else if (sortKey === "status") {
        valA = a.status;
        valB = b.status;
      } else {
        valA = a.cleared_at ? new Date(a.cleared_at).getTime() : 0;
        valB = b.cleared_at ? new Date(b.cleared_at).getTime() : 0;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [applications, search, statusFilter, sortKey, sortOrder]);

  // 4. Pagination
  const totalPages = Math.ceil(processedData.length / rowsPerPage);
  const paginatedData = processedData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  if (!isRegistrar) return null;

  return (
    <PortalShell>
      <PageHeader 
        title="Final Clearance Queue" 
        description="Monitor and filter student clearance issuance status."
      />

      <div className="card-surface mt-6 p-6">
        {/* Controls: Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
              placeholder="Search by NITER ID or Name..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <select 
            className="flex h-10 w-full sm:w-48 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
          >
            <option value="all">All Statuses</option>
            <option value="issued">Issued Only</option>
            <option value="pending">Not Issued Only</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary text-secondary-foreground">
              <tr>
                <th className="p-3 font-semibold cursor-pointer" onClick={() => toggleSort("id")}>
                  <div className="flex items-center gap-1">NITER ID <ArrowUpDown className="size-3"/></div>
                </th>
                <th className="p-3 font-semibold cursor-pointer" onClick={() => toggleSort("name")}>
                  <div className="flex items-center gap-1">Student Name <ArrowUpDown className="size-3"/></div>
                </th>
                <th className="p-3 font-semibold">Program / Batch</th>
                <th className="p-3 font-semibold">Thesis Title</th>
                <th className="p-3 font-semibold cursor-pointer" onClick={() => toggleSort("status")}>
                  <div className="flex items-center gap-1">Status <ArrowUpDown className="size-3"/></div>
                </th>
                <th className="p-3 font-semibold cursor-pointer" onClick={() => toggleSort("date")}>
                  <div className="flex items-center gap-1">Cleared Date <ArrowUpDown className="size-3"/></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading queue...</td></tr>
              ) : paginatedData.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No students found.</td></tr>
              ) : (
                paginatedData.map((app) => (
                  <tr key={app.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-3 font-medium">{app.profiles?.user_code}</td>
                    <td className="p-3">{app.profiles?.full_name}</td>
                    <td className="p-3 text-muted-foreground">{app.profiles?.program} · Batch {app.profiles?.batch}</td>
                    <td className="p-3 text-muted-foreground truncate max-w-[200px]" title={app.thesis_title || ""}>
                      {app.thesis_title || "—"}
                    </td>
                    <td className="p-3">
                      {app.status === "cleared" ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 border border-green-200">
                          Issued
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800 border border-yellow-200">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {app.cleared_at ? new Date(app.cleared_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">
              Showing {(page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, processedData.length)} of {processedData.length} entries
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}