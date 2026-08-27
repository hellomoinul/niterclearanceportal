import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, LogOut, Menu, Settings, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const publicLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/calendar", label: "Academic calendar" },
  { to: "/verify", label: "Verify certificate" },
] as const;

const guideLink = { to: "/guide", label: "Guide" } as const;

export function PortalHeader() {
  const { session, profile, isRegistrar, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: async () => {
      if (!session?.user) return 0;
      try {
        const { count } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", session.user.id)
          .eq("is_read", false)
          .is("deleted_at", null);
        return count ?? 0;
      } catch {
        return 0;
      }
    },
    enabled: !!session?.user,
    refetchInterval: 30_000,
    retry: false,
  });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  const appLinks = session
    ? [
        ...(isRegistrar || isAdmin ? [] : [{ to: "/dashboard", label: "Dashboard" }]),
        ...(isRegistrar || isAdmin ? [{ to: "/queue", label: isAdmin ? "Department queue" : "Accounts queue" }] : []),
        ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
      ]
    : [];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-3">
          <img src="/niterLogo.png" alt="NITER crest" className="h-10 w-10 rounded-sm" />
          <span className="leading-tight">
            <span className="block font-display text-base font-bold text-primary">NITER</span>
            <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Clearance Portal
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {[...publicLinks, ...appLinks, guideLink]
            .filter((link) => session ? link.to !== "/about" : true)
            .map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "relative rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary after:scale-x-0 after:transition-transform hover:after:scale-x-100",
                "[&[data-active]]:text-foreground [&[data-active]]:after:scale-x-100",
              )}
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
                <Link to="/notifications" className="relative">
                  <Bell className="size-4 transition-transform duration-200 hover:scale-110" />
                  {unreadCount > 0 && (
                    <span className="notification-badge absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground shadow-sm">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex">
                    <User className="size-4" />
                    {profile?.user_code ?? "Account"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8}>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="size-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <Settings className="size-4" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="size-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
        <nav className="animate-in fade-in slide-in-from-top-1 border-t border-border bg-surface px-4 py-2 duration-200 md:hidden">
          {[...publicLinks, ...appLinks, guideLink]
            .filter((link) => session ? link.to !== "/about" : true)
            .map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          {session ? (
            <div className="mt-2 border-t border-border pt-2">
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <User className="size-4" />
                {profile?.user_code ?? "Profile"}
              </Link>
              <Link
                to="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <Settings className="size-4" />
                Settings
              </Link>
              <button
                onClick={() => { setOpen(false); handleSignOut(); }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          ) : null}
        </nav>
      ) : null}
    </header>
  );
}

export function PortalFooter() {
  return (
    <footer className="mt-16 border-t border-[#07172B]/10 bg-[#07172B]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 text-sm text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-base font-semibold text-white">
            National Institute of Textile Engineering and Research
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Savar, Dhaka-1350, Bangladesh
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} NITER. All rights reserved.
          </p>
        </div>
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
