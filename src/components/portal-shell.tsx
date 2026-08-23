import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, GraduationCap, LogOut, Menu, Settings } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const publicLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/verify", label: "Verify certificate" },
  { to: "/faq", label: "FAQ" },
] as const;

export function PortalHeader() {
  const { session, profile, isStaff, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  const appLinks = session
    ? [
        { to: "/dashboard", label: "Dashboard" },
        ...(isStaff || isAdmin ? [{ to: "/queue", label: "Department queue" }] : []),
        ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
      ]
    : [];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <GraduationCap className="size-5" aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-sm font-semibold">NITER</span>
            <span className="block text-xs text-muted-foreground">Clearance Portal</span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {[...publicLinks, ...appLinks].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
              activeOptions={{ exact: link.to === "/" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-2">
          {session ? (
            <>
              <Button asChild variant="ghost" size="icon" aria-label="Notifications">
                <Link to="/notifications">
                  <Bell className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="icon" aria-label="Settings">
                <Link to="/settings">
                  <Settings className="size-4" />
                </Link>
              </Button>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                <Link to="/profile" className="hover:text-foreground transition-colors">
                  {profile?.user_code ?? "Account"}
                </Link>
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="size-4" /> Sign out
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <Menu className="size-4" />
          </Button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-border bg-surface px-4 py-2 md:hidden">
          {[...publicLinks, ...appLinks].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

export function PortalFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>National Institute of Textile Engineering and Research, Savar, Dhaka.</p>
        <p>
          © {new Date().getFullYear()} All
          rights reserved.
        </p>
      </div>
    </footer>
  );
}

export function PortalShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PortalHeader />
      <main className={cn("mx-auto w-full max-w-6xl flex-1 px-4 py-8", className)}>{children}</main>
      <PortalFooter />
    </div>
  );
}
