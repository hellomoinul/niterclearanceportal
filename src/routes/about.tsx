import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal-shell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About the clearance process — NITER" },
      {
        name: "description",
        content:
          "How NITER final-year clearance works: the offices involved, the documents required and the academic calendar deadlines.",
      },
      { property: "og:title", content: "About the clearance process — NITER" },
      {
        property: "og:description",
        content: "The offices, documents and deadlines behind NITER final-year clearance.",
      },
    ],
  }),
  component: AboutPage,
});

const calendar = [
  { label: "Clearance window opens", value: "1 September" },
  { label: "Last date to submit application", value: "30 September" },
  { label: "Department review deadline", value: "15 October" },
  { label: "Certificate collection / transcript release", value: "From 25 October" },
];

function AboutPage() {
  return (
    <PortalShell className="max-w-4xl">
      <h1 className="text-2xl font-semibold">About NITER clearance</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        The National Institute of Textile Engineering and Research requires every final-year student
        to obtain clearance from eight offices before the final transcript and certificate are
        released. This portal replaces the paper-based, office-to-office process with one digital
        application reviewed in parallel by all offices.
      </p>

      <div className="card-surface mt-8 p-6">
        <h2 className="text-lg font-semibold">Academic calendar</h2>
        <ul className="mt-4 divide-y divide-border">
          {calendar.map((row) => (
            <li key={row.label} className="flex justify-between gap-4 py-3 text-sm">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-semibold">{row.value}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card-surface mt-6 p-6">
        <h2 className="text-lg font-semibold">How decisions are recorded</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Every approval or rejection is stored with the staff member's identity and a timestamp in
          an audit log. If an office rejects a section, only that section reopens — the rest of your
          application keeps its approvals. After three rejected re-uploads, the case is escalated to
          the Department Head automatically.
        </p>
      </div>
    </PortalShell>
  );
}
