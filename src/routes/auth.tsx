import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { idToEmail } from "@/lib/portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — NITER Clearance Portal" },
      {
        name: "description",
        content:
          "Sign in to the NITER clearance portal with your student or staff ID to apply for and track final-year clearance.",
      },
      { property: "og:title", content: "Sign in — NITER Clearance Portal" },
      {
        property: "og:description",
        content: "Use your NITER ID and password to access your clearance dashboard.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/dashboard", replace: true });
  }, [session, navigate]);

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const userCode = String(form.get("userCode") ?? "");
    const password = String(form.get("password") ?? "");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: idToEmail(userCode),
      password,
    });
    setBusy(false);
    if (error) {
      toast.error("Sign in failed", { description: "Check your ID and password and try again." });
      return;
    }
    navigate({ to: "/dashboard" });
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const userCode = String(form.get("userCode") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("fullName") ?? "").trim();
    const program = String(form.get("program") ?? "").trim();
    const batch = String(form.get("batch") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: idToEmail(userCode),
      password,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error || !data.user) {
      setBusy(false);
      toast.error("Registration failed", {
        description: error?.message ?? "This ID may already be registered.",
      });
      return;
    }

    const userId = data.user.id;
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      user_code: userCode,
      full_name: fullName,
      program,
      batch,
      phone,
    });
    await supabase.from("user_roles").insert({ user_id: userId, role: "student" });
    setBusy(false);

    if (profileError) {
      toast.error("Profile could not be saved", { description: profileError.message });
      return;
    }
    toast.success("Account created", { description: "Welcome to the clearance portal." });
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <Link to="/" className="mb-6 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-md bg-primary text-primary-foreground">
          <GraduationCap className="size-6" aria-hidden />
        </span>
        <span>
          <span className="block font-display text-base font-semibold">NITER</span>
          <span className="block text-xs text-muted-foreground">Clearance Portal</span>
        </span>
      </Link>

      <div className="card-surface w-full max-w-md p-6">
        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="register">New student</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-5">
            <h1 className="text-lg font-semibold">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Use the same student or staff ID you use for UCAM.
            </p>
            <form className="mt-5 space-y-4" onSubmit={handleSignIn}>
              <div className="space-y-2">
                <Label htmlFor="signin-id">Student / Staff ID/Admin</Label>
                <Input id="signin-id" name="userCode" required placeholder="e.g. 2103021" />
              </div>
              
              {/* --- NEW FORGOT PASSWORD SECTION START --- */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="signin-password">Password</Label>
                  <Link 
                    to="/forgot-password" 
                    className="text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input id="signin-password" name="password" type="password" required />
              </div>
              {/* --- NEW FORGOT PASSWORD SECTION END --- */}

              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="mt-5">
            <h1 className="text-lg font-semibold">Register</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              First time here? Create your portal account with your NITER student ID.
            </p>
            <form className="mt-5 space-y-4" onSubmit={handleRegister}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="reg-id">Student ID</Label>
                  <Input id="reg-id" name="userCode" required placeholder="2103021" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Full name</Label>
                  <Input id="reg-name" name="fullName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-program">Program</Label>
                  <Input id="reg-program" name="program" placeholder="Textile Engineering" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-batch">Batch / session</Label>
                  <Input id="reg-batch" name="batch" placeholder="2021" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-phone">Phone</Label>
                  <Input id="reg-phone" name="phone" placeholder="01XXXXXXXXX" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input id="reg-password" name="password" type="password" required minLength={8} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Creating account…" : "Create account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Staff and Admin accounts are created by the admin office.
      </p>
    </div>
  );
}