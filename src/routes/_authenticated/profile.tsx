import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { PortalShell } from "@/components/portal-shell";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [{ title: "Profile — NITER" }, { name: "robots", content: "noindex" }],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, isRegistrar, isAdmin } = useAuth();

  return (
    <PortalShell className="max-w-3xl">
      <PageHeader
        title="Student Profile"
        back={{
          to: isRegistrar || isAdmin ? "/queue" : "/dashboard",
          label: `Back to ${isRegistrar || isAdmin ? "queue" : "dashboard"}`,
        }}
        breadcrumbs={[{ label: isRegistrar || isAdmin ? "Queue" : "Dashboard", to: isRegistrar || isAdmin ? "/queue" : "/dashboard" }]}
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
                <span className="font-semibold">Student ID: </span>
                {profile.user_code || "Not provided"}
              </div>
              <div>
                <span className="font-semibold">Department: </span>
                {profile.program || "Not provided"}
              </div>
              <div>
                <span className="font-semibold">Session: </span>
                {profile.batch || "Not provided"}
              </div>
              <div>
                <span className="font-semibold">Phone: </span>
                {profile.phone || "Not provided"}
              </div>
              <div>
                <span className="font-semibold">Email: </span>
                {profile.personal_email || "Not provided"}
              </div>
              <div className="pt-4 border-t mt-4">
                <span className="font-semibold text-sm">Account ID: </span>
                <span className="text-sm text-muted-foreground">{profile.id}</span>
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
