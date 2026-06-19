'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { Home, LogIn } from 'lucide-react';

export default function LoginPage() {
  const { enabled, session, signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!enabled || session) router.replace('/dashboard');
  }, [enabled, session, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) setError('פרטי ההתחברות שגויים. בדקו אימייל וסיסמה.');
    else router.replace('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl w-full max-w-sm p-7 space-y-5">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: 'linear-gradient(145deg,#fbbf24,#f59e0b)', boxShadow: '0 6px 20px rgba(245,158,11,0.4)' }}>
            <Home size={26} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-stone-900">מעבר לדירה</h1>
          <p className="text-stone-500 text-sm">התחברו כדי לנהל את תקציב הדירה</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">אימייל</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              dir="ltr" autoComplete="email"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400 bg-white text-right" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">סיסמה</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              dir="ltr" autoComplete="current-password"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400 bg-white text-right" />
          </div>
          {error && <p className="text-red-600 text-xs font-medium text-center">{error}</p>}
          <button type="submit" disabled={busy}
            className="w-full flex items-center justify-center gap-2 text-white py-2.5 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(145deg,#fbbf24,#f59e0b)', boxShadow: '0 4px 12px rgba(245,158,11,0.35)' }}>
            <LogIn size={16} /> {busy ? 'מתחבר...' : 'התחברות'}
          </button>
        </form>

        <p className="text-center text-[11px] text-stone-400">
          ניהול משתמשים מתבצע על ידי המנהל. אין הרשמה עצמית.
        </p>
      </div>
    </div>
  );
}
