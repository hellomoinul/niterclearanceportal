import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal-shell";
import { PageHeader } from "@/components/page-header";

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

const calendar = [
  { label: "Clearance window opens", value: "1 September" },
  { label: "Last date to submit application", value: "30 September" },
  { label: "Department review deadline", value: "15 October" },
  { label: "Certificate collection / transcript release", value: "From 25 October" },
];

function CalendarPage() {
  return (
    <PortalShell className="max-w-3xl">
      <PageHeader
        title="Academic calendar"
        description="Key dates for the final-year clearance cycle."
      />

      <div className="card-surface mt-8 p-6">
        <h2 className="text-lg font-semibold">Clearance schedule</h2>
        <ul className="mt-4 divide-y divide-border">
          {calendar.map((row) => (
            <li key={row.label} className="flex justify-between gap-4 py-3 text-sm">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-semibold">{row.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </PortalShell>
  );
}
