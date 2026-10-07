import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Building2, FileCheck2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
  const { session, profile, isStudent, isOffice, isAdmin } = useAuth();
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
        .select("id, title, content, created_at, target_audience")
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Office users need to know which offices they belong to, so an
  // "Office: Library" notice never leaks to other offices (e.g. Laboratory).
  const { data: myOfficeNames } = useQuery({
    enabled: !!session?.user && isOffice && !isAdmin,
    queryKey: ["my-office-names", session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("office_departments")
        .select("departments(name)")
        .eq("user_id", session!.user.id);
      if (error) throw error;
      return (data ?? [])
        .map((row) => row.departments?.name)
        .filter((name): name is string => Boolean(name));
    },
  });

  const visibleNotices = (notices ?? [])
    .filter((notice) => {
      const raw = (notice.target_audience || "All").trim();
      const audience = raw.toLowerCase();
      if (audience === "all") return true;
      if (isAdmin) return true;
      if (audience === "students") return isStudent;
      if (audience.startsWith("office")) {
        // Only staff bound to that exact office (never guests or students).
        if (!isOffice || !myOfficeNames) return false;
        const target = audience.replace(/^office:?\s*/, "");
        return myOfficeNames.some((name) => name.trim().toLowerCase() === target);
      }
      if (audience.startsWith("batch:")) {
        // Only students of that exact batch.
        if (!isStudent || !profile?.batch) return false;
        return profile.batch.trim().toLowerCase() === audience.slice("batch:".length).trim();
      }
      return false;
    })
    .slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto">
      <section className="hero-surface hero-fade-in overflow-hidden rounded-3xl px-6 py-12 shadow-raised transition-shadow duration-300 hover:shadow-lg sm:px-10 sm:py-16">
        <p className="text-xs font-semibold tracking-[0.18em] uppercase opacity-80">
          National Institute of Textile Engineering and Research
        </p>
        <h1 className="mt-4 max-w-2xl text-3xl font-semibold font-display text-white sm:text-4xl">
          Final-year clearance, without walking to ten offices
        </h1>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-3 justify-items-center">
        {steps.map((step) => (
          <div key={step.title} className="card-surface p-5">
            <step.icon className="size-5 text-primary" aria-hidden />
            <h2 className="mt-3 text-base font-semibold">{step.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="card-surface p-6">
          <h2 className="text-lg font-semibold">
            <span className="hero-surface notice-blink inline-block rounded-md px-2.5 py-1 shadow-sm">
              Latest notices
            </span>
          </h2>
          {visibleNotices.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No notices published yet.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {visibleNotices.map((notice) => (
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
      </section>
    </div>
  );
}
