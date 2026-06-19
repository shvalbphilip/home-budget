import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/AppShell';
import { AuthProvider } from '@/lib/auth/AuthProvider';

export const metadata: Metadata = {
  title: 'מעבר לדירה – ניהול תקציב ומלאי',
  description: 'מערכת לניהול תקציב ומלאי למעבר דירה',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-stone-50">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
