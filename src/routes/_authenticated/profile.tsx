import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { idToEmail } from "@/lib/portal";
import { PortalShell } from "@/components/portal-shell";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [{ title: "Profile — NITER" }, { name: "robots", content: "noindex" }],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, user, isStudent, isOffice, isAdmin } = useAuth();

  const { data: officeNames } = useQuery({
    enabled: !!user && !isStudent,
    queryKey: ["office-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("office_departments")
        .select("departments(name)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? [])
        .map((row) => row.departments?.name)
        .filter(Boolean) as string[];
    },
  });

  return (
    <PortalShell className="max-w-3xl">
      <PageHeader
        title="My Profile"
        back={{
          to: isOffice || isAdmin ? "/queue" : "/dashboard",
          label: `Back to ${isOffice || isAdmin ? "queue" : "dashboard"}`,
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>My Information</CardTitle>
        </CardHeader>
        <CardContent>
          {profile ? (
            <div className="space-y-4">
              <div>
                <span className="font-semibold">Name: </span>
                {profile.full_name || "Not provided"}
              </div>
              <div>
                <span className="font-semibold">{isOffice || isAdmin ? "Office ID: " : "Student ID: "}</span>
                {profile.user_code || "Not provided"}
              </div>
              <div>
                <span className="font-semibold">Portal ID: </span>
                {profile.user_code ? idToEmail(profile.user_code) : "Not provided"}
              </div>
              {isStudent ? (
                <>
                  <div>
                    <span className="font-semibold">Department: </span>
                    {profile.program || "Not provided"}
                  </div>
                  <div>
                    <span className="font-semibold">Academic year: </span>
                    {profile.batch || "Not provided"}
                  </div>
                </>
              ) : (
                <div>
                  <span className="font-semibold">Role / Office: </span>
                  {isAdmin ? "Admin" : officeNames?.length ? officeNames.join(", ") : "Office"}
                </div>
              )}
              <div>
                <span className="font-semibold">Phone: </span>
                {profile.phone || "Not provided"}
              </div>
              <div>
                <span className="font-semibold">Email: </span>
                {profile.personal_email || "Not provided"}
              </div>
              <div className="pt-4 border-t mt-4">
                <span className="font-semibold text-sm">Account UUID: </span>
                <span className="text-sm text-muted-foreground font-mono">{profile.id}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Could not load user data. Are you logged in?
            </p>
          )}
        </CardContent>
      </Card>
    </PortalShell>
  );
}
