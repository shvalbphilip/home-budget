'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Google (and any OAuth) redirect lands here. With flowType:'pkce' +
// detectSessionInUrl, supabase-js exchanges the code for a session
// automatically; we just wait for it and route onward.
export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return; done = true;
      router.replace(ok ? '/dashboard' : '/login');
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) finish(true);
    });

    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) finish(true);
      else { setError('ההתחברות נכשלה. נסו שוב.'); setTimeout(() => finish(false), 1500); }
    }, 4000);

    return () => { sub.subscription.unsubscribe(); clearTimeout(timer); };
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
          <p className="text-red-600 text-sm font-medium">{error}</p>
        )}
      </div>
    </div>
  );
}
