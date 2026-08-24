import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { idToEmail } from "@/lib/portal";
import { DEPARTMENTS, academicYears } from "@/lib/departments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — NITER Clearance Portal" },
      {
        name: "description",
        content:
          "Sign in to the NITER clearance portal with your student or registrar ID to apply for and track final-year clearance.",
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

    let email: string;
    if (userCode.includes("@")) {
      email = userCode.trim();
    } else {
      // Lookup real email via RPC; fall back to synthetic for legacy accounts
      const { data: rpcEmail } = await supabase.rpc("login_email_for_user_code", {
        p_user_code: userCode.trim(),
      });
      email = (typeof rpcEmail === "string" && rpcEmail) || idToEmail(userCode);
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
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
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "").trim();
    const fullName = String(form.get("fullName") ?? "").trim();
    const program = String(form.get("program") ?? "").trim();
    const session = String(form.get("session") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();

    if (password !== confirmPassword) {
      setBusy(false);
      toast.error("Passwords do not match", {
        description: "Please enter the same password in both fields.",
      });
      return;
    }

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error || !data.user) {
      setBusy(false);
      toast.error("Registration failed", {
        description: error?.message ?? "This email may already be registered.",
      });
      return;
    }

    const userId = data.user.id;
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      user_code: userCode,
      personal_email: email,
      full_name: fullName,
      program,
      batch: session,
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
            <p className="text-center text-sm text-muted-foreground">
              Universal sign in page for Students, Admin, Registrar.
            </p>
            <form className="mt-5 space-y-4" onSubmit={handleSignIn}>
              <div className="space-y-2">
                <Label htmlFor="signin-id">Student/Admin/Registrar - ID or Email</Label>
                <Input id="signin-id" name="userCode" required placeholder="CS 2103021" />
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
                  <Input id="reg-id" name="userCode" required placeholder="CS 2103021" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Full name</Label>
                  <Input id="reg-name" name="fullName" required placeholder="CAPITAL BLOCK LETTER" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input id="reg-email" name="email" type="email" required placeholder="you@email.com" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="reg-program">Program</Label>
                  <Select
                    name="program"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="reg-session">Academic year</Label>
                  <Select
                    name="session"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears().map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-phone">Phone</Label>
                  <Input id="reg-phone" name="phone" placeholder="01XXXXXXXXX" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input
                    id="reg-password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-confirm-password">Confirm password</Label>
                  <Input
                    id="reg-confirm-password"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Passwords must match
                  </p>
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
        Registrar and Admin accounts are created by the admin office.
      </p>
    </div>
  );
}