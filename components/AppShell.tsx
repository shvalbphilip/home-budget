'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth/AuthProvider';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

function Spinner({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-stone-500 text-sm font-medium">{label}</p>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { onboardingComplete, loaded, loadFromDB } = useStore();
  const { enabled, loading: authLoading, session } = useAuth();
  const router = useRouter();
  const path = usePathname();

  // Load this user's data once we know who they are (so the JWT scopes the rows).
  // When auth is disabled, load immediately.
  const userId = session?.user?.id ?? null;
  useEffect(() => {
    if (!enabled || userId) loadFromDB();
  }, [enabled, userId]);

  // Auth gating (only active when NEXT_PUBLIC_AUTH_ENABLED=true).
  // /login and /auth/callback must NOT be bounced — the callback needs to run
  // so it can exchange the Google OAuth code for a session.
  useEffect(() => {
    if (!enabled || authLoading) return;
    const open = path === '/login' || path === '/auth/callback';
    if (!session && !open) router.replace('/login');
    if (session && path === '/login') router.replace('/dashboard');
  }, [enabled, authLoading, session, path, router]);

  // Onboarding redirect (existing behaviour)
  useEffect(() => {
    if (!loaded) return;
    if (enabled && !session) return; // wait until authenticated
    if (!onboardingComplete && path !== '/onboarding') router.replace('/onboarding');
    if (onboardingComplete && path === '/onboarding') router.replace('/dashboard');
  }, [loaded, onboardingComplete, path, router, enabled, session]);

  // Login + OAuth callback render bare (no shell, no auth gate)
  if (path === '/login' || path === '/auth/callback') return <>{children}</>;

  // Auth gate
  if (enabled) {
    if (authLoading) return <Spinner label="בודק התחברות..." />;
    if (!session) return <Spinner label="מעביר להתחברות..." />;
  }

  if (path === '/onboarding') return <>{children}</>;

  if (!loaded) return <Spinner label="טוען נתונים..." />;

  if (!onboardingComplete) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div key={path} className="page-enter">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
