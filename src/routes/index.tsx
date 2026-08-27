import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Building2, FileCheck2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NITER Clearance Portal — Final-Year Student Clearance" },
      {
        name: "description",
        content:
          "Apply once and track clearance from Accounts, Hostel, Library, Security, Lab and your department head — then download a verifiable NITER clearance certificate.",
      },
      { property: "og:title", content: "NITER Clearance Portal" },
      {
        property: "og:description",
        content:
          "One digital application, real-time department approvals and a QR-verifiable clearance certificate for NITER final-year students.",
      },
    ],
  }),
  component: HomePage,
});

const notices = [
  {
<<<<<<< HEAD
    title: "Clearance window for Batch 2021 is open",
=======
    title: "Clearance window for Academic year 2021 is open",
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
    body: "Final-year students of all programs may submit their clearance application until 30 September.",
  },
  {
    title: "Library fine desk timing changed",
    body: "The Library no-dues desk now operates 10:00–15:00 on working days.",
  },
  {
    title: "Hostel vacate receipts go digital",
    body: "Upload your room vacate receipt directly in the Hostel section — no office visit required.",
  },
];

const steps = [
  {
    icon: FileCheck2,
    title: "Apply once",
    body: "A single form fans out to every required office automatically.",
  },
  {
    icon: Building2,
    title: "Parallel review",
    body: "All eight offices review at the same time, so one slow desk cannot block the rest.",
  },
  {
    icon: BadgeCheck,
    title: "Auto certificate",
    body: "When every office approves, your certificate is issued instantly with a QR code.",
  },
];

function HomePage() {
  const { session } = useAuth();
  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("id, code, name, requirement")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <PortalShell className="max-w-6xl">
<<<<<<< HEAD
      <section className="hero-surface overflow-hidden rounded-xl px-6 py-12 shadow-raised sm:px-10 sm:py-16">
        <p className="text-xs font-semibold tracking-[0.18em] uppercase opacity-80">
          National Institute of Textile Engineering and Research
        </p>
        <h1 className="mt-4 max-w-2xl text-3xl font-semibold font-display text-white sm:text-4xl">
          Final-year clearance, without walking to eight offices
        </h1>
        <p className="mt-4 max-w-xl text-sm opacity-90 sm:text-base">
          Apply once with your NITER student ID, upload your proof documents, and watch every
          department's approval land in real time — ending in a verifiable clearance certificate.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" variant="secondary">
            <Link to={session ? "/dashboard" : "/auth"}>
              {session ? "Open my dashboard" : "Sign in with student ID"}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="bg-white/70 border-[#07172B]/30 text-[#07172B] hover:bg-white/90"
          >
            <Link to="/verify">
              <ShieldCheck className="size-4" /> Verify a certificate
            </Link>
          </Button>
        </div>
=======
      <section className="hero-surface hero-fade-in overflow-hidden rounded-xl px-6 py-12 shadow-raised transition-shadow duration-300 hover:shadow-lg sm:px-10 sm:py-16">
        <p className="text-xs font-semibold tracking-[0.18em] uppercase opacity-80">
          National Institute of Textile Engineering and Research
        </p>
<h1 className="mt-4 max-w-2xl text-3xl font-semibold font-display text-white sm:text-4xl">
          Final-year clearance, without walking to eight offices
        </h1>
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        {steps.map((step) => (
          <div key={step.title} className="card-surface p-5">
            <step.icon className="size-5 text-primary" aria-hidden />
            <h2 className="mt-3 text-base font-semibold">{step.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card-surface p-6">
          <h2 className="text-lg font-semibold">Offices in the clearance workflow</h2>
          <ul className="mt-4 divide-y divide-border">
            {(departments ?? []).map((dept) => (
              <li key={dept.id} className="py-3">
                <p className="text-sm font-semibold">{dept.name}</p>
                <p className="text-sm text-muted-foreground">{dept.requirement}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-surface p-6">
          <h2 className="text-lg font-semibold">Latest notices</h2>
          <ul className="mt-4 space-y-4">
            {notices.map((notice) => (
              <li key={notice.title}>
                <p className="text-sm font-semibold">{notice.title}</p>
                <p className="text-sm text-muted-foreground">{notice.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </PortalShell>
  );
}
