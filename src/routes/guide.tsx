import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/lib/auth";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "Guide — NITER Clearance Portal" },
      {
        name: "description",
        content:
          "A role-based guide to the NITER clearance portal — how to apply, track and review clearance for students, office staff and admins.",
      },
      { property: "og:title", content: "Guide — NITER Clearance Portal" },
      {
        property: "og:description",
        content: "Step-by-step guide for students, office staff and admins using the NITER clearance portal.",
      },
    ],
  }),
  component: GuidePage,
});

type RoleKey = "student" | "office" | "admin";

const roleTabs: { value: RoleKey; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "office", label: "Office" },
  { value: "admin", label: "Admin" },
];

const studentSteps = [
  {
    title: "Register & sign in",
    body: "Create a student account with your Student ID, full name, email, phone, program and academic year. Sign in with your ID (e.g. CS 2103021), Portal ID or email.",
  },
  {
    title: "Start your application",
    body: "Open the Dashboard and click \u201cStart my application\u201d. Fill in your guardian and address details. One application walks all 10 clearance offices in order.",
  },
  {
    title: "Clear each office in order",
    body: "Offices unlock one at a time, starting with the Laboratory. Open the currently active office card and upload the document it asks for. When it approves, the next office opens.",
  },
  {
    title: "Declare non-applicable offices",
    body: "If an office genuinely doesn't apply to you (for example the Hostel for a day-scholar), mark it Not Applicable and the sequence advances. The final Administration office can never be declared N/A.",
  },
  {
    title: "Fix rejections",
    body: "If an office rejects your section, read the remark, upload a corrected document and the office reviews it again. You have three attempts per office before the case escalates to the Administration office.",
  },
  {
    title: "Get your certificate",
    body: "When all 10 offices approve — including the final Administration sign-off — your certificate is issued automatically. Download the PDF with its QR code, or print it.",
  },
];

const officeSteps = [
  {
    title: "Open your queue",
    body: "Sign in and you\u2019ll land on \u201cMy office\u201d — the single clearance office your account is bound to. You only see students whose review has reached your office.",
  },
  {
    title: "Review documents",
    body: "Each student card shows their name, ID, program, academic year and the uploaded proof documents. Open any document to inspect it.",
  },
  {
    title: "Approve or reject",
    body: "Click Approve to sign off, or Reject with a remark that tells the student exactly what to fix. A rejection remark is mandatory.",
  },
  {
    title: "Bulk approve",
    body: "Select multiple students with the checkboxes and use the bottom action bar to approve several at once.",
  },
];

const adminSteps = [
  {
    title: "Review every office",
    body: "Sign in and you\u2019ll land on the Department queue. Use the office filter to view any single office or all 10 at once.",
  },
  {
    title: "Final sign-off (Administration)",
    body: "The Administration review — the last of the 10 offices — appears in the queue once offices 1\u20139 approve. No document is required; approve it to issue the certificate.",
  },
  {
    title: "Admin dashboard",
    body: "Use the Admin panel for live stats, quick links, and the N/A declarations table. Review N/A claims regularly and revert any false declaration back to pending.",
  },
  {
    title: "Audit & accountability",
    body: "Every decision is written to the audit log with the actor, office, student and remark, so approvals and rejections are fully traceable.",
  },
];

const faqs: Record<RoleKey, { q: string; a: string }[]> = {
  student: [
    {
      q: "Do I have to apply separately to each office?",
      a: "No. One application starts a single, ordered sequence through the 10 clearance offices. Offices unlock one at a time, and you only interact with the currently active office.",
    },
    {
      q: "An office rejected my section. Do I start over?",
      a: "No. Only that section reopens. Read the remark, upload the corrected document and the office reviews it again. Your other approvals stay intact.",
    },
    {
      q: "What files can I upload?",
      a: "JPG, PNG or PDF up to 5 MB per file. Anything else is blocked before upload so it never reaches the review queue.",
    },
    {
      q: "How many times can I re-upload?",
      a: "Three attempts per office. After that the case is escalated to the Administration office so you are not stuck in a rejection loop.",
    },
    {
      q: "When do I get my certificate?",
      a: "The moment the last office approves (including the Administration final sign-off). The certificate is generated automatically with a unique code and QR link, and the admin office is notified.",
    },
    {
      q: "How can an employer check my certificate is genuine?",
      a: "They scan the QR code or enter the certificate code on the public verification page — no login needed.",
    },
  ],
  office: [
    {
      q: "How do I review pending students?",
      a: "Go to your office queue. You'll see pending and rejected students whose review has reached the office bound to your account. Click a student to see their uploaded documents and take action.",
    },
    {
      q: "How do bulk approve and rejection remarks work?",
      a: "Select multiple pending students with the checkboxes, then click 'Approve selected' in the bottom action bar. For rejections, a remark is required — this ensures the student knows exactly what to fix.",
    },
    {
      q: "What happens when I reject a section?",
      a: "The student is notified immediately and the section reopens for re-upload. They have three attempts per office. After that the case escalates automatically to the Administration office.",
    },
    {
      q: "What does 'escalated' mean?",
      a: "When a student exceeds three re-upload attempts, the case is marked escalated. The Administration office handles it from there so you are not stuck in a rejection loop.",
    },
    {
      q: "How is my office queue filtered?",
      a: "The queue shows only students whose review has reached your office. If no students appear, either nobody has applied yet or all pending items are with an earlier office.",
    },
  ],
  admin: [
    {
      q: "How do I see every office at once?",
      a: "Use the office filter \u201cAll offices\u201d in the Department queue to review every department's pending and rejected students from one place.",
    },
    {
      q: "How does the final Administration sign-off work?",
      a: "The Administration review — the 10th office — unlocks automatically once the previous 9 offices approve. No document is required. Approve it to issue the certificate, or reject it with a remark for the student to resubmit.",
    },
    {
      q: "How are N/A declarations handled?",
      a: "Students can declare certain offices not applicable. These are auto-approved at submit and listed in the Admin dashboard's N/A table. Review them regularly and revert any false declaration back to pending.",
    },
    {
      q: "Where is the audit trail?",
      a: "Every approval and rejection is written to the audit log with the actor, office, student and remark. The Admin Dashboard's Audit page reports this data for full accountability.",
    },
  ],
};

function GuidePage() {
  const { session, isOffice, isAdmin } = useAuth();
  const sessionRole: RoleKey = isAdmin ? "admin" : isOffice ? "office" : "student";
  const [role, setRole] = useState<RoleKey>(sessionRole);
  const showTabs = !session;

  const steps = role === "student" ? studentSteps : role === "office" ? officeSteps : adminSteps;

  return (
    <PortalShell className="max-w-3xl">
      <PageHeader
        title="Guide"
        description="How the NITER clearance portal works — a step-by-step walkthrough for your role, plus answers to common questions."
      />

      {showTabs && (
        <div className="card-surface mt-6 p-6">
          <p className="text-sm font-medium text-muted-foreground">View the guide for</p>
          <Tabs value={role} onValueChange={(v) => setRole(v as RoleKey)}>
            <TabsList className="mt-3 grid w-full max-w-sm grid-cols-3">
              {roleTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {roleTabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-2">
                <p className="text-sm text-muted-foreground">
                  Guide for the{" "}
                  <span className="font-semibold text-foreground">{tab.label}</span> role.
                </p>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}

      <div className="card-surface mt-6 p-6">
        <h2 className="text-base font-semibold">What to do, step by step</h2>
        <ol className="mt-4 space-y-4">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {i + 1}
              </span>
              <div>
                <p className="font-medium">{step.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="card-surface mt-6 px-6 py-2">
        <h2 className="py-3 text-base font-semibold">
          Frequently asked questions{role !== "student" ? ` — ${role === "admin" ? "Admin" : "Office"}` : ""}
        </h2>
        <Accordion type="single" collapsible>
          {faqs[role].map((item, index) => (
            <AccordionItem key={item.q} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-sm font-semibold">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </PortalShell>
  );
}
