import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal-shell";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/lib/auth";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Clearance FAQ — NITER Clearance Portal" },
      {
        name: "description",
        content:
          "Answers to common NITER clearance questions: rejected sections, file formats, hostel dues, library fines and certificate verification.",
      },
      { property: "og:title", content: "Clearance FAQ — NITER Clearance Portal" },
      {
        property: "og:description",
        content: "Common questions about applying for and tracking NITER final-year clearance.",
      },
    ],
  }),
  component: FaqPage,
});

const studentFaqs = [
  {
    q: "Do I have to apply separately to each office?",
    a: "No. One application is sent to every required office at the same time. You only interact with an individual office if it rejects your section.",
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
    a: "Three attempts per office. After that the case is escalated to the Department Head so you are not stuck in a rejection loop.",
  },
  {
    q: "When do I get my certificate?",
    a: "The moment the last office approves. The certificate is generated automatically with a unique code and QR link, and the admin office is notified.",
  },
  {
    q: "How can an employer check my certificate is genuine?",
    a: "They scan the QR code or enter the certificate code on the public verification page — no login needed.",
  },
];

const staffFaqs = [
  {
    q: "How do I review pending students?",
    a: "Go to Department Queue. You'll see pending and rejected students filtered to the department(s) assigned to your account. Click a student to see their uploaded documents and take action.",
  },
  {
    q: "How do bulk approve and rejection remarks work?",
    a: "Select multiple pending students with the checkboxes, then click 'Approve selected' in the bottom action bar. For rejections, a remark is required — this ensures the student knows exactly what to fix.",
  },
  {
    q: "What happens when I reject a section?",
    a: "The student is notified immediately and the section reopens for re-upload. They have three attempts per office. After that the case escalates automatically to the Department Head.",
  },
  {
    q: "What does 'escalated' mean?",
    a: "When a student exceeds three re-upload attempts, the case is marked escalated. The Department Head handles it from there so you are not stuck in a rejection loop.",
  },
  {
    q: "How is the department queue filtered?",
    a: "The queue shows only students whose application includes your assigned department. If no students appear, either nobody has applied yet or all pending items are with a different department.",
  },
];

function FaqPage() {
  const { isStaff, isAdmin } = useAuth();
  const faqs = isStaff || isAdmin ? staffFaqs : studentFaqs;

  return (
    <PortalShell className="max-w-3xl">
      <PageHeader
        title="Frequently asked questions"
        description={
          isStaff || isAdmin
            ? "How the clearance queue and review process work."
            : "Common questions about applying for and tracking NITER final-year clearance."
        }
      />
      <div className="card-surface mt-6 px-6 py-2">
        <Accordion type="single" collapsible>
          {faqs.map((item, index) => (
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
