'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { onboardingComplete, loaded, loadFromDB } = useStore();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    loadFromDB();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (!onboardingComplete && path !== '/onboarding') {
      router.replace('/onboarding');
    }
    if (onboardingComplete && path === '/onboarding') {
      router.replace('/dashboard');
    }
  }, [loaded, onboardingComplete, path, router]);

  if (path === '/onboarding') {
    return <>{children}</>;
  }

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-stone-500 text-sm font-medium">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  if (!onboardingComplete) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
