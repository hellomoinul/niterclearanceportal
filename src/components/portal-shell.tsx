import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import type { ToOptions } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CalendarDays,
  LogOut,
  Menu,
  Settings,
  User,
  LayoutDashboard,
  FileCheck2,
  Users,
  Workflow,
  History,
  BarChart3,
  ShieldAlert,
  ChevronDown,
} from "lucide-react";
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

type RoutePath = ToOptions["to"];

const publicLinks = [
  { to: "/home", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/calendar", label: "Academic calendar" },
  { to: "/verify", label: "Verify certificate" },
] as const satisfies readonly { to: RoutePath; label: string }[];

const guideLink = { to: "/guide", label: "Guide" } as const satisfies {
  to: RoutePath;
  label: string;
};

export const adminNavGroups = [
  {
    category: "Overview",
    items: [
      { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
      { label: "Reports & Analytics", to: "/admin/reports", icon: BarChart3 },
    ],
  },
  {
    category: "Operations",
    items: [
      { label: "Clearance Queue", to: "/queue", icon: FileCheck2 },
      { label: "Workflows", to: "/admin/workflow", icon: Workflow },
      { label: "Escalations", to: "/admin/escalations", icon: ShieldAlert },
    ],
  },
  {
    category: "Content",
    items: [
      { label: "Notice Board", to: "/admin/notices", icon: Bell },
      { label: "Academic Calendar", to: "/admin/calendar", icon: CalendarDays },
    ],
  },
  {
    category: "Records",
    items: [
      { label: "User Management", to: "/admin/users", icon: Users },
      { label: "Audit Logs", to: "/admin/audit", icon: History },
    ],
  },
  {
    category: "Settings",
    items: [{ label: "System Settings", to: "/admin/settings", icon: Settings }],
  },
] as const satisfies readonly {
  category: string;
  items: readonly { label: string; to: RoutePath; icon: unknown }[];
}[];

function AdminNavGroups({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <nav className="space-y-6">
      {adminNavGroups.map((group) => (
        <div key={group.category} className="space-y-2">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {group.category}
          </h3>
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold hover:bg-primary/90 hover:text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-border bg-card/50 p-4 min-h-[calc(100vh-4rem)] hidden md:block">
      <div className="space-y-6">
        <div className="px-3 py-1">
          <h2 className="text-sm font-bold tracking-tight text-primary uppercase">Admin Panel</h2>
          <p className="text-xs text-muted-foreground">Grouped Management Links</p>
        </div>
        <AdminNavGroups />
      </div>
    </aside>
  );
}

export function MobileAdminNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-6 rounded-lg border border-border bg-card/50 md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span>
          <span className="block text-sm font-bold tracking-tight text-primary uppercase">
            Admin Panel
          </span>
          <span className="block text-xs text-muted-foreground">Grouped Management Links</span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div className="border-t border-border p-4">
          <AdminNavGroups onNavigate={() => setOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}

export function PortalHeader() {
  const { session, profile, isOffice, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
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
        ...(isOffice || isAdmin ? [] : [{ to: "/dashboard", label: "Dashboard" }]),
        ...(isOffice || isAdmin
          ? [{ to: "/queue", label: isAdmin ? "Offices" : "My office" }]
          : []),
        ...(isAdmin ? [{ to: "/admin", label: "Admin control" }] : []),
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
            .filter((link) => (session ? link.to !== "/about" : true))
            .map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "relative rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary after:scale-x-0 after:transition-transform hover:after:scale-x-100",
                  "[&[data-active]]:text-foreground [&[data-active]]:after:scale-x-100",
                )}
                activeOptions={{ exact: link.to === "/home" }}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
                  >
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
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="size-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : location.pathname !== "/auth" ? (
            <Button asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          ) : null}
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

      {open && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)}>
          <nav
            className="animate-in fade-in slide-in-from-top-1 border-t border-border bg-surface px-4 py-2 shadow-lg duration-200 md:hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {[...publicLinks, ...appLinks, guideLink]
              .filter((link) => (session ? link.to !== "/about" : true))
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
                  onClick={() => {
                    setOpen(false);
                    handleSignOut();
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </div>
            ) : null}
          </nav>
        </div>
      )}
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
          <p className="mt-1 text-xs text-gray-500">Savar, Dhaka-1350, Bangladesh</p>
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
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith("/admin");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PortalHeader />
      {isAdminPath ? (
        <div className="mx-auto flex w-full max-w-7xl flex-1">
          <AdminSidebar />
          <main className={cn("flex-1 px-6 py-8 overflow-x-hidden", className)}>
            <MobileAdminNav />
            {children}
          </main>
        </div>
      ) : (
        <main className={cn("mx-auto w-full max-w-6xl flex-1 px-4 py-8", className)}>
          {children}
        </main>
      )}
      <PortalFooter />
    </div>
  );
}
