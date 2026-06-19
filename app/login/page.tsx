'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import { SMS_2FA_ENABLED, GOOGLE_AUTH_ENABLED } from '@/lib/authConfig';
import { needsSecondFactor, getVerifiedPhoneFactor, startPhoneEnrollment, challengeFactor, verifyCode } from '@/lib/auth/mfa';
import { Home, LogIn, ShieldCheck, Smartphone, ArrowRight } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 009 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.41 5.41 0 010-3.44V4.95H.96a9 9 0 000 8.1l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 00.96 4.95L3.97 7.28C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

type Phase = 'credentials' | 'twofactor';

export default function LoginPage() {
  const { enabled, session, signIn } = useAuth();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // 2fa state
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [needPhone, setNeedPhone] = useState(false);

  useEffect(() => {
    if (!enabled || (session && phase === 'credentials')) router.replace('/dashboard');
  }, [enabled, session, phase, router]);

  const finishLogin = () => router.replace('/dashboard');

  const submitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: signErr } = await signIn(email.trim(), password);
    if (signErr) { setBusy(false); setError('פרטי ההתחברות שגויים. בדקו אימייל וסיסמה.'); return; }

    if (SMS_2FA_ENABLED) {
      try {
        if (await needsSecondFactor()) {
          const existing = await getVerifiedPhoneFactor();
          if (existing) {
            const ch = await challengeFactor(existing);
            if ('error' in ch) throw new Error(ch.error);
            setFactorId(existing); setChallengeId(ch.challengeId); setNeedPhone(false);
          } else {
            setNeedPhone(true);
          }
          setPhase('twofactor'); setBusy(false); return;
        }
      } catch (err) {
        setBusy(false);
        setError(err instanceof Error ? err.message : 'שגיאת אימות דו-שלבי');
        return;
      }
    }
    setBusy(false);
    finishLogin();
  };

  const sendEnrollment = async () => {
    setError(null); setBusy(true);
    const res = await startPhoneEnrollment(phone.trim());
    setBusy(false);
    if ('error' in res) { setError(res.error); return; }
    setFactorId(res.factorId); setChallengeId(res.challengeId); setNeedPhone(false);
  };

  const submitCode = async () => {
    if (!factorId || !challengeId) return;
    setError(null); setBusy(true);
    const res = await verifyCode(factorId, challengeId, code.trim());
    setBusy(false);
    if ('error' in res) { setError('הקוד שגוי או פג תוקף.'); return; }
    finishLogin();
  };

  const googleSignIn = async () => {
    setError(null);
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
    if (error) setError('התחברות עם Google נכשלה. ודאו שהספק מופעל ב-Supabase.');
  };

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-amber-400 bg-white text-right';

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl w-full max-w-sm p-7 space-y-5 pop-in">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: 'linear-gradient(145deg,#fbbf24,#f59e0b)', boxShadow: '0 6px 20px rgba(245,158,11,0.4)' }}>
            {phase === 'twofactor' ? <ShieldCheck size={26} className="text-white" /> : <Home size={26} className="text-white" />}
          </div>
          <h1 className="text-xl font-bold text-stone-900">מעבר לדירה</h1>
          <p className="text-stone-500 text-sm">
            {phase === 'twofactor' ? 'אימות דו-שלבי' : 'התחברו כדי לנהל את תקציב הדירה'}
          </p>
        </div>

        {phase === 'credentials' && (
          <>
            {GOOGLE_AUTH_ENABLED && (
              <>
                <button onClick={googleSignIn}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl font-semibold text-sm bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 active:scale-95">
                  <GoogleIcon /> המשך עם Google
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-stone-200" />
                  <span className="text-xs text-stone-400">או</span>
                  <div className="flex-1 h-px bg-stone-200" />
                </div>
              </>
            )}

            <form onSubmit={submitCredentials} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">אימייל</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" autoComplete="email" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">סיסמה</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" autoComplete="current-password" className={inputCls} />
              </div>
              {error && <p className="text-red-600 text-xs font-medium text-center">{error}</p>}
              <button type="submit" disabled={busy}
                className="w-full flex items-center justify-center gap-2 text-white py-2.5 rounded-xl font-semibold disabled:opacity-50"
                style={{ background: 'linear-gradient(145deg,#fbbf24,#f59e0b)', boxShadow: '0 4px 12px rgba(245,158,11,0.35)' }}>
                <LogIn size={16} /> {busy ? 'מתחבר...' : 'התחברות'}
              </button>
            </form>
          </>
        )}

        {phase === 'twofactor' && (
          <div className="space-y-3">
            {needPhone ? (
              <>
                <div className="flex items-center gap-2 text-sm text-stone-600 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <Smartphone size={16} className="text-amber-500 shrink-0" />
                  הזינו מספר טלפון לקבלת קוד אימות ב-SMS
                </div>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" placeholder="+9725XXXXXXXX" className={inputCls} />
                {error && <p className="text-red-600 text-xs font-medium text-center">{error}</p>}
                <button onClick={sendEnrollment} disabled={busy || !phone.trim()}
                  className="w-full flex items-center justify-center gap-2 text-white py-2.5 rounded-xl font-semibold disabled:opacity-50"
                  style={{ background: 'linear-gradient(145deg,#fbbf24,#f59e0b)' }}>
                  {busy ? 'שולח...' : 'שלח קוד'} <ArrowRight size={16} />
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-stone-600 text-center">הזינו את הקוד שנשלח ב-SMS</p>
                <input type="text" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} dir="ltr" placeholder="••••••"
                  className={inputCls + ' text-center tracking-[0.4em] text-lg'} maxLength={8} />
                {error && <p className="text-red-600 text-xs font-medium text-center">{error}</p>}
                <button onClick={submitCode} disabled={busy || code.trim().length < 4}
                  className="w-full flex items-center justify-center gap-2 text-white py-2.5 rounded-xl font-semibold disabled:opacity-50"
                  style={{ background: 'linear-gradient(145deg,#fbbf24,#f59e0b)' }}>
                  <ShieldCheck size={16} /> {busy ? 'מאמת...' : 'אימות והתחברות'}
                </button>
                <button onClick={() => { setPhase('credentials'); setError(null); setCode(''); }}
                  className="w-full text-xs text-stone-400 hover:text-stone-600">חזרה</button>
              </>
            )}
          </div>
        )}

        <p className="text-center text-[11px] text-stone-400">
          {phase === 'credentials' ? 'ניהול משתמשים מתבצע על ידי המנהל. אין הרשמה עצמית.' : 'אימות דו-שלבי נדרש בהתחברות עם אימייל'}
        </p>
      </div>
    </div>
  );
}
