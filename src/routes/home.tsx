import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Building2, FileCheck2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "NITER Clearance Portal — Final-Year Student Clearance" },
      {
        name: "description",
        content:
          "Apply once and track clearance through every office — then download a verifiable NITER clearance certificate.",
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

const steps = [
  {
    icon: FileCheck2,
    title: "Apply once",
    body: "A single form fans out to every required office automatically.",
  },
  {
    icon: Building2,
    title: "Strict sequential review",
    body: "All ten offices review your file in strict order — each one unlocks only after the previous office approves.",
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

  const { data: notices } = useQuery({
    queryKey: ["notices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("id, title, content, created_at")
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <PortalShell className="max-w-6xl">
      <section className="hero-surface hero-fade-in overflow-hidden rounded-xl px-6 py-12 shadow-raised transition-shadow duration-300 hover:shadow-lg sm:px-10 sm:py-16">
        <p className="text-xs font-semibold tracking-[0.18em] uppercase opacity-80">
          National Institute of Textile Engineering and Research
        </p>
<h1 className="mt-4 max-w-2xl text-3xl font-semibold font-display text-white sm:text-4xl">
          Final-year clearance, without walking to ten offices
        </h1>
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
          {(notices ?? []).length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No notices published yet.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {notices!.map((notice) => (
                <li key={notice.id}>
                  <p className="text-sm font-semibold">{notice.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{notice.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(notice.created_at).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </PortalShell>
  );
}