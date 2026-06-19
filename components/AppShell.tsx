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

  useEffect(() => {
    loadFromDB();
  }, []);

  // Auth gating (only active when NEXT_PUBLIC_AUTH_ENABLED=true)
  useEffect(() => {
    if (!enabled || authLoading) return;
    if (!session && path !== '/login') router.replace('/login');
    if (session && path === '/login') router.replace('/dashboard');
  }, [enabled, authLoading, session, path, router]);

  // Onboarding redirect (existing behaviour)
  useEffect(() => {
    if (!loaded) return;
    if (enabled && !session) return; // wait until authenticated
    if (!onboardingComplete && path !== '/onboarding') router.replace('/onboarding');
    if (onboardingComplete && path === '/onboarding') router.replace('/dashboard');
  }, [loaded, onboardingComplete, path, router, enabled, session]);

  // Login page renders bare (no shell)
  if (path === '/login') return <>{children}</>;

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
      <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
