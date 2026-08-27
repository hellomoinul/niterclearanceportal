import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
<<<<<<< HEAD
=======
import { idToEmail } from "@/lib/portal";
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
import { PortalShell } from "@/components/portal-shell";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [{ title: "Profile — NITER" }, { name: "robots", content: "noindex" }],
  }),
  component: ProfilePage,
});

function ProfilePage() {
<<<<<<< HEAD
  const { profile, isRegistrar, isAdmin } = useAuth();
=======
  const { profile, isStudent, isRegistrar, isAdmin } = useAuth();
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c

  return (
    <PortalShell className="max-w-3xl">
      <PageHeader
<<<<<<< HEAD
        title="Student Profile"
=======
        title="My Profile"
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
        back={{
          to: isRegistrar || isAdmin ? "/queue" : "/dashboard",
          label: `Back to ${isRegistrar || isAdmin ? "queue" : "dashboard"}`,
        }}
<<<<<<< HEAD
        breadcrumbs={[{ label: isRegistrar || isAdmin ? "Queue" : "Dashboard", to: isRegistrar || isAdmin ? "/queue" : "/dashboard" }]}
=======
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
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
<<<<<<< HEAD
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
=======
                <span className="font-semibold">{isRegistrar || isAdmin ? "Registrar ID: " : "Student ID: "}</span>
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
                  {isAdmin ? "Admin" : "Accounts"}
                </div>
              )}
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
              <div>
                <span className="font-semibold">Phone: </span>
                {profile.phone || "Not provided"}
              </div>
              <div>
                <span className="font-semibold">Email: </span>
                {profile.personal_email || "Not provided"}
              </div>
              <div className="pt-4 border-t mt-4">
<<<<<<< HEAD
                <span className="font-semibold text-sm">Account ID: </span>
                <span className="text-sm text-muted-foreground">{profile.id}</span>
=======
                <span className="font-semibold text-sm">Account UUID: </span>
                <span className="text-sm text-muted-foreground font-mono">{profile.id}</span>
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
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
