import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/portal-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Academic calendar — NITER" },
      {
        name: "description",
        content:
          "NITER academic calendar deadlines for final-year clearance: application window, review deadlines and certificate collection.",
      },
      { property: "og:title", content: "Academic calendar — NITER" },
      {
        property: "og:description",
        content: "Key clearance dates for NITER final-year students.",
      },
    ],
  }),
  component: CalendarPage,
});

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string | null;
  start_date: string;
  end_date: string;
  target_audience: string | null;
}

interface EventGroup {
  key: string;
  label: string;
  events: CalendarEvent[];
}

function parseLocalDate(value: string): Date {
  const parts = value.split("-").map(Number);
  const [y, m, d] = parts;
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
}

function monthLabel(date: Date): string {
  return date.toLocaleString("en-GB", { month: "long", year: "numeric" });
}

/** "1 Sep 2026", "1-15 Sep 2026" or "30 Sep - 2 Oct 2026" for multi-day events. */
function formatDateRange(start: string, end: string): string {
  const s = parseLocalDate(start);
  const e = parseLocalDate(end);
  const day = (d: Date) => d.getDate();
  const monthShort = (d: Date) => d.toLocaleString("en-GB", { month: "short" });
  const year = (d: Date) => d.getFullYear();

  if (s.getTime() === e.getTime()) return `${day(s)} ${monthShort(s)} ${year(s)}`;
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${day(s)}-${day(e)} ${monthShort(e)} ${year(e)}`;
  }
  if (s.getFullYear() === e.getFullYear()) {
    return `${day(s)} ${monthShort(s)} - ${day(e)} ${monthShort(e)} ${year(e)}`;
  }
  return `${day(s)} ${monthShort(s)} ${year(s)} - ${day(e)} ${monthShort(e)} ${year(e)}`;
}

function groupByMonth(events: CalendarEvent[]): EventGroup[] {
  const groups = new Map<string, EventGroup>();
  for (const ev of events) {
    const d = parseLocalDate(ev.start_date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!groups.has(key)) {
      groups.set(key, { key, label: monthLabel(d), events: [] });
    }
    groups.get(key)!.events.push(ev);
  }
  return [...groups.values()];
}

function CalendarPage() {
  const {
    data: events,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["calendar-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("id, title, description, event_type, start_date, end_date, target_audience")
        .order("start_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CalendarEvent[];
    },
  });

  const groups = groupByMonth(events ?? []);

  return (
    <PortalShell className="max-w-3xl">
      <PageHeader
        title="Academic calendar"
        description="Key dates for the final-year clearance cycle."
      />

      <div className="card-surface mt-8 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <CalendarDays className="size-5 text-primary" aria-hidden /> Clearance schedule
        </h2>

        {isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading academic calendar…</p>
        ) : isError ? (
          <p className="mt-4 text-sm text-muted-foreground">
            We could not load the academic calendar right now. Please try again later.
          </p>
        ) : groups.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No academic events published yet.</p>
        ) : (
          groups.map((group) => (
            <section key={group.key} className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </h3>
              <ul className="mt-2 divide-y divide-border">
                {group.events.map((event) => (
                  <li key={event.id} className="py-3">
                    <div className="flex justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{event.title}</p>
                        {event.event_type ? (
                          <Badge variant="outline" className="mt-1">
                            {event.event_type}
                          </Badge>
                        ) : null}
                        {event.description ? (
                          <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-sm font-semibold">
                        {formatDateRange(event.start_date, event.end_date)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </PortalShell>
  );
}
