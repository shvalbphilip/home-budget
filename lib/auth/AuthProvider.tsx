'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AUTH_ENABLED } from '@/lib/authConfig';
import { can, Permission, Role } from './permissions';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface AuthContextValue {
  enabled: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: Role;
  isAdmin: boolean;
  projectId: string | null;
  canDelete: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  can: (perm: Permission) => boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(AUTH_ENABLED);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<Role>(AUTH_ENABLED ? null : 'admin');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [canDelete, setCanDelete] = useState<boolean>(!AUTH_ENABLED);

  const loadContext = useCallback(async (uid: string) => {
    // role
    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', uid);
    const globalAdmin = !!roles?.some((r) => r.role === 'admin');

    // profile
    const { data: prof } = await supabase.from('profiles').select('id, full_name, avatar_url').eq('id', uid).single();
    setProfile(prof ?? { id: uid, full_name: null, avatar_url: null });

    // membership → active project + delete grant
    const { data: members } = await supabase
      .from('project_members')
      .select('project_id, role, can_delete')
      .eq('user_id', uid)
      .order('created_at', { ascending: true });
    const first = members?.[0];
    setProjectId(first?.project_id ?? null);
    const projectAdmin = first?.role === 'admin';
    setRole(globalAdmin || projectAdmin ? 'admin' : 'member');
    setCanDelete(globalAdmin || projectAdmin || !!first?.can_delete);
  }, []);

  const refresh = useCallback(async () => {
    if (!AUTH_ENABLED) return;
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    if (data.session?.user) await loadContext(data.session.user.id);
  }, [loadContext]);

  useEffect(() => {
    if (!AUTH_ENABLED) return;
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) await loadContext(data.session.user.id);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess);
      if (sess?.user) await loadContext(sess.user.id);
      else {
        setProfile(null);
        setRole(null);
        setProjectId(null);
        setCanDelete(false);
      }
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [loadContext]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value: AuthContextValue = {
    enabled: AUTH_ENABLED,
    loading,
    session,
    user: session?.user ?? null,
    profile,
    role,
    isAdmin: role === 'admin',
    projectId,
    canDelete,
    signIn,
    signOut,
    can: (perm) => can(perm, { enabled: AUTH_ENABLED, role, canDelete }),
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
