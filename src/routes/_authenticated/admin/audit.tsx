import { useState, useEffect, useMemo, Fragment } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronUp, History, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
  },
  component: AuditLogPage,
});

interface AuditEntry {
  id: string | number;
  action: string;
  actor_id: string | null;
  actor_name: string | null;
  entity: string | null;
  entity_id: string | null;
  details: string | Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

const PAGE_SIZE = 25;
const ACTION_SCAN_LIMIT = 5000;

const dayStartIso = (value: string) => new Date(`${value}T00:00:00`).toISOString();
const dayEndIso = (value: string) => new Date(`${value}T23:59:59.999`).toISOString();

const humanizeAction = (action: string) =>
  action.replace(/[_.]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

type ActionTone = "approved" | "rejected" | "created" | "updated" | "neutral";

const actionTone = (action: string): ActionTone => {
  const a = action.toLowerCase();
  if (/(rejected|deleted|removed|deactivat)/.test(a)) return "rejected";
  if (/(approved|resolved|activat)/.test(a)) return "approved";
  if (/(created|added)/.test(a)) return "created";
  if (/(updated|edited|changed|reset)/.test(a)) return "updated";
  return "neutral";
};

const toneClassName: Record<ActionTone, string> = {
  approved: "border-transparent bg-approved text-approved-foreground hover:bg-approved/80",
  rejected: "",
  created:
    "border-transparent bg-sky-100 text-sky-700 hover:bg-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:hover:bg-sky-900",
  updated: "border-transparent bg-pending text-pending-foreground hover:bg-pending/80",
  neutral: "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
};

const ENTITY_LINKS: Record<string, string> = {
  notices: "/admin/notices",
  users: "/admin/users",
  profile: "/admin/users",
  department_review: "/queue",
  department: "/admin/workflow",
};

type ParsedDetails = Record<string, unknown> | string;

const parseDetails = (details: AuditEntry["details"]): ParsedDetails | null => {
  if (details === null || details === undefined) return null;
  if (typeof details !== "string") return details;
  const trimmed = details.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
      return trimmed;
    } catch {
      return trimmed;
    }
  }
  return trimmed;
};

const rawDetails = (parsed: ParsedDetails): string =>
  typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2);

const asText = (value: unknown): string | null =>
  typeof value === "string" || typeof value === "number" ? String(value) : null;

const humanizeKey = (key: string) =>
  key.replace(/_+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const summarizeDetails = (log: AuditEntry, parsed: ParsedDetails): string => {
  if (typeof parsed === "string") return parsed;

  const title = asText(parsed["title"]);
  if (log.entity === "notices" && title) {
    const audience = asText(parsed["target_audience"]);
    return audience ? `${title} · ${audience}` : title;
  }

  if (log.action === "user_password_reset") {
    const code = asText(parsed["target_user_code"]) ?? "";
    const email = asText(parsed["target_email"]) ?? "";
    if (code && email && email !== "N/A") return `${code} · ${email}`;
    return code || email || "Password reset";
  }

  const parts = Object.entries(parsed)
    .filter(
      ([key, value]) =>
        !key.endsWith("_by") && value !== null && value !== undefined && value !== "",
    )
    .map(
      ([key, value]) =>
        `${humanizeKey(key)}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`,
    );
  return parts.length > 0 ? parts.join(" · ") : JSON.stringify(parsed);
};

const relativeTime = (iso: string): string => {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const dayLabel = (iso: string): string => {
  const date = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const that = new Date(date);
  that.setHours(0, 0, 0, 0);
  const days = Math.round((today.getTime() - that.getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [actionOptions, setActionOptions] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchAuditLogs();
  }, [page, actionFilter, search, dateFrom, dateTo]);

  useEffect(() => {
    fetchActionOptions();
  }, []);

  const fetchAuditLogs = async () => {
    setLoading(true);
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    let query = supabase
      .from("audit_log")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(start, end);

    if (actionFilter !== "all") {
      query = query.eq("action", actionFilter);
    }

    if (search.trim()) {
      query = query.ilike("actor_name", `%${search.trim()}%`);
    }

    if (dateFrom) {
      query = query.gte("created_at", dayStartIso(dateFrom));
    }

    if (dateTo) {
      query = query.lte("created_at", dayEndIso(dateTo));
    }

    const { data, count, error } = await query;

    if (!error && data) {
      setLogs(data);
      setTotalCount(count ?? 0);
    }
    setLoading(false);
  };

  const fetchActionOptions = async () => {
    const { data, error } = await supabase
      .from("audit_log")
      .select("action")
      .order("action", { ascending: true })
      .limit(ACTION_SCAN_LIMIT);

    if (error || !data) return;

    const unique = new Set<string>();
    for (const row of data) {
      if (row.action) unique.add(row.action);
    }
    setActionOptions([...unique].sort((a, b) => a.localeCompare(b)));
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  const detailsById = useMemo(() => {
    const map = new Map<string, { summary: string; raw: string } | null>();
    for (const log of logs) {
      const parsed = parseDetails(log.details);
      map.set(
        String(log.id),
        parsed === null
          ? null
          : { summary: summarizeDetails(log, parsed), raw: rawDetails(parsed) },
      );
    }
    return map;
  }, [logs]);

  const logGroups = useMemo(() => {
    const groups: { key: string; label: string; logs: AuditEntry[] }[] = [];
    for (const log of logs) {
      const date = new Date(log.created_at);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const last = groups[groups.length - 1];
      if (last && last.key === key) {
        last.logs.push(log);
      } else {
        groups.push({ key, label: dayLabel(log.created_at), logs: [log] });
      }
    }
    return groups;
  }, [logs]);

  const hasFilters = Boolean(dateFrom || dateTo || search.trim() || actionFilter !== "all");
  const hasExpandableRows = [...detailsById.values()].some((value) => value !== null);
  const allExpanded = logs.length > 0 && logs.every((log) => expanded[String(log.id)]);

  const toggleDetails = (id: string | number) => {
    const key = String(id);
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllDetails = () => {
    if (allExpanded) {
      setExpanded({});
      return;
    }
    setExpanded(Object.fromEntries(logs.map((log) => [String(log.id), true])));
  };

  const clearFilters = () => {
    setSearch("");
    setActionFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const renderEntity = (entity: string | null, entityId: string | null) => {
    if (!entity && !entityId) return "N/A";
    const entityName = entity || "unknown";
    if (!entityId) return entityName;

    const shortId = entityId.length >= 8 ? entityId.substring(0, 8) : entityId;
    const linkTo = entity ? ENTITY_LINKS[entity] : undefined;
    return (
      <span className="whitespace-nowrap">
        {entityName} ·{" "}
        {linkTo ? (
          <Link
            to={linkTo}
            title={`Open ${entityName} (${entityId})`}
            className="font-semibold text-foreground underline decoration-dotted underline-offset-2 transition-colors hover:text-primary"
          >
            {shortId}
          </Link>
        ) : (
          <span
            title={entityId}
            className="cursor-help font-semibold underline decoration-dotted underline-offset-2"
          >
            {shortId}
          </span>
        )}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <History className="w-7 h-7 text-primary" /> System Audit Log
          </h1>
          <p className="text-muted-foreground text-sm">
            Read-only record of all activity and operations performed across the system.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by actor name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8"
            />
          </div>

          <Select
            value={actionFilter}
            onValueChange={(val) => {
              setActionFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Action Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actionOptions.map((action) => (
                <SelectItem key={action} value={action}>
                  {humanizeAction(action)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="auditDateFrom" className="text-xs text-muted-foreground">
            From
          </Label>
          <Input
            id="auditDateFrom"
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-44"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="auditDateTo" className="text-xs text-muted-foreground">
            To
          </Label>
          <Input
            id="auditDateTo"
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-44"
          />
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          disabled={!hasFilters}
          className="h-9 text-muted-foreground"
        >
          Clear filters
        </Button>
      </div>

      <div className="border rounded-lg bg-card shadow-sm [&>div]:max-h-[75vh] [&>div]:overflow-auto">
        <Table>
          <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-30 [&_th]:bg-card">
            <TableRow className="hover:bg-transparent">
              <TableHead>Time</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  Details
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleAllDetails}
                    disabled={!hasExpandableRows}
                    className="h-6 px-2 text-xs text-muted-foreground"
                  >
                    {allExpanded ? "Collapse all" : "Expand all"}
                  </Button>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Loading audit logs...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No audit logs found.
                </TableCell>
              </TableRow>
            ) : (
              logGroups.map((group) => (
                <Fragment key={group.key}>
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={5}
                      className="sticky top-10 z-20 border-b bg-muted/95 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur"
                    >
                      {group.label}
                    </TableCell>
                  </TableRow>
                  {group.logs.map((log) => {
                    const key = String(log.id);
                    const details = detailsById.get(key) ?? null;
                    const isExpanded = Boolean(expanded[key]) && details !== null;
                    const exactTime = new Date(log.created_at).toLocaleString("en-GB");
                    const actorLabel = log.actor_name || "System / Unknown";
                    const tone = actionTone(log.action);

                    return (
                      <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell
                          className="whitespace-nowrap text-xs text-muted-foreground"
                          title={exactTime}
                        >
                          {relativeTime(log.created_at)}
                        </TableCell>
                        <TableCell className="font-medium">
                          <span className="block max-w-[160px] truncate" title={actorLabel}>
                            {actorLabel}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={tone === "rejected" ? "destructive" : "outline"}
                            className={toneClassName[tone]}
                          >
                            {humanizeAction(log.action)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {renderEntity(log.entity, log.entity_id)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground align-top">
                          {details === null ? (
                            "-"
                          ) : (
                            <>
                              {isExpanded ? (
                                <pre className="max-w-sm whitespace-pre-wrap break-words rounded bg-muted/40 p-2 font-mono">
                                  {details.raw}
                                </pre>
                              ) : (
                                <span className="block max-w-xs truncate" title={details.summary}>
                                  {details.summary}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => toggleDetails(log.id)}
                                aria-expanded={isExpanded}
                                className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-foreground/70 hover:text-foreground transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-3 w-3" />
                                ) : (
                                  <ChevronDown className="h-3 w-3" />
                                )}
                                {isExpanded ? "Collapse" : "Expand"}
                              </button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Page {page} of {totalPages} ({totalCount} total entries)
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
