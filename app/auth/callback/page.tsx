'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Google (and any OAuth) redirect lands here with ?code=... We explicitly
// exchange that code (PKCE) for a session, then route into the app.
export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fail = (msg: string) => {
      if (cancelled) return;
      setError(msg);
      setTimeout(() => router.replace('/login'), 1800);
    };

    (async () => {
      try {
        // already signed in?
        const { data: pre } = await supabase.auth.getSession();
        if (pre.session) { router.replace('/dashboard'); return; }

        const params = new URLSearchParams(window.location.search);
        const errDesc = params.get('error_description') || params.get('error');
        if (errDesc) { fail(decodeURIComponent(errDesc)); return; }

        const code = params.get('code');
        if (!code) { fail('לא התקבל קוד התחברות'); return; }

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error || !data.session) { fail('ההתחברות נכשלה, נסו שוב'); return; }

        if (!cancelled) router.replace('/dashboard');
      } catch {
        fail('שגיאת התחברות');
      }
    })();

    return () => { cancelled = true; };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        {!error ? (
          <>
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-stone-500 text-sm font-medium">מתחבר...</p>
          </>
        ) : (
          <p className="text-red-600 text-sm font-medium max-w-xs px-4">{error}</p>
        )}
      </div>
    </div>
  );
}
