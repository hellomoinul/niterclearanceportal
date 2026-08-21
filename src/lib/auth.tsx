import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "./portal";

export interface PortalProfile {
  id: string;
  user_code: string;
  full_name: string;
  program: string | null;
  batch: string | null;
  registration_no: string | null;
  phone: string | null;
  personal_email: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  present_address: string | null;
  permanent_address: string | null;
  cgpa: number | null;
  credits_completed: number | null;
}

interface AuthValue {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: PortalProfile | null;
  roles: AppRole[];
  isStudent: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDetails = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      setRoles([]);
      return;
    }
    const [{ data: profileRow }, { data: roleRows }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setProfile((profileRow as PortalProfile | null) ?? null);
    setRoles(((roleRows ?? []) as { role: AppRole }[]).map((r) => r.role));
  }, []);

  useEffect(() => {
    let active = true;

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      void loadDetails(nextSession?.user.id).finally(() => setLoading(false));
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      void loadDetails(data.session?.user.id).finally(() => setLoading(false));
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadDetails]);

  const refresh = useCallback(async () => {
    await loadDetails(session?.user.id);
  }, [loadDetails, session?.user.id]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      profile,
      roles,
      isStudent: roles.includes("student"),
      isStaff: roles.includes("staff"),
      isAdmin: roles.includes("admin"),
      refresh,
      signOut,
    }),
    [loading, session, profile, roles, refresh, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
